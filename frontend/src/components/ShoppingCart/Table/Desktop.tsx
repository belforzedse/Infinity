"use client";

import Image from "next/image";
import Link from "next/link";
import imageLoader from "@/utils/imageLoader";
import React from "react";
import ShoppingCartQuantityControl from "../QuantityControl";
import classNames from "classnames";
import type { CartItem } from "@/contexts/CartContext";
import { IMAGE_BASE_URL } from "@/constants/api";
import { faNum } from "@/utils/faNum";

interface Props {
  cartItems: CartItem[];
  className?: string;
}

const ShoppingCartDesktopTable: React.FC<Props> = ({ cartItems, className }) => {
  const buildAttributes = (item: CartItem) => {
    const attributes = [
      item.color ? `رنگ: ${item.color}` : null,
      item.size ? `سایز: ${item.size}` : null,
      item.model ? `مدل: ${item.model}` : null,
    ].filter(Boolean);

    return attributes.length ? attributes.join(" • ") : null;
  };

  const formatPrice = (value: number) => `${faNum(value)} تومان`;

  return (
    <div className={classNames("w-full overflow-x-auto", className)}>
      <table className="w-full min-w-[960px] divide-y divide-slate-100 text-sm text-neutral-700">
        <thead className="bg-stone-50 text-xs font-medium text-slate-500">
          <tr>
            <th className="rounded-r-xl p-4 text-right">محصول</th>
            <th className="p-4 text-right">قیمت واحد</th>
            <th className="p-4 text-center">تعداد</th>
            <th className="rounded-l-xl p-4 text-left">جمع نهایی</th>
          </tr>
        </thead>
        <tbody className="bg-white">
          {cartItems.map((item) => {
            const attributes = buildAttributes(item);
            const hasDiscount = !!(item.originalPrice && item.originalPrice > item.price);

            return (
              <tr key={item.id} className="transition hover:bg-stone-50/80">
                <td className="p-4 align-top">
                  <div className="flex items-start gap-3">
                    <Link href={`/pdp/${item.slug}`} className="relative h-20 w-20 flex-shrink-0 overflow-hidden rounded-2xl border border-slate-100">
                      <Image
                        src={item.image.startsWith("http") ? item.image : `${IMAGE_BASE_URL}${item.image}`}
                        alt={item.name}
                        fill
                        loader={imageLoader}
                        className="object-cover"
                        sizes="80px"
                      />
                    </Link>

                    <div className="flex flex-col gap-1 text-sm">
                      <Link
                        href={`/pdp/${item.slug}`}
                        className="font-semibold text-foreground-primary hover:text-pink-600"
                      >
                        {item.name}
                      </Link>
                      <span className="text-xs text-slate-500">{item.category}</span>
                      {attributes ? (
                        <span className="text-xs text-slate-400">{attributes}</span>
                      ) : null}
                    </div>
                  </div>
                </td>

                <td className="p-4 align-top">
                  <div className="flex flex-col items-end gap-1 text-sm">
                    {hasDiscount && (
                      <span className="text-xs text-slate-400 line-through">
                        {formatPrice(item.originalPrice!)}
                      </span>
                    )}
                    <span className={hasDiscount ? "font-semibold text-pink-600" : "text-neutral-800"}>
                      {formatPrice(item.price)}
                    </span>
                  </div>
                </td>

                <td className="p-4 align-top">
                  <ShoppingCartQuantityControl itemId={item.id} quantity={item.quantity} />
                </td>

                <td className="p-4 align-top">
                  <div className="flex flex-col items-start gap-1 text-sm">
                    {hasDiscount && (
                      <span className="text-xs text-slate-400 line-through">
                        {formatPrice(item.originalPrice! * item.quantity)}
                      </span>
                    )}
                    <span className={hasDiscount ? "text-base font-semibold text-pink-600" : "text-base text-neutral-800"}>
                      {formatPrice(item.price * item.quantity)}
                    </span>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default ShoppingCartDesktopTable;
