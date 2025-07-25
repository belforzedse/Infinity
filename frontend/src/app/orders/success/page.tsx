"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import { useAtom } from "jotai";
import { orderIdAtom, orderNumberAtom } from "@/atoms/Order";
import PaymentStatus from "@/components/User/Orders/PaymentStatus";

export default function OrderSuccess() {
  const [orderId] = useAtom(orderIdAtom);
  const [orderNumber] = useAtom(orderNumberAtom);

  return (
    <div className="container mx-auto px-4 py-10">
      <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-md p-8">
        <div className="flex flex-col items-center text-center">
          <div className="relative w-40 h-40 mb-6">
            <Image
              src="/images/cart/success-order.png"
              alt="Success"
              fill
              objectFit="contain"
            />
          </div>

          <h1 className="text-2xl font-bold text-green-600 mb-4">
            سفارش شما با موفقیت ثبت شد
          </h1>

          <div className="text-gray-700 mb-6">
            <p className="mb-2">
              از خرید شما متشکریم! سفارش شما با موفقیت ثبت شده و در حال پردازش
              است.
            </p>
            <p className="text-sm">
              شماره سفارش: <span className="font-semibold">{orderNumber}</span>
            </p>
            <p className="text-sm">
              شناسه سفارش: <span className="font-semibold">{orderId}</span>
            </p>

            {orderId && <PaymentStatus orderId={orderId} />}
          </div>

          <div className="flex flex-col sm:flex-row gap-4 w-full max-w-xs">
            <Link
              href="/orders"
              className="bg-pink-500 text-white py-3 px-6 rounded-lg text-center hover:bg-pink-600 transition-colors"
            >
              پیگیری سفارش
            </Link>

            <Link
              href="/"
              className="bg-gray-100 text-gray-800 py-3 px-6 rounded-lg text-center hover:bg-gray-200 transition-colors"
            >
              بازگشت به فروشگاه
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
