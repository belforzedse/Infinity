"use client";

import { useCart } from "@/contexts/CartContext";
import ShoppingCartDesktopTable from "@/components/ShoppingCart/Table/Desktop";
import ShoppingCartMobileTable from "@/components/ShoppingCart/Table/Mobile";
import CartSkeleton from "@/components/Skeletons/CartSkeleton";
import EmptyShoppingCart from "@/components/ShoppingCart/Empty";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import React from "react";

export default function CartPage() {
  const { cartItems, isLoading } = useCart();
  const router = useRouter();

  if (isLoading) return <CartSkeleton />;
  if (cartItems.length === 0) return <EmptyShoppingCart />;

  return (
    <motion.div
      initial={{ opacity: 0, x: 16 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.2, ease: "easeOut" }}
      className="mx-auto mt-5 px-2 pb-8 md:mt-8 md:px-1 md:pb-16 lg:px-10 xl:max-w-[1440px]"
    >
      <div className="flex flex-col gap-6">
        <span className="w-full text-3xl text-neutral-800">سبد خرید</span>

        <ShoppingCartDesktopTable
          cartItems={cartItems}
          className="hidden lg:block"
        />
        <ShoppingCartMobileTable cartItems={cartItems} className="lg:hidden" />

        <button
          onClick={() => router.push("/checkout")}
          className="w-fit rounded-lg bg-pink-500 px-6 py-2 text-sm text-white"
        >
          ادامه فرآیند خرید و تسویه حساب
        </button>
      </div>
    </motion.div>
  );
}
