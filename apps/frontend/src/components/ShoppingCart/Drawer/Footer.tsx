import React from "react";
import Link from "next/link";
import { useCart } from "@/contexts/CartContext";

export default function CartDrawerFooter() {
  const { totalPrice, closeDrawer } = useCart();

  return (
    <div className="sticky bottom-0 border-t border-slate-100 bg-white p-4">
      <div className="mb-4 flex items-center justify-between">
        <span className="text-sm text-neutral-800">مجموع:</span>
        <span className="text-base font-medium text-neutral-800">
          {totalPrice.toLocaleString()} تومان
        </span>
      </div>

      <div className="flex gap-2">
        <Link
          href="/cart"
          data-testid="cart-drawer-view-cart"
          className="pressable text-sm flex-1 rounded-lg bg-slate-100 px-4 py-2 text-center text-neutral-800"
          onClick={closeDrawer}
        >
          مشاهده سبد خرید
        </Link>

        <Link
          href="/checkout"
          data-testid="cart-drawer-checkout"
          className="pressable text-sm flex-1 rounded-lg bg-infinity-primary px-4 py-2 text-center text-white"
          onClick={closeDrawer}
        >
          تکمیل خرید
        </Link>
      </div>
    </div>
  );
}
