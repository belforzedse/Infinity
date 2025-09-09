import React from "react";
import { useCart } from "@/contexts/CartContext";
import XIcon from "@/components/User/Icons/XIcon";

export default function CartDrawerHeader() {
  const { closeDrawer, totalItems } = useCart();

  return (
    <div className="flex items-center justify-between border-b border-slate-100 p-4">
      <div className="flex items-center gap-2">
        <h2 className="text-lg font-medium text-neutral-800">سبد خرید</h2>
        <span className="text-sm text-neutral-500">({totalItems} کالا)</span>
      </div>
      <button
        onClick={closeDrawer}
        className="rounded-full p-2 transition-colors hover:bg-slate-50"
        aria-label="Close cart"
      >
        <XIcon />
      </button>
    </div>
  );
}
