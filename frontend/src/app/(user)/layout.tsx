"use client";

import Footer from "@/components/PLP/Footer";
import Header from "@/components/User/Header";
import dynamic from "next/dynamic";
import { useCart } from "@/contexts/CartContext";

const CartDrawer = dynamic(() => import("@/components/ShoppingCart/Drawer"), {
  ssr: false,
});

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isDrawerOpen } = useCart();
  return (
    <div className="public-layout bg-white pt-5">
      <div className="container mx-auto px-4 lg:p-0">
        <Header />

        {children}

        <footer>
          <Footer />
        </footer>
      </div>

      {/* Cart Drawer */}
      {isDrawerOpen && <CartDrawer />}
    </div>
  );
}
