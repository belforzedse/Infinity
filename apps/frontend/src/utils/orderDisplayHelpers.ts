/**
 * Shared helpers for mapping Order to display props (OrderCard/OrderRow).
 * Used by reserve group page and orders Tabs.
 */

import type { PersianOrderStatus } from "@/constants/enums";
import type { Order } from "@/services/order";
import { getOrderStatusCategory } from "@/utils/statusTranslations";

export function formatOrderDate(dateString: string): string {
  return new Intl.DateTimeFormat("fa-IR", {
    year: "numeric",
    month: "numeric",
    day: "numeric",
  }).format(new Date(dateString));
}

export function formatOrderTime(dateString: string): string {
  return new Intl.DateTimeFormat("fa-IR", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(dateString));
}

export function persistOrderSnapshot(order: Order): void {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.setItem(`infinity:order-detail:${order.id}`, JSON.stringify(order));
  } catch {
    // ignore
  }
}

export interface OrderDisplayRowProps {
  id: string;
  title: string;
  date: string;
  time: string;
  price: string;
  status: PersianOrderStatus;
  image: string;
  category: string;
  orderId?: number;
  shippingBarcode?: string;
  detailHref: string;
  onViewDetails: () => void;
  onOpenFullDetails?: () => void;
  isReserveOrder?: boolean;
  reserveExpiresAt?: string | null;
  reserveGroupOrderCount?: number;
  onReleaseReserve?: (orderId: number) => void;
  isReleasingReserve?: boolean;
  rawOrder?: Order | null;
  isGroupRow?: boolean;
  sortDate?: string;
}

export interface MapOrderToDisplayPropsContext {
  imageBaseUrl: string;
  placeholderImage: string;
  formatDate: (dateString: string) => string;
  formatTime: (dateString: string) => string;
  faNum: (n: number) => string;
  /** Used when all listed orders are in one group (e.g. reserve page). Otherwise use getReserveGroupCount. */
  ordersLength: number;
  /** When provided (e.g. Tabs), used to compute reserveGroupOrderCount per order. */
  getReserveGroupCount?: (order: Order) => number | undefined;
  handleReleaseReserve: (orderId: number) => void;
  persistOrderSnapshot: (order: Order) => void;
  releasingOrderId: number | null;
  setSelectedOrder: (order: Order | null) => void;
}

/**
 * Maps a single API Order to the props shape expected by OrderCard/OrderRow.
 */
export function mapOrderToDisplayProps(
  order: Order,
  context: MapOrderToDisplayPropsContext,
): OrderDisplayRowProps {
  const firstItem = order.order_items?.[0];
  const product = firstItem?.product_variation?.product as
    | { cover_image?: { url?: string }; CoverImage?: { url?: string }; Title?: string }
    | null
    | undefined;
  const coverImage = product?.cover_image ?? product?.CoverImage;
  const image = coverImage?.url
    ? `${context.imageBaseUrl}${coverImage.url}`
    : context.placeholderImage;
  const category =
    firstItem?.product_variation?.product?.Title ??
    firstItem?.ProductTitle ??
    "محصول";
  const totalPrice =
    (order.order_items?.reduce((sum, item) => sum + item.Count * item.PerAmount, 0) ?? 0) +
    (order.ShippingCost ?? 0);
  const status = getOrderStatusCategory(order.Status);

  const reserveGroupOrderCount = context.getReserveGroupCount
    ? context.getReserveGroupCount(order)
    : order.reserveGroupId && order.isReserveOrder && context.ordersLength > 0
      ? context.ordersLength
      : undefined;

  return {
    id: order.id.toString(),
    title: `سفارش شماره #${order.id}`,
    date: context.formatDate(order.createdAt),
    time: context.formatTime(order.createdAt),
    price: context.faNum(totalPrice),
    status,
    image,
    category,
    orderId: order.id,
    shippingBarcode: order.ShippingBarcode,
    detailHref: `/orders/${order.id}`,
    isReserveOrder: order.isReserveOrder,
    reserveExpiresAt: order.reserveExpiresAt,
    reserveGroupOrderCount,
    onReleaseReserve: context.handleReleaseReserve,
    isReleasingReserve: context.releasingOrderId === order.id,
    onViewDetails: () => context.setSelectedOrder(order),
    onOpenFullDetails: () => context.persistOrderSnapshot(order),
    rawOrder: order,
    isGroupRow: false,
    sortDate: order.createdAt,
  };
}
