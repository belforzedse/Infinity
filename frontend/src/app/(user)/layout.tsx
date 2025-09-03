"use client";

import Footer from "@/components/PLP/Footer";
import Header from "@/components/User/Header";
import CartDrawer from "@/components/ShoppingCart/Drawer";

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
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
      <CartDrawer />
    </div>
  );
}
