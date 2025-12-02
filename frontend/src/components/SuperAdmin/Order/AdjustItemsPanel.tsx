import { useState } from "react";
import type { SuperAdminOrderDetail } from "@/types/super-admin/order";
import {
  previewAdjustItems,
  adjustItems,
  ItemAdjustment,
  AdjustPreview,
  voidShippingBarcode,
} from "@/services/super-admin/orders/adjustItems";
import toast from "react-hot-toast";

const ALLOWED_STATUSES = [
  "پرداخت شده",
  "Started",
  "درحال پرداخت",
  "Paying",
];

type Props = {
  order: SuperAdminOrderDetail;
  onSuccess: () => void;
};

export default function AdjustItemsPanel({ order, onSuccess }: Props) {
  const [quantities, setQuantities] = useState<Record<number, number>>(
    Object.fromEntries(order.items.map((it) => [it.id, it.quantity]))
  );
  const [preview, setPreview] = useState<AdjustPreview | null>(null);
  const [loading, setLoading] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [forceEdit, setForceEdit] = useState(false);
  const [voidLoading, setVoidLoading] = useState(false);

  // Check if this is a SnappPay order (has transaction ID and payment token)
  const isSnappPayOrder = Boolean(order.transactionId && order.paymentToken);

  const hasAllowedStatus = ALLOWED_STATUSES.includes(order.orderStatus);
  const hasShippingBarcode = Boolean(order.shippingBarcode);
  const isBlocked = !hasAllowedStatus || hasShippingBarcode;
  const canEdit = forceEdit || !isBlocked;

  const reasons: string[] = [];
  if (!hasAllowedStatus) {
    reasons.push(
      `وضعیت فعلی سفارش (${order.orderStatus || "نامشخص"}) خارج از وضعیت‌های مجاز برای ویرایش است.`
    );
  }
  if (hasShippingBarcode) {
    reasons.push(
      "برای سفارش‌هایی که بارکد ارسال دارند ویرایش آیتم‌ها به صورت پیش‌فرض غیرفعال است."
    );
  }

  const handleVoidBarcode = async () => {
    if (voidLoading) return;

    // Safety check - ensure there's actually a barcode to remove
    if (!order.shippingBarcode) {
      toast.error("این سفارش دارای بارکد ارسال نیست.");
      onSuccess(); // Reload data to sync UI
      return;
    }

    const confirmed = window.confirm(
      "آیا از حذف بارکد ارسال مطمئن هستید؟ این عملیات قابل بازگشت نیست."
    );
    if (!confirmed) return;

    const reason =
      window.prompt("دلیل حذف بارکد را بنویسید (اختیاری):")?.trim() || undefined;

    setVoidLoading(true);
    try {
      await voidShippingBarcode(order.id, reason);
      toast.success("بارکد ارسال با موفقیت حذف شد.");
      setForceEdit(false);
      onSuccess();
    } catch (error: any) {
      const errorMsg = error.response?.data?.error || "حذف بارکد ارسال با خطا مواجه شد";
      toast.error(errorMsg);
      // Reload data even on error to sync with server state
      onSuccess();
    } finally {
      setVoidLoading(false);
    }
  };

  const handleQuantityChange = (itemId: number, value: number) => {
    const item = order.items.find((it) => it.id === itemId);
    if (!item) return;
    const clamped = Math.max(0, Math.min(item.quantity, value));
    setQuantities((prev) => ({ ...prev, [itemId]: clamped }));
    setPreview(null);
  };

  const handlePreview = async () => {
    const items: ItemAdjustment[] = order.items
      .filter((it) => quantities[it.id] !== it.quantity)
      .map((it) => ({
        orderItemId: it.id,
        newCount: quantities[it.id],
        remove: quantities[it.id] === 0,
      }));

    if (items.length === 0) {
      toast.error("تغییری اعمال نشده است");
      return;
    }

    setLoading(true);
    try {
      const result = await previewAdjustItems(order.id, items);
      setPreview(result.preview);
    } catch (error: any) {
      if (error.response?.data?.data?.error === "barcode_exists") {
        toast.error("بارکد ارسال صادر شده؛ ابتدا آن را باطل کنید");
      } else if (
        error.response?.data?.data?.error === "negative_refund_not_allowed"
      ) {
        toast.error("کاهش موارد باعث افزایش مبلغ می‌شود");
      } else {
        toast.error(error.response?.data?.error || "خطا در پیش‌نمایش");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleApply = async () => {
    if (!preview) return;

    const items: ItemAdjustment[] = order.items
      .filter((it) => quantities[it.id] !== it.quantity)
      .map((it) => ({
        orderItemId: it.id,
        newCount: quantities[it.id],
        remove: quantities[it.id] === 0,
      }));

    setLoading(true);
    try {
      const result = await adjustItems(order.id, items);

      // Build message based on payment method
      let baseMessage: string;
      if (isSnappPayOrder) {
        // For SnappPay orders, no wallet refund - just confirm the changes
        // Don't show any refund message to user for SnappPay
        baseMessage =
          result.status === "cancelled"
            ? "سفارش لغو شد"
            : "تغییرات اعمال شد";
      } else {
        // For other payment methods, refund to wallet
        baseMessage =
          result.status === "cancelled"
            ? "سفارش لغو و کل مبلغ به کیف پول بازگشت داده شد"
            : `تغییرات اعمال شد. مبلغ ${result.refundToman.toLocaleString(
                "fa-IR"
              )} تومان به کیف پول بازگشت داده شد`;
      }

      // Only show token message if present (for debugging purposes)
      const tokenMessage = result.paymentToken && !isSnappPayOrder
        ? ` (توکن پرداخت: ${result.paymentToken})`
        : "";
      toast.success(baseMessage + tokenMessage);
      setShowConfirm(false);
      setPreview(null);
      onSuccess();
    } catch (error: any) {
      const rawError = error.response?.data?.error;
      if (typeof rawError === "string" && rawError.startsWith("SNAPPAY_")) {
        toast.error("به‌روزرسانی SnappPay با خطا روبه‌رو شد؛ لطفاً وضعیت پرداخت را بررسی کنید.");
      } else {
        toast.error(rawError || "خطا در اعمال تغییرات");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm p-6 mb-6 border border-gray-200">
      <h3 className="text-lg font-semibold mb-4 text-gray-900">
        ویرایش اقلام سفارش
      </h3>

      {isBlocked && !forceEdit ? (
        <div className="mb-4 rounded-md border border-yellow-200 bg-yellow-50 p-4 text-sm text-yellow-900">
          <h4 className="mb-2 font-semibold">ویرایش در حال حاضر مجاز نیست</h4>
          <ul className="space-y-1">
            {reasons.map((reason, index) => (
              <li key={index}>{reason}</li>
            ))}
          </ul>
          {hasShippingBarcode && order.shippingBarcode ? (
            <div className="mt-3 rounded-md border border-yellow-300 bg-white/60 p-3 text-xs text-yellow-900">
              <div className="mb-2">
                <span className="font-semibold">بارکد فعلی:</span>{" "}
                <span className="ltr text-gray-800">{order.shippingBarcode}</span>
              </div>
              {order.paymentToken ? (
                <div className="mb-2">
                  <span className="font-semibold">توکن پرداخت SnappPay:</span>{" "}
                  <span className="ltr text-gray-800">{order.paymentToken}</span>
                </div>
              ) : null}
              <p className="mb-2">
                برای ادامه می‌توانید بارکد ارسال را به صورت دستی حذف کنید.
              </p>
              <button
                onClick={handleVoidBarcode}
                disabled={voidLoading}
                className="rounded-md bg-red-500 px-3 py-1 text-white hover:bg-red-600 disabled:opacity-60"
              >
                {voidLoading ? "در حال حذف..." : "حذف بارکد ارسال"}
              </button>
            </div>
          ) : null}
          <p className="mt-3 text-xs text-yellow-800">
            در صورت نیاز برای سناریوهای تست (مثل SnappPay) می‌توانید ویرایش دستی
            را فعال کنید. لطفاً بعد از تست، سفارش را به وضعیت استاندارد بازگردانید.
          </p>
          <button
            onClick={() => setForceEdit(true)}
            className="mt-3 rounded-md bg-red-100 px-3 py-1 text-sm text-red-700 hover:bg-red-200"
          >
            فعال‌سازی ویرایش دستی
          </button>
        </div>
      ) : null}

      {forceEdit ? (
        <div className="mb-4 rounded-md border border-red-200 bg-red-50 p-3 text-xs text-red-700">
          ویرایش دستی فعال است؛ لطفاً با احتیاط ادامه دهید.
        </div>
      ) : null}

      {!canEdit ? null : (
        <>
          <div className="space-y-3 mb-4">
            {order.items.map((item) => (
              <div
                key={item.id}
                className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg"
              >
                <img
                  src={item.image}
                  alt={item.productName}
                  className="w-16 h-16 object-cover rounded"
                />
                <div className="flex-1">
                  <p className="font-medium text-gray-900">{item.productName}</p>
                  <p className="text-sm text-gray-600">
                    قیمت: {item.price.toLocaleString("fa-IR")} تومان
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <label className="text-sm text-gray-700">تعداد:</label>
                  <input
                    type="number"
                    min={0}
                    max={item.quantity}
                    value={quantities[item.id]}
                    onChange={(e) =>
                      handleQuantityChange(
                        item.id,
                        parseInt(e.target.value) || 0
                      )
                    }
                    className="w-20 px-3 py-1 border border-gray-300 rounded-md text-center"
                  />
                  <span className="text-sm text-gray-500">
                    / {item.quantity.toLocaleString("fa-IR")}
                  </span>
                </div>
                <button
                  onClick={() => handleQuantityChange(item.id, 0)}
                  className="px-3 py-1 bg-red-100 text-red-700 rounded-md hover:bg-red-200 text-sm"
                >
                  حذف
                </button>
              </div>
            ))}
          </div>

          {preview && (
            <div className="mb-4 rounded-lg border border-blue-200 bg-blue-50 p-4">
              <h4 className="mb-2 font-semibold text-blue-900">
                پیش‌نمایش تغییرات
              </h4>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span>جمع جزء جدید:</span>
                  <span className="font-medium">
                    {preview.newTotals.subtotal.toLocaleString("fa-IR")} تومان
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>تخفیف:</span>
                  <span className="font-medium">
                    {preview.newTotals.discount.toLocaleString("fa-IR")} تومان
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>هزینه ارسال:</span>
                  <span className="font-medium">
                    {preview.newShipping.toLocaleString("fa-IR")} تومان
                  </span>
                </div>
                <div className="flex justify-between border-t border-blue-300 pt-2">
                  <span className="font-semibold">جمع کل جدید:</span>
                  <span className="font-semibold">
                    {preview.newTotals.total.toLocaleString("fa-IR")} تومان
                  </span>
                </div>
                {!isSnappPayOrder && (
                  <div className="flex justify-between border-t border-blue-300 pt-2 text-green-700">
                    <span className="font-semibold">مبلغ بازگشت به کیف پول:</span>
                    <span className="font-semibold">
                      {preview.refundToman.toLocaleString("fa-IR")} تومان
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="flex gap-3">
            <button
              onClick={handlePreview}
              disabled={loading}
              className="rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? "در حال بارگذاری..." : "پیش‌نمایش تغییرات"}
            </button>

            {preview && (
              <button
                onClick={() => setShowConfirm(true)}
                disabled={loading}
                className="rounded-md bg-green-600 px-4 py-2 text-white hover:bg-green-700 disabled:opacity-50"
              >
                ثبت تغییرات
              </button>
            )}
          </div>

          {showConfirm && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
              <div className="w-full max-w-md rounded-lg bg-white p-6">
                <h3 className="mb-4 text-lg font-semibold">تأیید تغییرات</h3>
                <p className="mb-6 text-gray-700">
                  آیا از اعمال این تغییرات اطمینان دارید؟ این عملیات غیرقابل
                  برگشت است.
                </p>
                <div className="flex justify-end gap-3">
                  <button
                    onClick={() => setShowConfirm(false)}
                    className="rounded-md bg-gray-200 px-4 py-2 text-gray-800 hover:bg-gray-300"
                  >
                    انصراف
                  </button>
                  <button
                    onClick={handleApply}
                    disabled={loading}
                    className="rounded-md bg-green-600 px-4 py-2 text-white hover:bg-green-700 disabled:opacity-50"
                  >
                    {loading ? "در حال اعمال..." : "تأیید"}
                  </button>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
