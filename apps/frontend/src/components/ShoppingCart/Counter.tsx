"use client";

import BasketIcon from "./Icons/BasketIcon";
import { useCart } from "@/contexts/CartContext";

const ShoppingCartCounter = () => {
  const { totalItems, openDrawer } = useCart();

  return (
    <button
      type="button"
      onClick={openDrawer}
      aria-label="سبد خرید"
      className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-pink-500 transition-colors hover:bg-pink-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-pink-400"
    >
      <BasketIcon className="text-white" />

      {totalItems > 0 && (
        <div className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full border border-slate-200 bg-white text-xs font-medium text-pink-600">
          {totalItems}
        </div>
      )}
    </button>
  );
};

export default ShoppingCartCounter;
