"use client";

import React, { useEffect } from "react";
import Link from "next/link";
import { useAtom } from "jotai";
import { orderIdAtom, orderNumberAtom, transactionIdAtom } from "@/atoms/Order";
import PaymentStatus from "@/components/User/Orders/PaymentStatus";
import { trackMatomoEvent } from "@/lib/analytics/matomo";
import { StorefrontContainer } from "@/components/storefront";

export default function OrderFailure() {
  const [orderId] = useAtom(orderIdAtom);
  const [orderNumber] = useAtom(orderNumberAtom);
  const [transactionId] = useAtom(transactionIdAtom);

  useEffect(() => {
    if (!orderId) return;
    trackMatomoEvent({
      category: "checkout",
      action: "order_failure_page_view",
      onceKey: `order-failure-page:${orderId}`,
    });
  }, [orderId]);

  return (
    <StorefrontContainer className="py-10">
      <div className="mx-auto max-w-2xl rounded-lg bg-white p-8 shadow-md">
        <div className="flex flex-col items-center text-center">
          <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-red-100">
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

          <h1 className="text-2xl mb-4 font-bold text-red-600">پرداخت ناموفق</h1>

          <div className="mb-6 text-gray-700">
            <p className="mb-2">
              متاسفانه، پرداخت شما با مشکل مواجه شد و سفارش شما تکمیل نشده است.
            </p>
            {orderNumber && (
              <p className="text-sm">
                شماره سفارش: <span className="font-semibold">{orderNumber}</span>
              </p>
            )}
            {orderId && (
              <p className="text-sm">
                شناسه سفارش: <span className="font-semibold">{orderId}</span>
              </p>
            )}
            {transactionId && (
              <p className="text-sm">
                ID تراکنش: <span className="font-semibold">{transactionId}</span>
              </p>
            )}

            {orderId && <PaymentStatus orderId={orderId} />}
          </div>

          <div className="flex w-full max-w-xs flex-col gap-4 sm:flex-row">
            <Link
              href="/cart"
              className="rounded-lg bg-infinity-primary px-6 py-3 text-center text-white transition-colors hover:bg-infinity-primary"
            >
              بازگشت به سبد خرید
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
    </StorefrontContainer>
  );
}
