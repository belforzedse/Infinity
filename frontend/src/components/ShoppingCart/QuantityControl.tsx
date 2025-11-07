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
    <div className="flex w-full items-center justify-between gap-6 rounded-lg bg-stone-50 px-5 py-2 lg:w-fit lg:justify-normal">
      <div className="flex items-center gap-0">
        <button
          onClick={() => handleQuantityChange(itemId, 1)}
          className="flex h-6 w-6 items-center justify-center rounded-md border border-slate-100 bg-white text-neutral-800 lg:h-8 lg:w-8"
        >
          <PlusIcon />
        </button>
        <span className="text-sm w-8 text-center text-neutral-800">{faNum(quantity)}</span>
        <button
          onClick={() => handleQuantityChange(itemId, -1)}
          className="flex h-6 w-6 items-center justify-center rounded-md border border-slate-100 bg-white text-neutral-800 lg:h-8 lg:w-8"
        >
          <MinusIcon />
        </button>
      </div>
      <button
        onClick={() => handleQuantityChange(itemId, 0)}
        className="flex items-center justify-center text-rose-500"
      >
        <TrashIcon className="h-5 w-5" />
      </button>
    </div>
  );
}

export default ShoppingCartQuantityControl;
