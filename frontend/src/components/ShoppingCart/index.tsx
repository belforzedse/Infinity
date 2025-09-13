"use client";

import React from "react";
import { AnimatePresence, motion } from "framer-motion";
import EmptyShoppingCart from "./Empty";
import ShoppingCartSuccessOrderSubmit from "./SuccessOrderSubmit";
import { submitOrderStepAtom } from "@/atoms/Order";
import { useAtom } from "jotai";
import { SubmitOrderStep } from "@/types/Order";
import ShoppingCartBillForm from "./‌Bill";
import ShoppingCartMobileTable from "./Table/Mobile";
import ShoppingCartDesktopTable from "./Table/Desktop";
import { useCart } from "@/contexts/CartContext";
import CartSkeleton from "@/components/Skeletons/CartSkeleton";

function ShoppingCart() {
  const [submitOrderStep, setSubmitOrderStep] = useAtom(submitOrderStepAtom);
  const { cartItems, isLoading } = useCart();

  if (isLoading) return <CartSkeleton />;

  if (cartItems.length === 0) return <EmptyShoppingCart />;

  const isRTL =
    typeof document !== "undefined"
      ? document.documentElement.dir === "rtl"
      : true;
  const direction = isRTL ? 1 : -1;
  const variants = {
    initial: { opacity: 0, x: 50 * direction },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -50 * direction },
  };
  const transition = { duration: 0.3, ease: "easeInOut" } as const;

  return (
    <div className="flex flex-col gap-6 pb-20">
      <span className="text-3xl w-full text-neutral-800">سبد خرید</span>

      <AnimatePresence mode="wait">
        {submitOrderStep === SubmitOrderStep.Table && (
          <motion.div
            key="table"
            variants={variants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={transition}
          >
            <ShoppingCartDesktopTable
              cartItems={cartItems}
              className="hidden lg:block"
            />

            <ShoppingCartMobileTable
              cartItems={cartItems}
              className="lg:hidden"
            />

            <button
              onClick={() => setSubmitOrderStep(SubmitOrderStep.Bill)}
              className="text-sm w-fit rounded-lg bg-pink-500 px-6 py-2 text-white"
            >
              ادامه فرآیند خرید و تسویه حساب
            </button>
          </motion.div>
        )}

        {submitOrderStep === SubmitOrderStep.Bill && (
          <motion.div
            key="bill"
            variants={variants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={transition}
          >
            <ShoppingCartBillForm />
          </motion.div>
        )}

        {submitOrderStep === SubmitOrderStep.Success && (
          <motion.div
            key="success"
            variants={variants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={transition}
          >
            <ShoppingCartSuccessOrderSubmit />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default ShoppingCart;
