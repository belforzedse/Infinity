import React from "react";
import Link from "next/link";
import { useCart } from "@/contexts/CartContext";
import BasketIcon from "../Icons/BasketIcon";

export default function EmptyCartDrawer() {
  const { closeDrawer } = useCart();

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4 p-4">
      <div className="flex h-20 w-20 items-center justify-center rounded-full bg-slate-100">
        <BasketIcon className="h-10 w-10 text-slate-400" />
      </div>

      <div className="text-center">
        <h3 className="text-lg mb-1 font-medium text-neutral-800">سبد خرید شما خالی است</h3>
        <p className="text-sm mb-4 text-neutral-500">
          می‌توانید برای مشاهده محصولات به فروشگاه بروید
        </p>
      </div>

      <Link
        href="/"
        className="text-sm rounded-lg bg-pink-500 px-6 py-2 text-white"
        onClick={closeDrawer}
      >
        رفتن به فروشگاه
      </Link>
    </div>
  );
}
