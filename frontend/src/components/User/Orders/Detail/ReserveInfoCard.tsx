"use client";

import { useCallback, useState } from "react";
import { Clock } from "lucide-react";
import OrderService from "@/services/order";
import type { Order } from "@/services/order";
import toast from "react-hot-toast";

interface Props {
  order: Order;
  onReleased?: () => void;
}

function formatCountdown(expiresAt: string): string {
  const end = new Date(expiresAt).getTime();
  const now = Date.now();
  const diff = Math.max(0, end - now);
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  return `${hours} ساعت و ${minutes} دقیقه`;
}

export default function ReserveInfoCard({ order, onReleased }: Props) {
  const [isReleasing, setIsReleasing] = useState(false);

  const handleRelease = useCallback(async () => {
    try {
      setIsReleasing(true);
      await OrderService.releaseReserve(order.id);
      toast.success("سفارش شما برای ارسال آماده شد");
      onReleased?.();
    } catch {
      toast.error("خطا در به‌روزرسانی. لطفاً دوباره تلاش کنید.");
    } finally {
      setIsReleasing(false);
    }
  }, [order.id, onReleased]);

  if (!order.IsReserveOrder || !order.ReserveExpiresAt) return null;

  const expiresAt = new Date(order.ReserveExpiresAt);
  const isExpired = expiresAt.getTime() <= Date.now();

  return (
    <div className="rounded-2xl border border-amber-200 bg-amber-50/50 p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <Clock className="h-5 w-5 text-amber-600" />
          <div>
            <p className="font-medium text-amber-900">ارسال رزروی</p>
            <p className="text-sm text-amber-800">
              {isExpired
                ? "مهلت رزرو به پایان رسیده است."
                : `مهلت افزودن به سفارش: ${formatCountdown(order.ReserveExpiresAt)}`}
            </p>
          </div>
        </div>
        {!isExpired && (
          <button
            type="button"
            onClick={handleRelease}
            disabled={isReleasing}
            className="rounded-lg border border-pink-200 bg-white px-4 py-2 text-sm font-medium text-pink-600 transition hover:bg-pink-50 disabled:opacity-50"
          >
            {isReleasing ? "در حال پردازش..." : "ارسال الان"}
          </button>
        )}
      </div>
    </div>
  );
}
