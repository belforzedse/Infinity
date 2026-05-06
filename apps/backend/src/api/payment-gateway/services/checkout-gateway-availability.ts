import { Strapi } from "@strapi/strapi";

export type CheckoutGatewayCode = "samankish" | "mellat" | "snappay" | "wallet";

export type CheckoutGatewayItem = {
  code: CheckoutGatewayCode;
  title: string;
};

export const SUPPORTED_CHECKOUT_GATEWAYS: readonly CheckoutGatewayItem[] = [
  { code: "samankish", title: "سامان‌کیش" },
  { code: "mellat", title: "بانک ملت" },
  { code: "snappay", title: "پرداخت اقساطی اسنپ‌پی" },
  { code: "wallet", title: "کیف پول" },
] as const;

const SUPPORTED_CODES = new Set<CheckoutGatewayCode>(
  SUPPORTED_CHECKOUT_GATEWAYS.map((gateway) => gateway.code),
);

const normalizeText = (value: unknown): string =>
  String(value || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");

const mapGatewayTitleToCode = (title: unknown): CheckoutGatewayCode | null => {
  const normalized = normalizeText(title);
  if (!normalized) return null;

  if (normalized.includes("snapp") || normalized.includes("اسنپ")) return "snappay";
  if (normalized.includes("saman") || normalized.includes("سامان")) return "samankish";
  if (normalized.includes("mellat") || normalized.includes("ملت")) return "mellat";
  if (normalized.includes("wallet") || normalized.includes("کیف")) return "wallet";

  return null;
};

const resolveGatewayAvailabilityMap = async (
  strapi: Strapi,
): Promise<Map<CheckoutGatewayCode, boolean>> => {
  const availability = new Map<CheckoutGatewayCode, boolean>();
  for (const gateway of SUPPORTED_CHECKOUT_GATEWAYS) {
    availability.set(gateway.code, true);
  }

  try {
    const rows = (await strapi.entityService.findMany(
      "api::payment-gateway.payment-gateway",
      {
        fields: ["Title", "IsActive"],
        pagination: { page: 1, pageSize: 200 },
      },
    )) as Array<{ Title?: string; IsActive?: boolean }> | null;

    for (const row of rows || []) {
      const mappedCode = mapGatewayTitleToCode(row?.Title);
      if (!mappedCode || !SUPPORTED_CODES.has(mappedCode)) continue;

      if (row?.IsActive === false) {
        availability.set(mappedCode, false);
      }
    }

    return availability;
  } catch (error) {
    strapi.log.error("resolveGatewayAvailabilityMap: failed to fetch payment gateways", {
      error,
    });
    return availability;
  }
};

export const getAvailableCheckoutGateways = async (
  strapi: Strapi,
): Promise<CheckoutGatewayItem[]> => {
  const availability = await resolveGatewayAvailabilityMap(strapi);
  return SUPPORTED_CHECKOUT_GATEWAYS.filter(
    (gateway) => availability.get(gateway.code) !== false,
  );
};

export const normalizeCheckoutGatewayCode = (
  rawGateway?: string | null,
): CheckoutGatewayCode | null => {
  const normalized = normalizeText(rawGateway);
  if (!normalized) return null;

  if (normalized === "saman" || normalized === "samankish") return "samankish";
  if (normalized === "mellat") return "mellat";
  if (normalized === "snappay") return "snappay";
  if (normalized === "wallet") return "wallet";

  return null;
};

export const isCheckoutGatewayEnabled = async (
  strapi: Strapi,
  gatewayCode: CheckoutGatewayCode,
): Promise<boolean> => {
  const availability = await resolveGatewayAvailabilityMap(strapi);
  return availability.get(gatewayCode) !== false;
};
