import React from "react";
import Image from "next/image";
import { useCart, CartItem } from "@/contexts/CartContext";
import TrashIcon from "@/components/ShoppingCart/Icons/TrashIcon";
import PlusIcon from "@/components/ShoppingCart/Icons/PlusIcon";
import MinusIcon from "@/components/ShoppingCart/Icons/MinusIcon";
import { IMAGE_BASE_URL } from "@/constants/api";

interface CartDrawerItemProps {
  item: CartItem;
}

export default function CartDrawerItem({ item }: CartDrawerItemProps) {
  const { updateQuantity, removeFromCart } = useCart();

  const handleIncrement = () => {
    updateQuantity(item.id, item.quantity + 1);
  };

  const handleDecrement = () => {
    if (item.quantity > 1) {
      updateQuantity(item.id, item.quantity - 1);
    } else {
      removeFromCart(item.id);
    }
  };

  const handleRemove = () => {
    removeFromCart(item.id);
  };

  // Format image URL
  const imageUrl = item.image.startsWith("http")
    ? item.image
    : `${IMAGE_BASE_URL}${item.image}`;

  return (
    <div className="flex flex-col rounded-lg border border-slate-100 overflow-hidden">
      <div className="flex p-3 gap-3">
        <div className="w-20 h-20 rounded-lg overflow-hidden relative">
          <Image src={imageUrl} alt={item.name} fill className="object-cover" />
        </div>

        <div className="flex flex-col gap-1 flex-1">
          <h3 className="text-sm font-medium text-neutral-800">{item.name}</h3>
          <span className="text-xs text-neutral-500">{item.category}</span>

          {(item.color || item.size || item.model) && (
            <div className="flex gap-2 mt-1">
              {item.color && (
                <span className="text-xs bg-slate-50 px-2 py-1 rounded-md">
                  {item.color}
                </span>
              )}
              {item.size && (
                <span className="text-xs bg-slate-50 px-2 py-1 rounded-md">
                  {item.size}
                </span>
              )}
              {item.model && (
                <span className="text-xs bg-slate-50 px-2 py-1 rounded-md">
                  {item.model}
                </span>
              )}
            </div>
          )}

          <div className="flex justify-between items-center mt-2">
            <span className="text-sm font-medium text-neutral-800">
              {item.price.toLocaleString()} تومان
            </span>
          </div>
        </div>
      </div>

      <div className="flex justify-between items-center border-t border-slate-100 p-3">
        <div className="flex items-center gap-2">
          <button
            onClick={handleIncrement}
            className="w-8 h-8 flex items-center justify-center border border-slate-100 rounded-md bg-white text-neutral-800"
          >
            <PlusIcon />
          </button>

          <span className="w-6 text-center text-sm">{item.quantity}</span>

          <button
            onClick={handleDecrement}
            className="w-8 h-8 flex items-center justify-center border border-slate-100 rounded-md bg-white text-neutral-800"
          >
            <MinusIcon />
          </button>
        </div>

        <button
          onClick={handleRemove}
          className="text-rose-500 flex items-center gap-1"
        >
          <span className="text-xs">حذف</span>
          <TrashIcon className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
