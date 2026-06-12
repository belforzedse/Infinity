"use client";

import React from "react";
import TrashIcon from "../SuperAdmin/Layout/Icons/TrashIcon";
import PlusIcon from "../User/Icons/PlusIcon";
import MinusIcon from "./Icons/MinusIcon";
import { useCart } from "@/contexts/CartContext";
import { faNum } from "@/utils/faNum";

type Props = {
  itemId: string;
  quantity: number;
};

function ShoppingCartQuantityControl({ itemId, quantity }: Props) {
  const { updateQuantity, removeFromCart } = useCart();

  const handleQuantityChange = (id: string, change: number) => {
    if (change === 0) {
      removeFromCart(id);
    } else {
      updateQuantity(id, quantity + change);
    }
  };

  return (
    <div
      className="flex w-full items-center justify-between gap-4 rounded-lg bg-stone-50 px-4 py-2 lg:w-fit lg:justify-normal lg:gap-3 lg:px-3"
      data-testid="cart-quantity-control"
      data-cart-item-id={itemId}
    >
      <div className="flex items-center gap-0">
        <button
          onClick={() => handleQuantityChange(itemId, 1)}
          data-testid="cart-quantity-increase"
          aria-label="Increase cart item quantity"
          className="flex h-6 w-6 items-center justify-center rounded-md border border-slate-100 bg-white text-neutral-800 lg:h-8 lg:w-8"
        >
          <PlusIcon />
        </button>
        <span className="w-8 text-center text-sm text-neutral-800">{faNum(quantity)}</span>
        <button
          onClick={() => handleQuantityChange(itemId, -1)}
          data-testid="cart-quantity-decrease"
          aria-label="Decrease cart item quantity"
          className="flex h-6 w-6 items-center justify-center rounded-md border border-slate-100 bg-white text-neutral-800 lg:h-8 lg:w-8"
        >
          <MinusIcon />
        </button>
      </div>
      <button
        onClick={() => handleQuantityChange(itemId, 0)}
        data-testid="cart-item-remove"
        aria-label="Remove cart item"
        className="flex items-center justify-center text-rose-500"
      >
        <TrashIcon className="h-5 w-5" />
      </button>
    </div>
  );
}

export default ShoppingCartQuantityControl;
