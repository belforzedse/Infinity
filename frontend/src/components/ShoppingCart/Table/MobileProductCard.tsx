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
    <div className="lg:hidden w-full flex flex-col rounded-2xl border border-slate-100 divide-y divide-slate-100 overflow-hidden">
      <div className="grid grid-cols-4">
        <div className="bg-stone-50 border-l border-slate-100 flex items-center justify-start pr-3">
          <span className="text-foreground-primary text-sm">محصول</span>
        </div>

        <div className="col-span-3 flex items-center gap-1 py-2 px-3">
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
          <span className="text-foreground-primary text-sm">
            {cartItem.name}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-4">
        <div className="bg-stone-50 border-l border-slate-100 flex items-center justify-start pr-3">
          <span className="text-foreground-primary text-sm">دسته بندی</span>
        </div>

        <div className="col-span-3 flex items-center gap-1 p-3">
          <span className="text-foreground-primary text-sm">
            {cartItem.category}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-4">
        <div className="bg-stone-50 border-l border-slate-100 flex items-center justify-start pr-3">
          <span className="text-foreground-primary text-sm">قیمت</span>
        </div>

        <div className="col-span-3 flex items-center gap-1 p-3">
          <span className="text-foreground-primary text-sm">
            {cartItem.price.toLocaleString()} تومان
          </span>
        </div>
      </div>

      <div className="grid grid-cols-4">
        <div className="bg-stone-50 border-l border-slate-100 flex items-center justify-start pr-3">
          <span className="text-foreground-primary text-sm">تعداد</span>
        </div>

        <div className="col-span-3 flex items-center gap-1 p-3">
          <ShoppingCartQuantityControl
            quantity={cartItem.quantity}
            itemId={cartItem.id}
          />
        </div>
      </div>

      <div className="grid grid-cols-4">
        <div className="bg-stone-50 border-l border-slate-100 flex items-center justify-start pr-3">
          <span className="text-foreground-primary text-sm">جمع نهایی</span>
        </div>

        <div className="col-span-3 flex items-center gap-1 p-3">
          <span className="text-foreground-primary text-sm">
            {(cartItem.price * cartItem.quantity).toLocaleString()} تومان
          </span>
        </div>
      </div>
    </div>
  );
}
