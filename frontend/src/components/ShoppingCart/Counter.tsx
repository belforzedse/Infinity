"use client";

import BasketIcon from "./Icons/BasketIcon";
import { useCart } from "@/contexts/CartContext";

const ShoppingCartCounter = () => {
  const { totalItems, openDrawer } = useCart();

  return (
    <button
      onClick={openDrawer}
      className="relative bg-foreground-pink rounded-full w-14 h-14 lg:flex hidden items-center justify-center"
    >
      <BasketIcon />

      <div className="absolute top-0 right-0 rounded-full w-5 h-5 flex items-center justify-center border border-slate-200 text-xs bg-white text-foreground-pink leading-6">
        {totalItems}
      </div>
    </button>
  );
};

export default ShoppingCartCounter;
