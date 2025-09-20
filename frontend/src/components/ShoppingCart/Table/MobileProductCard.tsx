"use client";

import Image from "next/image";
import imageLoader from "@/utils/imageLoader";
import ShoppingCartQuantityControl from "../QuantityControl";
import { CartItem } from "@/contexts/CartContext";
import { IMAGE_BASE_URL } from "@/constants/api";

interface Props {
  cartItem: CartItem;
  className?: string;
}

export default function ShoppingCartMobileProductCard({ cartItem }: Props) {
  return (
    <div className="flex w-full flex-col divide-y divide-slate-100 overflow-hidden rounded-2xl border border-slate-100 lg:hidden">
      <div className="grid grid-cols-4">
        <div className="flex items-center justify-start border-l border-slate-100 bg-stone-50 pr-3">
          <span className="text-sm text-foreground-primary">{"U.O-O\uFFFDU^U,"}</span>
        </div>

        <div className="col-span-3 flex items-center gap-1 px-3 py-2">
          <div className="relative h-12 w-12 overflow-hidden rounded-lg">
            <Image
              src={
                cartItem.image.startsWith("http")
                  ? cartItem.image
                  : `${IMAGE_BASE_URL}${cartItem.image}`
              }
              alt={cartItem.name}
              fill
              className="h-full w-full object-cover"
              sizes="48px"
              loader={imageLoader}
            />
          </div>
          <span className="text-sm text-foreground-primary">
            {cartItem.name}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-4">
        <div className="flex items-center justify-start border-l border-slate-100 bg-stone-50 pr-3">
          <span className="text-sm text-foreground-primary">{"O_O3O\uFFFDU\uFFFD O\"U+O_UO"}</span>
        </div>

        <div className="col-span-3 flex items-center gap-1 p-3">
          <span className="text-sm text-foreground-primary">
            {cartItem.category}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-4">
        <div className="flex items-center justify-start border-l border-slate-100 bg-stone-50 pr-3">
          <span className="text-sm text-foreground-primary">{"U,UOU.O\uFFFD"}</span>
        </div>

        <div className="col-span-3 flex flex-col items-end gap-1 p-3">
          {cartItem.originalPrice && cartItem.originalPrice > cartItem.price && (
            <span className="text-xs text-neutral-500 line-through">
              {cartItem.originalPrice.toLocaleString()} {"\u062A\u0648\u0645\u0627\u0646"}
            </span>
          )}
          <span className="text-base font-semibold text-pink-600">
            {cartItem.price.toLocaleString()} {"\u062A\u0648\u0645\u0627\u0646"}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-4">
        <div className="flex items-center justify-start border-l border-slate-100 bg-stone-50 pr-3">
          <span className="text-sm text-foreground-primary">{"O\uFFFDO1O_O\u0015O_"}</span>
        </div>

        <div className="col-span-3 flex items-center gap-1 p-3">
          <ShoppingCartQuantityControl
            quantity={cartItem.quantity}
            itemId={cartItem.id}
          />
        </div>
      </div>

      <div className="grid grid-cols-4">
        <div className="flex items-center justify-start border-l border-slate-100 bg-stone-50 pr-3">
          <span className="text-sm text-foreground-primary">{"O\uFFFDU.O1 U+U\uFFFD O\u0015UOUO"}</span>
        </div>

        <div className="col-span-3 flex flex-col items-end gap-1 p-3">
          {cartItem.originalPrice && cartItem.originalPrice > cartItem.price && (
            <span className="text-xs text-neutral-500 line-through">
              {(cartItem.originalPrice * cartItem.quantity).toLocaleString()} {"\u062A\u0648\u0645\u0627\u0646"}
            </span>
          )}
          <span className="text-base font-semibold text-pink-600">
            {(cartItem.price * cartItem.quantity).toLocaleString()} {"\u062A\u0648\u0645\u0627\u0646"}
          </span>
        </div>
      </div>
    </div>
  );
}