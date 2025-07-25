import React from "react";
import Link from "next/link";
import { useCart } from "@/contexts/CartContext";
import BasketIcon from "../Icons/BasketIcon";

export default function EmptyCartDrawer() {
  const { closeDrawer } = useCart();

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-4 gap-4">
      <div className="w-20 h-20 rounded-full bg-slate-100 flex items-center justify-center">
        <BasketIcon className="w-10 h-10 text-slate-400" />
      </div>

      <div className="text-center">
        <h3 className="text-lg font-medium text-neutral-800 mb-1">
          سبد خرید شما خالی است
        </h3>
        <p className="text-sm text-neutral-500 mb-4">
          می‌توانید برای مشاهده محصولات به فروشگاه بروید
        </p>
      </div>

      <Link
        href="/"
        className="py-2 px-6 bg-pink-500 text-white rounded-lg text-sm"
        onClick={closeDrawer}
      >
        رفتن به فروشگاه
      </Link>
    </div>
  );
}
