"use client";

import ShoppingCartBillForm from "@/components/ShoppingCart/‌Bill";
import { motion } from "framer-motion";
import Link from "next/link";
import React from "react";

export default function CheckoutPage() {
  return (
    <motion.div
      initial={{ opacity: 0, x: 16 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.2, ease: "easeOut" }}
      className="mx-auto mt-5 px-2 pb-8 md:mt-8 md:px-1 md:pb-16 lg:px-10 xl:max-w-[1440px]"
    >
      <div className="flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <span className="text-3xl text-neutral-800">تسویه حساب</span>
          <Link
            href="/cart"
            className="text-sm text-pink-600 underline-offset-4 hover:text-pink-700"
          >
            بازگشت به سبد خرید
          </Link>
        </div>

        <ShoppingCartBillForm />
      </div>
    </motion.div>
  );
}
