"use client";

import React from "react";
import TrashIcon from "../SuperAdmin/Layout/Icons/TrashIcon";
import PlusIcon from "../User/Icons/PlusIcon";
import MinusIcon from "./Icons/MinusIcon";
import { useCart } from "@/contexts/CartContext";

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
    <div className="flex items-center gap-6 bg-stone-50 rounded-lg py-2 px-5 lg:w-fit w-full lg:justify-normal justify-between">
      <div className="flex items-center gap-0">
        <button
          onClick={() => handleQuantityChange(itemId, 1)}
          className="lg:w-8 lg:h-8 w-6 h-6 flex items-center justify-center text-neutral-800 border-slate-100 rounded-md border bg-white"
        >
          <PlusIcon />
        </button>
        <span className="w-8 text-center text-sm text-neutral-800">
          {quantity}
        </span>
        <button
          onClick={() => handleQuantityChange(itemId, -1)}
          className="lg:w-8 lg:h-8 w-6 h-6 flex items-center justify-center text-neutral-800 border-slate-100 rounded-md border bg-white"
        >
          <MinusIcon />
        </button>
      </div>
      <button
        onClick={() => handleQuantityChange(itemId, 0)}
        className="flex items-center justify-center text-rose-500"
      >
        <TrashIcon className="w-5 h-5" />
      </button>
    </div>
  );
}

export default ShoppingCartQuantityControl;
