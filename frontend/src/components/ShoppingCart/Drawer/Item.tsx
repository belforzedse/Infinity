import React from "react";
import Image from "next/image";
import imageLoader from "@/utils/imageLoader";
import type { CartItem } from "@/contexts/CartContext";
import { useCart } from "@/contexts/CartContext";
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
  const imageUrl = item.image.startsWith("http") ? item.image : `${IMAGE_BASE_URL}${item.image}`;

  return (
    <div className="flex flex-col overflow-hidden rounded-lg border border-slate-100">
      <div className="flex gap-3 p-3">
        <div className="relative h-20 w-20 overflow-hidden rounded-lg">
          <Image
            src={imageUrl}
            alt={item.name}
            fill
            className="object-cover"
            sizes="80px"
            loader={imageLoader}
          />
        </div>

        <div className="flex flex-1 flex-col gap-1">
          <h3 className="text-sm font-medium text-neutral-800">{item.name}</h3>
          <span className="text-xs text-neutral-500">{item.category}</span>

          {(item.color || item.size || item.model) && (
            <div className="mt-1 flex gap-2">
              {item.color && (
                <span className="text-xs rounded-md bg-slate-50 px-2 py-1">{item.color}</span>
              )}
              {item.size && (
                <span className="text-xs rounded-md bg-slate-50 px-2 py-1">{item.size}</span>
              )}
              {item.model && (
                <span className="text-xs rounded-md bg-slate-50 px-2 py-1">{item.model}</span>
              )}
            </div>
          )}

          <div className="mt-2 flex flex-col items-start gap-1">
            {item.originalPrice && item.originalPrice > item.price && (
              <span className="text-xs text-neutral-500 line-through">
                {item.originalPrice.toLocaleString()} {"\u062A\u0648\u0645\u0627\u0646"}
              </span>
            )}
            <span className="text-sm font-semibold text-pink-600">
              {item.price.toLocaleString()} {"\u062A\u0648\u0645\u0627\u0646"}
            </span>
            {item.discountPercentage && item.discountPercentage > 0 && (
              <span className="text-xs text-green-600">-{item.discountPercentage}%</span>
            )}
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between border-t border-slate-100 p-3">
        <div className="flex items-center gap-2">
          <button
            onClick={handleIncrement}
            className="flex h-8 w-8 items-center justify-center rounded-md border border-slate-100 bg-white text-neutral-800"
          >
            <PlusIcon />
          </button>

          <span className="text-sm w-6 text-center">{item.quantity}</span>

          <button
            onClick={handleDecrement}
            className="flex h-8 w-8 items-center justify-center rounded-md border border-slate-100 bg-white text-neutral-800"
          >
            <MinusIcon />
          </button>
        </div>

        <button onClick={handleRemove} className="flex items-center gap-1 text-rose-500">
          <span className="text-xs">حذف</span>
          <TrashIcon className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
