"use client";

import Image from "next/image";
import imageLoader from "@/utils/imageLoader";
import ShoppingCartQuantityControl from "../QuantityControl";
import type { CartItem } from "@/contexts/CartContext";
import { IMAGE_BASE_URL } from "@/constants/api";
import { faNum } from "@/utils/faNum";

interface Props {
  cartItem: CartItem;
  className?: string;
}

export default function ShoppingCartMobileProductCard({ cartItem }: Props) {
  const formatPrice = (value: number) => `${faNum(value)} تومان`;

  return (
    <div className="flex w-full flex-col divide-y divide-slate-100 overflow-hidden rounded-2xl border border-slate-100 lg:hidden">
      <div className="grid grid-cols-4">
        <div className="flex items-center justify-start border-l border-slate-100 bg-stone-50 pr-3">
          <span className="text-sm text-foreground-primary">نام محصول</span>
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
          <span className="text-sm text-foreground-primary">{cartItem.name}</span>
        </div>
      </div>

      <div className="grid grid-cols-4">
        <div className="flex items-center justify-start border-l border-slate-100 bg-stone-50 pr-3">
          <span className="text-sm text-foreground-primary">دسته بندی</span>
        </div>

        <div className="col-span-3 flex items-center gap-1 p-3">
          <div className="flex flex-col gap-1">
            <span className="text-sm text-foreground-primary">{cartItem.category}</span>
            {[cartItem.color, cartItem.size, cartItem.model].some(Boolean) ? (
              <span className="text-xs text-slate-500">
                {[
                  cartItem.color ? `رنگ: ${cartItem.color}` : null,
                  cartItem.size ? `سایز: ${cartItem.size}` : null,
                  cartItem.model ? `مدل: ${cartItem.model}` : null,
                ]
                  .filter(Boolean)
                  .join(" • ")}
              </span>
            ) : null}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-4">
        <div className="flex items-center justify-start border-l border-slate-100 bg-stone-50 pr-3">
          <span className="text-sm text-foreground-primary">قیمت</span>
        </div>

        <div className="col-span-3 flex flex-col items-end gap-1 p-3">
          {cartItem.originalPrice && cartItem.originalPrice > cartItem.price ? (
            <>
              <span className="text-xs text-neutral-500 line-through">
                {formatPrice(cartItem.originalPrice)}
              </span>
              <span className="text-base font-semibold text-pink-600">
                {formatPrice(cartItem.price)}
              </span>
            </>
          ) : (
            <span className="text-base text-neutral-800">{formatPrice(cartItem.price)}</span>
          )}
        </div>
      </div>

      <div className="grid grid-cols-4">
        <div className="flex items-center justify-start border-l border-slate-100 bg-stone-50 pr-3">
          <span className="text-sm text-foreground-primary">تعداد</span>
        </div>

        <div className="col-span-3 flex items-center gap-1 p-3">
          <ShoppingCartQuantityControl quantity={cartItem.quantity} itemId={cartItem.id} />
        </div>
      </div>

      <div className="grid grid-cols-4">
        <div className="flex items-center justify-start border-l border-slate-100 bg-stone-50 pr-3">
          <span className="text-sm text-foreground-primary">قیمت کل</span>
        </div>

        <div className="col-span-3 flex flex-col items-end gap-1 p-3">
          {cartItem.originalPrice && cartItem.originalPrice > cartItem.price ? (
            <>
              <span className="text-xs text-neutral-500 line-through">
                {formatPrice(cartItem.originalPrice * cartItem.quantity)}
              </span>
              <span className="text-base font-semibold text-pink-600">
                {formatPrice(cartItem.price * cartItem.quantity)}
              </span>
            </>
          ) : (
            <span className="text-base text-neutral-800">
              {formatPrice(cartItem.price * cartItem.quantity)}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
