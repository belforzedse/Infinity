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
import PageContainer from "@/components/layout/PageContainer";

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
  if (cartItems.length === 0) {
    return (
      <PageContainer variant="wide" className="flex min-h-[60vh] items-center justify-center pb-16 pt-8">
        <EmptyShoppingCart />
      </PageContainer>
    );
  }

  return (
    <motion.section
      initial={{ opacity: 0, x: 16 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.2, ease: "easeOut" }}
    >
      <PageContainer variant="wide" className="space-y-8 pb-16 pt-8">
        <header className="flex flex-col gap-2">
          <h1 className="text-2xl font-semibold text-foreground-primary lg:text-3xl">سبد خرید</h1>
          <p className="text-sm text-slate-500 lg:text-base">
            اقلام انتخابی شما در یک نگاه. تغییرات خود را اعمال کنید و مرحله پرداخت را ادامه دهید.
          </p>
        </header>

        <div className="flex flex-col gap-6">
          <ShoppingCartDesktopTable cartItems={cartItems} className="hidden lg:block" />
          <ShoppingCartMobileTable cartItems={cartItems} className="lg:hidden" />

          <button
            onClick={() => router.push("/checkout")}
            className="text-sm w-full rounded-lg bg-pink-500 px-6 py-3 text-white transition hover:bg-pink-600 lg:w-fit"
          >
            ادامه فرآیند خرید و تسویه حساب
          </button>

          {randomProducts.length > 0 && (
            <div className="mt-6">
              <OffersListHomePage
                icon={<HeartIcon />}
                title="پیشنهاد ما برای شما"
                products={randomProducts}
              />
            </div>
          )}
        </div>
      </PageContainer>
    </motion.section>
  );
}
