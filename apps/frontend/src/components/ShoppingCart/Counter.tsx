"use client";

import BasketIcon from "./Icons/BasketIcon";
import { useCart } from "@/contexts/CartContext";
import { useCartShellReady } from "@/hooks/useCartShellReady";

const ShoppingCartCounter = () => {
  const { totalItems, openDrawer } = useCart();
  const isCartShellReady = useCartShellReady();
  const visibleTotalItems = isCartShellReady ? totalItems : 0;

  return (
    <button
      type="button"
      onClick={openDrawer}
      aria-label="سبد خرید"
      className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-infinity-primary transition-colors hover:bg-infinity-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-infinity-primary-light"
    >
      <BasketIcon className="text-white" />

      {visibleTotalItems > 0 && (
        <div className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full border border-slate-200 bg-white text-xs font-medium text-infinity-primary">
          {visibleTotalItems}
        </div>
      )}
    </button>
  );
};

export default ShoppingCartCounter;
