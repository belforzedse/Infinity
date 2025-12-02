import { apiClient } from "@/services";

export type ItemAdjustment = {
  orderItemId: number;
  newCount?: number;
  remove?: boolean;
};

export type AdjustPreview = {
  changes: Array<{
    orderItemId: number;
    oldCount: number;
    newCount: number;
    productTitle: string;
    restockDelta: number;
  }>;
  newTotals: {
    subtotal: number;
    discount: number;
    tax: number;
    shipping: number;
    total: number;
  };
  oldTotal: number;
  refundToman: number;
  newShipping: number;
};

export type AdjustResult = {
  success: boolean;
  refundToman: number;
  status: "adjusted" | "cancelled";
  paymentToken?: string | null;
};

export const previewAdjustItems = async (
  orderId: number,
  items: ItemAdjustment[]
): Promise<{ preview: AdjustPreview }> => {
  const response = await apiClient.post(
    `/orders/${orderId}/admin/adjust-items?dryRun=true`,
    { items }
  );
  return (response as any).data;
};

export const adjustItems = async (
  orderId: number,
  items: ItemAdjustment[],
  reason?: string
): Promise<AdjustResult> => {
  const response = await apiClient.post(
    `/orders/${orderId}/admin/adjust-items`,
    { items, reason }
  );
  return (response as any).data;
};

export const cancelOrder = async (
  orderId: number,
  reason?: string
): Promise<AdjustResult> => {
  const response = await apiClient.post(
    `/orders/${orderId}/admin/cancel`,
    { reason }
  );
  return (response as any).data;
};

export const voidShippingBarcode = async (
  orderId: number,
  reason?: string
): Promise<{ success: boolean }> => {
  const response = await apiClient.post(
    `/orders/${orderId}/admin/void-barcode`,
    { reason }
  );
  return (response as any).data;
};

export type OrderLifecycleStatus = "Paying" | "Started" | "Shipment" | "Done" | "Returned" | "Cancelled";

export const ORDER_STATUSES: OrderLifecycleStatus[] = [
  "Paying",
  "Started",
  "Shipment",
  "Done",
  "Returned",
  "Cancelled",
];

export const ORDER_STATUS_LABELS: Record<OrderLifecycleStatus, string> = {
  Paying: "در حال پرداخت",
  Started: "درحال پردازش",
  Shipment: "در حال ارسال",
  Done: "تکمیل شده",
  Returned: "مرجوع شده",
  Cancelled: "لغو شده",
};

export const changeOrderStatus = async (
  orderId: string,
  status: OrderLifecycleStatus,
) => {
  const response = await apiClient.put(`/orders/${orderId}`, {
    data: {
      Status: status,
    },
  });
  return (response as any).data;
};
