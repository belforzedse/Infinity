import React from "react";
import Link from "next/link";
import { useCart } from "@/contexts/CartContext";

export default function CartDrawerFooter() {
  const { totalPrice, closeDrawer } = useCart();

  return (
    <div className="border-t border-slate-100 p-4">
      <div className="flex justify-between items-center mb-4">
        <span className="text-sm text-neutral-800">مجموع:</span>
        <span className="text-base font-medium text-neutral-800">
          {totalPrice.toLocaleString()} تومان
        </span>
      </div>

      <div className="flex gap-2">
        <Link
          href="/cart"
          className="flex-1 text-center py-2 px-4 bg-slate-100 text-neutral-800 rounded-lg text-sm"
          onClick={closeDrawer}
        >
          مشاهده سبد خرید
        </Link>

        <Link
          href="/cart"
          className="flex-1 text-center py-2 px-4 bg-pink-500 text-white rounded-lg text-sm"
          onClick={closeDrawer}
        >
          تکمیل خرید
        </Link>
      </div>
    </div>
  );
}
