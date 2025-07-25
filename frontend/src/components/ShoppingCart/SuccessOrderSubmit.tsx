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
      <div className="flex flex-col items-center justify-center lg:gap-6 gap-3 w-full h-full">
        <div className="relative md:w-56 md:h-60 w-32 h-36 lg:mb-2 mb-4">
          <Image
            src="/images/cart/success-order.png"
            alt="success order"
            fill
            className="object-fill"
          />
        </div>

        <div className="flex flex-col items-center justify-center gap-2">
          <span className="lg:text-3xl text-2xl text-neutral-800">
            سفارش با موفقیت ثبت شد!
          </span>

          {orderNumber && (
            <span className="text-neutral-800 lg:text-xl text-lg">
              شماره سفارش: {orderNumber}
            </span>
          )}

          <span className="text-neutral-800 lg:text-xl text-lg">
            ممنون از خریدتون
          </span>
        </div>

        <div className="flex gap-4">
          <button
            onClick={viewOrder}
            className="bg-pink-500 text-white px-6 py-2 rounded-lg lg:text-sm text-base"
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
