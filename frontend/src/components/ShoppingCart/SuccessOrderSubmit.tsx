"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import ShoppingCartPopUp from "./PopUp";
import { useRouter } from "next/navigation";
import { useAtom } from "jotai";
import { orderIdAtom, orderNumberAtom } from "@/atoms/Order";

function ShoppingCartSuccessOrderSubmit() {
  const [isOpen, setIsOpen] = useState(false);
  const [orderId] = useAtom(orderIdAtom);
  const [orderNumber] = useAtom(orderNumberAtom);
  const router = useRouter();

  // Redirect to home if no order ID (meaning user navigated here directly)
  useEffect(() => {
    if (!orderId) {
      router.push("/");
    }
  }, [orderId, router]);

  const viewOrder = () => {
    router.push(`/orders/${orderId}`);
  };

  return (
    <>
      <div className="flex h-full w-full flex-col items-center justify-center gap-3 lg:gap-6">
        <div className="relative mb-4 h-36 w-32 md:h-60 md:w-56 lg:mb-2">
          <Image
            src="/images/cart/success-order.png"
            alt="success order"
            fill
            className="object-fill"
            sizes="(max-width: 768px) 128px, 224px"
          />
        </div>

        <div className="flex flex-col items-center justify-center gap-2">
          <span className="text-2xl text-neutral-800 lg:text-3xl">
            سفارش با موفقیت ثبت شد!
          </span>

          {orderNumber && (
            <span className="text-lg text-neutral-800 lg:text-xl">
              شماره سفارش: {orderNumber}
            </span>
          )}

          <span className="text-lg text-neutral-800 lg:text-xl">
            ممنون از خریدتون
          </span>
        </div>

        <div className="flex gap-4">
          <button
            onClick={viewOrder}
            className="text-base rounded-lg bg-pink-500 px-6 py-2 text-white lg:text-sm"
          >
            مشاهده سفارش
          </button>
        </div>
      </div>

      <ShoppingCartPopUp isOpen={isOpen} onClose={() => setIsOpen(false)} />
    </>
  );
}

export default ShoppingCartSuccessOrderSubmit;
