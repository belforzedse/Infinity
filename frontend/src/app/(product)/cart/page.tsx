"use client";

import { useCart } from "@/contexts/CartContext";
import ShoppingCartDesktopTable from "@/components/ShoppingCart/Table/Desktop";
import ShoppingCartMobileTable from "@/components/ShoppingCart/Table/Mobile";
import CartSkeleton from "@/components/Skeletons/CartSkeleton";
import EmptyShoppingCart from "@/components/ShoppingCart/Empty";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import type { ProductCardProps } from "@/components/Product/Card";
import { getRandomProducts } from "@/services/product/homepage";
import HeartIcon from "@/components/PDP/Icons/HeartIcon";

// Lazy load offers section - not critical for initial render
const OffersListHomePage = dynamic(() => import("@/components/PDP/OffersListHomePage"), {
  ssr: false,
  loading: () => <div className="h-64 animate-pulse bg-gray-100 rounded-lg" />,
});

export default function CartPage() {
  const { cartItems, isLoading } = useCart();
  const router = useRouter();
  const [randomProducts, setRandomProducts] = useState<ProductCardProps[]>([]);
  const [, setLoadingRandom] = useState(false);

  useEffect(() => {
    // Delay fetching random products until after cart is rendered
    if (isLoading || cartItems.length === 0) return;

    let mounted = true;
    const timer = setTimeout(() => {
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
    }, 500); // Delay 500ms to prioritize cart content

    return () => {
      mounted = false;
      clearTimeout(timer);
    };
  }, [isLoading, cartItems.length]);

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
        <span className="text-3xl w-full text-neutral-800">سبد خرید</span>

        <ShoppingCartDesktopTable cartItems={cartItems} className="hidden lg:block" />
        <ShoppingCartMobileTable cartItems={cartItems} className="lg:hidden" />

        <button
          onClick={() => router.push("/checkout")}
          className="text-sm mb-10 w-fit rounded-lg bg-pink-500 px-6 py-2 text-white"
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
