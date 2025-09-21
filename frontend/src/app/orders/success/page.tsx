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
      <div className="mx-auto max-w-2xl rounded-lg bg-white p-8 shadow-md">
        <div className="flex flex-col items-center text-center">
          <div className="relative mb-6 h-40 w-40">
            <Image
              src="/images/cart/success-order.png"
              alt="Success"
              fill
              className="object-contain"
              sizes="160px"
            />
          </div>

          <h1 className="text-2xl mb-4 font-bold text-green-600">سفارش شما با موفقیت ثبت شد</h1>

          <div className="mb-6 text-gray-700">
            <p className="mb-2">
              از خرید شما متشکریم! سفارش شما با موفقیت ثبت شده و در حال پردازش است.
            </p>
            <p className="text-sm">
              شماره سفارش: <span className="font-semibold">{orderNumber}</span>
            </p>
            <p className="text-sm">
              شناسه سفارش: <span className="font-semibold">{orderId}</span>
            </p>

            {orderId && <PaymentStatus orderId={orderId} />}
          </div>

          <div className="flex w-full max-w-xs flex-col gap-4 sm:flex-row">
            <Link
              href="/orders"
              className="rounded-lg bg-pink-500 px-6 py-3 text-center text-white transition-colors hover:bg-pink-600"
            >
              پیگیری سفارش
            </Link>

            <Link
              href="/"
              className="rounded-lg bg-gray-100 px-6 py-3 text-center text-gray-800 transition-colors hover:bg-gray-200"
            >
              بازگشت به فروشگاه
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
