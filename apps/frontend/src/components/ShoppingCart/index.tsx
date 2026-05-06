"use client";

import React from "react";
import EmptyShoppingCart from "./Empty";
import ShoppingCartSuccessOrderSubmit from "./SuccessOrderSubmit";
import { submitOrderStepAtom } from "@/atoms/Order";
import { useAtom } from "jotai";
import { SubmitOrderStep } from "@/types/Order";
import ShoppingCartBillForm from "./Bill";
import ShoppingCartMobileTable from "./Table/Mobile";
import ShoppingCartDesktopTable from "./Table/Desktop";
import { useCart } from "@/contexts/CartContext";
import CartSkeleton from "@/components/Skeletons/CartSkeleton";

function ShoppingCart() {
  const [submitOrderStep, setSubmitOrderStep] = useAtom(submitOrderStepAtom);
  const { cartItems, isLoading } = useCart();

  if (isLoading) return <CartSkeleton />;

  if (cartItems.length === 0) return <EmptyShoppingCart />;

  return (
    <div className="flex flex-col gap-6 pb-20">
      <span className="text-3xl w-full text-neutral-800">سبد خرید</span>

      {submitOrderStep === SubmitOrderStep.Table && (
        <div key="table">
          <ShoppingCartDesktopTable cartItems={cartItems} className="hidden lg:block" />

          <ShoppingCartMobileTable cartItems={cartItems} className="lg:hidden" />

          <button
            onClick={() => setSubmitOrderStep(SubmitOrderStep.Bill)}
            className="text-sm w-fit rounded-lg bg-pink-500 px-6 py-2 text-white"
          >
            ادامه فرآیند خرید و تسویه حساب
          </button>
        </div>
      )}

      {submitOrderStep === SubmitOrderStep.Bill && (
        <div key="bill">
          <ShoppingCartBillForm />
        </div>
      )}

      {submitOrderStep === SubmitOrderStep.Success && (
        <div key="success">
          <ShoppingCartSuccessOrderSubmit />
        </div>
      )}
    </div>
  );
}

export default ShoppingCart;
