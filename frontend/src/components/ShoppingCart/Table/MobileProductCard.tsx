"use client";

import Image from "next/image";
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
          <span className="text-sm text-foreground-primary">محصول</span>
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
            />
          </div>
          <span className="text-sm text-foreground-primary">
            {cartItem.name}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-4">
        <div className="flex items-center justify-start border-l border-slate-100 bg-stone-50 pr-3">
          <span className="text-sm text-foreground-primary">دسته بندی</span>
        </div>

        <div className="col-span-3 flex items-center gap-1 p-3">
          <span className="text-sm text-foreground-primary">
            {cartItem.category}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-4">
        <div className="flex items-center justify-start border-l border-slate-100 bg-stone-50 pr-3">
          <span className="text-sm text-foreground-primary">قیمت</span>
        </div>

        <div className="col-span-3 flex items-center gap-1 p-3">
          <span className="text-sm text-foreground-primary">
            {cartItem.price.toLocaleString()} تومان
          </span>
        </div>
      </div>

      <div className="grid grid-cols-4">
        <div className="flex items-center justify-start border-l border-slate-100 bg-stone-50 pr-3">
          <span className="text-sm text-foreground-primary">تعداد</span>
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
          <span className="text-sm text-foreground-primary">جمع نهایی</span>
        </div>

        <div className="col-span-3 flex items-center gap-1 p-3">
          <span className="text-sm text-foreground-primary">
            {(cartItem.price * cartItem.quantity).toLocaleString()} تومان
          </span>
        </div>
      </div>
    </div>
  );
}
