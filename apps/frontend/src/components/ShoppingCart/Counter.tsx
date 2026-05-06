"use client";

import BasketIcon from "./Icons/BasketIcon";
import { useCart } from "@/contexts/CartContext";

const ShoppingCartCounter = () => {
  const { totalItems, openDrawer } = useCart();

  return (
    <button
      onClick={openDrawer}
      className="relative flex h-12 w-12 items-center justify-center rounded-full bg-pink-500 hover:bg-pink-600 transition-colors"
    >
      <BasketIcon className="text-white" />

      {totalItems > 0 && (
        <div className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full border border-white bg-white text-xs font-medium text-pink-600">
          {totalItems}
        </div>
      )}
    </button>
  );
};

export default ShoppingCartCounter;
