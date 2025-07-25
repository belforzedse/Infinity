"use client";

import React from "react";
import Link from "next/link";
import { useAtom } from "jotai";
import { orderIdAtom, orderNumberAtom } from "@/atoms/Order";
import PaymentStatus from "@/components/User/Orders/PaymentStatus";

export default function OrderFailure() {
  const [orderId] = useAtom(orderIdAtom);
  const [orderNumber] = useAtom(orderNumberAtom);

  return (
    <div className="container mx-auto px-4 py-10">
      <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-md p-8">
        <div className="flex flex-col items-center text-center">
          <div className="w-20 h-20 rounded-full bg-red-100 flex items-center justify-center mb-6">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-10 w-10 text-red-500"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </div>

          <h1 className="text-2xl font-bold text-red-600 mb-4">
            پرداخت ناموفق
          </h1>

          <div className="text-gray-700 mb-6">
            <p className="mb-2">
              متاسفانه، پرداخت شما با مشکل مواجه شد و سفارش شما تکمیل نشده است.
            </p>
            {orderNumber && (
              <p className="text-sm">
                شماره سفارش:{" "}
                <span className="font-semibold">{orderNumber}</span>
              </p>
            )}
            {orderId && (
              <p className="text-sm">
                شناسه سفارش: <span className="font-semibold">{orderId}</span>
              </p>
            )}

            {orderId && <PaymentStatus orderId={orderId} />}
          </div>

          <div className="flex flex-col sm:flex-row gap-4 w-full max-w-xs">
            <Link
              href="/cart"
              className="bg-pink-500 text-white py-3 px-6 rounded-lg text-center hover:bg-pink-600 transition-colors"
            >
              بازگشت به سبد خرید
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
