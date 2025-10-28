"use client";

import ShoppingCartBillForm from "@/components/ShoppingCart/‌Bill";
import { motion } from "framer-motion";
import Link from "next/link";
import React from "react";
import PageContainer from "@/components/layout/PageContainer";

export default function CheckoutPage() {
  return (
    <motion.section
      initial={{ opacity: 0, x: 16 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.2, ease: "easeOut" }}
    >
      <PageContainer variant="wide" className="space-y-8 pb-16 pt-8">
        <header className="flex flex-col justify-between gap-3 lg:flex-row lg:items-center">
          <div className="space-y-1">
            <h1 className="text-2xl font-semibold text-foreground-primary lg:text-3xl">تسویه حساب</h1>
            <p className="text-sm text-slate-500 lg:text-base">
              اطلاعات ارسال و پرداخت را بررسی کنید و سفارش خود را نهایی کنید.
            </p>
          </div>
          <Link
            href="/cart"
            className="text-sm rounded-lg border border-pink-200 px-4 py-2 text-pink-600 transition hover:bg-pink-50"
          >
            بازگشت به سبد خرید
          </Link>
        </header>

        <ShoppingCartBillForm />
      </PageContainer>
    </motion.section>
  );
}
