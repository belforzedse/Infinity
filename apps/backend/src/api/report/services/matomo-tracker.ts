/**
 * Server-side Matomo Ecommerce tracking.
 *
 * Records confirmed purchases against the authoritative order/payment state via
 * Matomo's HTTP Tracking API (`matomo.php`, `idgoal=0`). This is the reliable
 * counterpart to the optimistic client-side funnel events: it fires only after
 * payment has been verified and the order committed.
 *
 * Safety contract (see the implementation plan): this module is **purely
 * additive**. The single caller (`clearCartAfterPayment`) invokes it
 * fire-and-forget AFTER the order is already confirmed and the user response is
 * decided. Every public function swallows its own errors and is time-bounded, so
 * a slow/unavailable Matomo can never block, delay, or fail a payment — the worst
 * case is one missing analytics data point.
 *
 * Idempotency: a Redis `SET NX` marker per order means refreshes, webhook
 * retries, and repeated callbacks cannot record the same order twice. If Redis
 * is unavailable we deliberately SKIP tracking rather than risk a duplicate.
 */

import { RedisClient } from "../../../index";

const ECOMMERCE_ORDER_GOAL = 0; // Matomo convention: idgoal=0 == ecommerce order
const TRACKED_MARKER_TTL_SEC = 60 * 60 * 24 * 30; // 30 days
const DEFAULT_TIMEOUT_MS = 4000;

type StrapiLike = {
  log?: { info: (...a: any[]) => void; warn: (...a: any[]) => void; error: (...a: any[]) => void };
  entityService: { findOne: (uid: string, id: number, opts?: any) => Promise<any> };
};

export function isServerEcommerceTrackingEnabled(): boolean {
  if (!process.env.MATOMO_BASE_URL || !process.env.MATOMO_SITE_ID || !process.env.MATOMO_API_TOKEN) {
    return false;
  }
  const flag = String(process.env.MATOMO_SERVER_TRACKING_ENABLED ?? "").trim().toLowerCase();
  if (["0", "false", "no", "off"].includes(flag)) return false;
  // Enabled by default when Matomo is configured.
  return true;
}

function ensureTrailingSlash(value: string): string {
  return value.endsWith("/") ? value : `${value}/`;
}

function toNumber(value: unknown): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

/**
 * Claim the right to track this order exactly once. Returns true only for the
 * first caller. Returns false on any Redis error so we never double-count.
 */
async function claimOrderTracking(orderId: number): Promise<boolean> {
  try {
    const client = await RedisClient;
    const key = `matomo:order-tracked:${orderId}`;
    const result = await client.set(key, "1", { NX: true, EX: TRACKED_MARKER_TTL_SEC });
    return result === "OK";
  } catch {
    return false;
  }
}

/** Release the idempotency marker (used only if the send fails, so a retry can re-claim). */
async function releaseOrderTracking(orderId: number): Promise<void> {
  try {
    const client = await RedisClient;
    await client.del(`matomo:order-tracked:${orderId}`);
  } catch {
    /* best-effort */
  }
}

type EcommerceOrderInput = {
  orderId: number;
  /** Opaque internal user id, to match the client-side setUserId attribution. */
  userId?: string | number | null;
  subtotalToman: number;
  discountToman: number;
  shippingToman: number;
  taxToman: number;
  items: Array<{ sku: string; name: string; category?: string; priceToman: number; quantity: number }>;
};

/**
 * Build the Matomo Tracking API URL for an ecommerce order. Currency-wise we
 * send Toman amounts; the Matomo site currency must be configured to match (see
 * MATOMO.md) so revenue reconciles with the Strapi-truth order totals.
 */
