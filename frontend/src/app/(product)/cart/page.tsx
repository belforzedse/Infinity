"use client";

import { useCart } from "@/contexts/CartContext";
import ShoppingCartDesktopTable from "@/components/ShoppingCart/Table/Desktop";
import ShoppingCartMobileTable from "@/components/ShoppingCart/Table/Mobile";
import CartSkeleton from "@/components/Skeletons/CartSkeleton";
import EmptyShoppingCart from "@/components/ShoppingCart/Empty";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";
import OffersListHomePage from "@/components/PDP/OffersListHomePage";
import type { ProductCardProps } from "@/components/Product/Card";
import { getRandomProducts } from "@/services/product/homepage";
import HeartIcon from "@/components/PDP/Icons/HeartIcon";

export default function CartPage() {
  const { cartItems, isLoading } = useCart();
  const router = useRouter();
  const [randomProducts, setRandomProducts] = useState<ProductCardProps[]>([]);
  const [_loadingRandom, setLoadingRandom] = useState(false);

  useEffect(() => {
    let mounted = true;
    const run = async () => {
      try {
        setLoadingRandom(true);
        const items = await getRandomProducts(60, 12);
        if (mounted) setRandomProducts(items);
      } finally {
        if (mounted) setLoadingRandom(false);
      }
    };
    run();
    return () => {
      mounted = false;
    };
  }, []);

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
          className="mb-10 w-fit rounded-lg bg-pink-500 px-6 py-2 text-sm text-white"
        >
          ادامه فرآیند خرید و تسویه حساب
        </button>

        {randomProducts.length > 0 && (
          <div className="mt-4">
            <OffersListHomePage
              icon={<HeartIcon />}
              title="پیشناهاد ما برای شما"
              products={randomProducts}
            />
          </div>
        )}
      </div>
    </motion.div>
  );
}
