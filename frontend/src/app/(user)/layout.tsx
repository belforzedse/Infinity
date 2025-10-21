"use client";

import Footer from "@/components/PLP/Footer";
import dynamic from "next/dynamic";
import { useCart } from "@/contexts/CartContext";
import Image from "next/image";
import Link from "next/link";
import DesktopHeaderActions from "@/components/PLP/Header/DesktopActions";
import DesktopSearch from "@/components/Search/PLPDesktopSearch";
import MobileHeader from "@/components/PLP/Header/Mobile";

const CartDrawer = dynamic(() => import("@/components/ShoppingCart/Drawer"), {
  ssr: false,
});

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  const { isDrawerOpen } = useCart();

  return (
    <div className="public-layout bg-white" dir="rtl">
      {/* Sitewide Header */}
      <header className="sticky top-0 z-50 bg-white shadow-sm">
        <div className="container mx-auto px-4 lg:px-8">
          {/* Desktop Header */}
          <div className="hidden md:block py-3">
            <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-4">
              <div className="justify-self-start">
                <DesktopHeaderActions />
              </div>
              <div className="justify-self-center">
                <Link href="/">
                  <Image
                    alt="logo"
                    width={210}
                    height={72}
                    src="/images/full-logo.png"
                    className="h-12 w-32 object-contain md:h-18 md:w-52"
                    priority
                  />
                </Link>
              </div>
              <div className="justify-self-end">
                <DesktopSearch />
              </div>
            </div>
          </div>

          {/* Mobile Header */}
          <div className="md:hidden">
            <MobileHeader />
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 lg:px-8">
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
