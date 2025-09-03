"use client";

import Image from "next/image";
import React from "react";
import ShoppingCartQuantityControl from "../QuantityControl";
import classNames from "classnames";
import { CartItem } from "@/contexts/CartContext";
import { IMAGE_BASE_URL } from "@/constants/api";

interface Props {
  cartItems: CartItem[];
  className?: string;
}

const ShoppingCartDesktopTable: React.FC<Props> = ({
  cartItems,
  className,
}) => {
  return (
    <div className={classNames("w-full overflow-x-auto", className)}>
      <table className="w-full min-w-[800px]">
        <thead className="bg-stone-50">
          <tr className="text-black">
            <th className="rounded-r-xl p-4 text-center font-normal">
              نام محصول
            </th>
            <th className="p-4 text-center font-normal">دسته بندی</th>
            <th className="p-4 text-right font-normal">قیمت</th>
            <th className="p-4 text-right font-normal">تعداد</th>
            <th className="rounded-l-xl p-4 text-left font-normal">
              جمع نهایی
            </th>
          </tr>
        </thead>
        <tbody>
          {cartItems.map((item) => (
            <tr key={item.id} className="border-b border-slate-100">
              <td className="w-52 p-4">
                <div className="flex items-center gap-1">
                  <Image
                    src={
                      item.image.startsWith("http")
                        ? item.image
                        : `${IMAGE_BASE_URL}${item.image}`
                    }
                    alt={item.name}
                    width={48}
                    height={48}
                    className="rounded-xl"
                  />
                  <span className="text-xs text-neutral-800">{item.name}</span>
                </div>
              </td>
              <td className="text-xs w-36 p-4 text-center text-neutral-800">
                {item.category}
              </td>
              <td className="text-xs w-40 p-4 text-neutral-800">
                {item.price.toLocaleString()} تومان
              </td>
              <td className="p-4">
                <ShoppingCartQuantityControl
                  itemId={item.id}
                  quantity={item.quantity}
                />
              </td>
              <td className="text-base p-4 text-left text-neutral-800">
                {(item.price * item.quantity).toLocaleString()} تومان
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default ShoppingCartDesktopTable;
