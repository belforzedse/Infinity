export type StatusTone = "info" | "success" | "warning" | "danger";

interface StatusMeta {
  label: string;
  tone: StatusTone;
}

const normalizeKey = (value?: string | null) => {
  if (!value) return "";
  return value.toString().trim().toLowerCase().replace(/[_-]+/g, " ").replace(/\s+/g, " ");
};

const ORDER_STATUS_MAP: Record<string, StatusMeta> = {
  paying: { label: "در حال پرداخت", tone: "warning" },
  "paying offline": { label: "در حال پرداخت", tone: "warning" },
  started: { label: "ثبت شده", tone: "info" },
  pending: { label: "در انتظار", tone: "info" },
  processing: { label: "در حال پردازش", tone: "info" },
  "in progress": { label: "در حال پردازش", tone: "info" },
  shipment: { label: "در حال ارسال", tone: "warning" },
  shipped: { label: "ارسال شده", tone: "warning" },
  delivery: { label: "در حال تحویل", tone: "warning" },
  delivered: { label: "تحویل شده", tone: "success" },
  done: { label: "تکمیل شده", tone: "success" },
  completed: { label: "تکمیل شده", tone: "success" },
  success: { label: "موفق", tone: "success" },
  cancelled: { label: "لغو شده", tone: "danger" },
  canceled: { label: "لغو شده", tone: "danger" },
  returned: { label: "مرجوع شده", tone: "danger" },
  failed: { label: "ناموفق", tone: "danger" },
  refund: { label: "بازپرداخت شده", tone: "info" },
};

const PAYMENT_STATUS_MAP: Record<string, StatusMeta> = {
  success: { label: "موفق", tone: "success" },
  succeeded: { label: "موفق", tone: "success" },
  pending: { label: "در انتظار", tone: "warning" },
  processing: { label: "در حال پردازش", tone: "info" },
  failed: { label: "ناموفق", tone: "danger" },
  cancelled: { label: "لغو شده", tone: "danger" },
  canceled: { label: "لغو شده", tone: "danger" },
  refunded: { label: "بازپرداخت شد", tone: "info" },
};

const CONTRACT_STATUS_MAP: Record<string, string> = {
  "not ready": "آماده نشده",
  confirmed: "تایید شده",
  finished: "تکمیل شده",
  failed: "ناموفق",
  cancelled: "لغو شده",
  canceled: "لغو شده",
};

const CART_STATUS_MAP: Record<string, string> = {
  pending: "در حال تصمیم‌گیری",
  payment: "در انتظار پرداخت",
  left: "رها شده",
  completed: "تکمیل شده",
};

const COMMENT_STATUS_MAP: Record<string, string> = {
  accepted: "تایید شده",
  rejected: "رد شده",
  pending: "در حال بررسی",
};

const ORDER_LOG_TRANSLATIONS: Array<{ key: string; label: string }> = [
  { key: "create", label: "سفارش ثبت شد" },
  { key: "order created", label: "سفارش ثبت شد" },
  { key: "payment", label: "پرداخت ثبت شد" },
  { key: "payment recorded", label: "پرداخت ثبت شد" },
  { key: "payment updated", label: "پرداخت بروزرسانی شد" },
  { key: "success", label: "پرداخت موفق بود" },
  { key: "fail", label: "پرداخت ناموفق بود" },
  { key: "ship", label: "سفارش ارسال شد" },
  { key: "deliver", label: "سفارش تحویل شد" },
  { key: "cancel", label: "سفارش لغو شد" },
  { key: "return", label: "مرجوعی ثبت شد" },
  { key: "status changed", label: "وضعیت سفارش بروزرسانی شد" },
  { key: "order updated", label: "سفارش بروزرسانی شد" },
  { key: "contract created", label: "قرارداد ایجاد شد" },
  { key: "contract failed", label: "قرارداد با خطا مواجه شد" },
];

const PAYMENT_GATEWAY_MAP: Record<string, string> = {
  wallet: "کیف پول",
  "wallet gateway": "کیف پول",
  "wallet payment": "کیف پول",
  mellat: "بانک ملت",
  "mellat bank": "بانک ملت",
  "beh pardakht": "بانک ملت",
  "snapp pay": "پرداخت اقساطی اسنپ‌پی",
  snappay: "پرداخت اقساطی اسنپ‌پی",
  "snapp pay installment": "پرداخت اقساطی اسنپ‌پی",
  samankish: "درگاه پرداخت سامان‌کیش",
  saman: "درگاه پرداخت سامان‌کیش",
  "saman kish": "درگاه پرداخت سامان‌کیش",
};

const GENERIC_TRANSLATIONS: Record<string, string> = {
  pending: "در انتظار",
  success: "موفق",
  failed: "ناموفق",
  cancelled: "لغو شده",
  canceled: "لغو شده",
};

const getMeta = (map: Record<string, StatusMeta>, value?: string | null): StatusMeta => {
  if (!value) {
    return { label: "نامشخص", tone: "info" };
  }
  const normalized = normalizeKey(value);
  return map[normalized] ?? { label: value, tone: "info" };
};

export const getOrderStatusMeta = (status?: string | null): StatusMeta => {
  return getMeta(ORDER_STATUS_MAP, status);
};

export const translateOrderStatus = (status?: string | null): string =>
  getOrderStatusMeta(status).label;

export const getPaymentStatusMeta = (status?: string | null): StatusMeta => {
  return getMeta(PAYMENT_STATUS_MAP, status);
};

export const translatePaymentStatus = (status?: string | null): string =>
  getPaymentStatusMeta(status).label;

export const translateContractStatus = (status?: string | null): string => {
  if (!status) return "نامشخص";
  const normalized = normalizeKey(status);
  return CONTRACT_STATUS_MAP[normalized] ?? status;
};

export const translateCartStatus = (status?: string | null): string => {
  if (!status) return "نامشخص";
  const normalized = normalizeKey(status);
  return CART_STATUS_MAP[normalized] ?? status;
};

export const translateCommentStatus = (status?: string | null): string => {
  if (!status) return "نامشخص";
  const normalized = normalizeKey(status);
  return COMMENT_STATUS_MAP[normalized] ?? status;
};

export const translateOrderLogMessage = (message?: string | null): string => {
  if (!message) return "بروزرسانی";
  const normalized = normalizeKey(message);
  for (const entry of ORDER_LOG_TRANSLATIONS) {
    if (normalized.includes(entry.key)) {
      return entry.label;
    }
  }
  return translateBackendValue(message);
};

export const translateBackendValue = (value?: string | null): string => {
  if (!value) return "نامشخص";
  const normalized = normalizeKey(value);

  if (ORDER_STATUS_MAP[normalized]) return ORDER_STATUS_MAP[normalized].label;
  if (PAYMENT_STATUS_MAP[normalized]) return PAYMENT_STATUS_MAP[normalized].label;
  if (CONTRACT_STATUS_MAP[normalized]) return CONTRACT_STATUS_MAP[normalized];
  if (CART_STATUS_MAP[normalized]) return CART_STATUS_MAP[normalized];
  if (COMMENT_STATUS_MAP[normalized]) return COMMENT_STATUS_MAP[normalized];
  if (GENERIC_TRANSLATIONS[normalized]) return GENERIC_TRANSLATIONS[normalized];

  return value;
};

export const translatePaymentGateway = (value?: string | null): string => {
  if (!value) return "نامشخص";
  const normalized = normalizeKey(value);
  return PAYMENT_GATEWAY_MAP[normalized] ?? value;
};
