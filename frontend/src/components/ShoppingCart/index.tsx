"use client";

import React from "react";
import EmptyShoppingCart from "./Empty";
import ShoppingCartSuccessOrderSubmit from "./SuccessOrderSubmit";
import { submitOrderStepAtom } from "@/atoms/Order";
import { useAtom } from "jotai";
import { SubmitOrderStep } from "@/types/Order";
import ShoppingCartBillForm from "./‌Bill";
import ShoppingCartMobileTable from "./Table/Mobile";
import ShoppingCartDesktopTable from "./Table/Desktop";
import { useCart } from "@/contexts/CartContext";

function ShoppingCart() {
  const [submitOrderStep, setSubmitOrderStep] = useAtom(submitOrderStepAtom);
  const { cartItems } = useCart();

  if (cartItems.length === 0) return <EmptyShoppingCart />;

  if (submitOrderStep === SubmitOrderStep.Success)
    return <ShoppingCartSuccessOrderSubmit />;

  if (submitOrderStep === SubmitOrderStep.Bill) return <ShoppingCartBillForm />;

  return (
    <div className="flex flex-col gap-6 items-end pb-20 ">
      <span className="text-3xl text-neutral-800 w-full">سبد خرید</span>

      {submitOrderStep === SubmitOrderStep.Table && (
        <>
          <ShoppingCartDesktopTable
            cartItems={cartItems}
            className="lg:block hidden"
          />

          <ShoppingCartMobileTable
            cartItems={cartItems}
            className="lg:hidden"
          />

          <button
            onClick={() => setSubmitOrderStep(SubmitOrderStep.Bill)}
            className="bg-pink-500 w-fit text-sm text-white px-6 py-2 rounded-lg"
          >
            ادامه فرآیند خرید و تسویه حساب
          </button>
        </>
      )}
    </div>
  );
}

export default ShoppingCart;