export function buildEcommerceTrackingUrl(input: EcommerceOrderInput): string {
  const baseUrl = process.env.MATOMO_BASE_URL as string;
  const siteId = process.env.MATOMO_SITE_ID as string;
  const apiToken = process.env.MATOMO_API_TOKEN as string;
  const urlBase =
    process.env.MATOMO_TRACKING_URL_BASE ||
    process.env.FRONTEND_BASE_URL ||
    process.env.FRONTEND_URL ||
    "https://infinitycolor.co";

  const grandTotal =
    input.subtotalToman - input.discountToman + input.shippingToman + input.taxToman;

  const endpoint = new URL("matomo.php", ensureTrailingSlash(baseUrl));
  const p = endpoint.searchParams;
  p.set("idsite", String(siteId));
  p.set("rec", "1");
  p.set("apiv", "1");
  p.set("send_image", "0");
  p.set("token_auth", apiToken);
  p.set("url", `${urlBase.replace(/\/$/, "")}/orders/success?order=${input.orderId}`);
  p.set("action_name", "Ecommerce/Order");

  // Ecommerce order fields.
  p.set("idgoal", String(ECOMMERCE_ORDER_GOAL));
  p.set("ec_id", String(input.orderId));
  p.set("revenue", String(Math.max(0, Math.round(grandTotal))));
  p.set("ec_st", String(Math.max(0, Math.round(input.subtotalToman))));
  p.set("ec_tx", String(Math.max(0, Math.round(input.taxToman))));
  p.set("ec_sh", String(Math.max(0, Math.round(input.shippingToman))));
  p.set("ec_dt", String(Math.max(0, Math.round(input.discountToman))));

  // ec_items: array of [sku, name, category, price, quantity].
  const ecItems = input.items.map((item) => [
    item.sku || "",
    item.name || "",
    item.category || "",
    Math.max(0, Math.round(item.priceToman)),
    Math.max(1, Math.round(item.quantity)),
  ]);
  p.set("ec_items", JSON.stringify(ecItems));

  // Tie the order to the same opaque user identity used client-side, when known.
  if (input.userId !== undefined && input.userId !== null && String(input.userId).trim()) {
    p.set("uid", String(input.userId).trim());
  }

  return endpoint.toString();
}

async function postTracking(url: string): Promise<void> {
  const timeoutMs = Number(process.env.MATOMO_TIMEOUT_MS) || DEFAULT_TIMEOUT_MS;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  try {
    await fetch(url, { method: "GET", signal: controller.signal });
  } finally {
    clearTimeout(timeoutId);
  }
}

/**
 * Track a confirmed order. Safe to call fire-and-forget. Never throws.
 * Returns true when a hit was sent, false when skipped (disabled, duplicate,
 * not found, or error).
 */
export async function trackOrderToMatomo(strapi: StrapiLike, orderId: number): Promise<boolean> {
  if (!isServerEcommerceTrackingEnabled()) return false;
  if (!orderId || !Number.isFinite(Number(orderId))) return false;

  // Idempotency claim BEFORE doing any work.
  const claimed = await claimOrderTracking(orderId);
  if (!claimed) return false;

  try {
    const order = await strapi.entityService.findOne("api::order.order", orderId, {
      populate: { order_items: true, user: { fields: ["id"] } },
    });
    if (!order) {
      await releaseOrderTracking(orderId);
      return false;
    }

    const items = Array.isArray(order.order_items) ? order.order_items : [];
    const lineItems = items.map((it: any) => ({
      sku: String(it?.ProductSKU || ""),
      name: String(it?.ProductTitle || ""),
      priceToman: toNumber(it?.PerAmount),
      quantity: toNumber(it?.Count) || 1,
    }));
    const subtotalToman = lineItems.reduce(
      (sum: number, it) => sum + it.priceToman * it.quantity,
      0,
    );

    const url = buildEcommerceTrackingUrl({
      orderId,
      userId: order?.user?.id ?? null,
      subtotalToman,
      discountToman: toNumber(order?.AppliedDiscountAmount),
      shippingToman: toNumber(order?.ShippingCost),
      taxToman: toNumber(order?.ShippingTax),
      items: lineItems,
    });

    await postTracking(url);
    strapi.log?.info?.("[matomo] ecommerce order tracked", { orderId });
    return true;
  } catch (error) {
    // Release the marker so a later retry/webhook can attempt again.
    await releaseOrderTracking(orderId);
    strapi.log?.warn?.("[matomo] ecommerce order tracking failed (non-fatal)", {
      orderId,
      error: (error as Error)?.message,
    });
    return false;
  }
}
