"use client";

import BasketIcon from "./Icons/BasketIcon";
import { useCart } from "@/contexts/CartContext";

const ShoppingCartCounter = () => {
  const { totalItems, openDrawer } = useCart();

  return (
    <button
      onClick={openDrawer}
      className="relative hidden h-14 w-14 items-center justify-center rounded-full bg-foreground-pink lg:flex"
    >
      <BasketIcon />

      <div className="text-xs absolute right-0 top-0 flex h-5 w-5 items-center justify-center rounded-full border border-slate-200 bg-white leading-6 text-foreground-pink">
        {totalItems}
      </div>
    </button>
  );
};

export default ShoppingCartCounter;
