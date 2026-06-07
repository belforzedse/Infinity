"use client";

import React, { useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useAtom } from "jotai";
import { orderIdAtom, orderNumberAtom, transactionIdAtom } from "@/atoms/Order";
import PaymentStatus from "@/components/User/Orders/PaymentStatus";
import { trackMatomoEvent } from "@/lib/analytics/matomo";
import { StorefrontContainer } from "@/components/storefront";

export default function OrderSuccess() {
  const [orderId] = useAtom(orderIdAtom);
  const [orderNumber] = useAtom(orderNumberAtom);
  const [transactionId] = useAtom(transactionIdAtom);

  useEffect(() => {
    if (!orderId) return;
    trackMatomoEvent({
      category: "checkout",
      action: "order_success_page_view",
      onceKey: `order-success-page:${orderId}`,
    });
  }, [orderId]);

  return (
    <StorefrontContainer className="py-10">
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
            {transactionId && (
              <p className="text-sm">
                ID تراکنش: <span className="font-semibold">{transactionId}</span>
              </p>
            )}

            {orderId && <PaymentStatus orderId={orderId} />}
          </div>

          <div className="flex w-full max-w-xs flex-col gap-4 sm:flex-row">
            <Link
              href="/orders"
              className="rounded-lg bg-infinity-primary px-6 py-3 text-center text-white transition-colors hover:bg-infinity-primary"
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
    </StorefrontContainer>
  );
}
