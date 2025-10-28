"use client";

import { useCart } from "@/contexts/CartContext";
import { faNum } from "@/utils/faNum";
import Link from "next/link";
import { useMemo } from "react";

export default function OrderSummaryCard() {
  const { subtotalBeforeDiscount, cartDiscountTotal, totalPrice, totalItems } = useCart();

  const summary = useMemo(
    () => [
      {
        label: "جمع سبد",
        value: `${faNum(subtotalBeforeDiscount)} تومان`,
      },
      {
        label: "تخفیف‌ها",
        value:
          cartDiscountTotal > 0
            ? `-${faNum(cartDiscountTotal)} تومان`
            : "بدون تخفیف",
        emphasize: cartDiscountTotal > 0,
      },
      {
        label: "هزینه ارسال",
        value: "محاسبه در مرحله بعد",
      },
    ],
    [cartDiscountTotal, subtotalBeforeDiscount],
  );

  return (
    <aside className="w-full rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-base font-semibold text-foreground-primary">خلاصه سفارش</h2>
        <span className="text-xs text-slate-500">{faNum(totalItems)} آیتم</span>
      </div>

      <div className="flex flex-col gap-3 border-b border-slate-100 pb-4 text-sm text-neutral-700">
        {summary.map(({ label, value, emphasize }) => (
          <div key={label} className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">{label}</span>
            <span className={emphasize ? "font-semibold text-pink-600" : ""}>{value}</span>
          </div>
        ))}
      </div>

      <div className="mt-4 flex items-center justify-between">
        <span className="text-sm font-semibold text-slate-600">قابل پرداخت</span>
        <span className="text-lg font-semibold text-foreground-primary">
          {faNum(totalPrice)} تومان
        </span>
      </div>

      <Link
        href="/checkout"
        className="mt-4 flex w-full items-center justify-center rounded-xl bg-pink-500 px-4 py-3 text-sm font-semibold text-white transition hover:bg-pink-600"
      >
        ادامه فرآیند خرید و تسویه حساب
      </Link>

      <div className="mt-3 rounded-xl bg-slate-50 px-3 py-2 text-xs text-slate-500">
        پرداخت شما در مرحله بعدی با درگاه‌های امن بانکی انجام می‌شود.
      </div>
    </aside>
  );
}

