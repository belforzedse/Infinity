"use client";
import Logo from "@/components/Kits/Logo";
import DesktopHeaderActions from "@/components/PLP/Header/DesktopActions";
import DesktopSearch from "@/components/Search/PLPDesktopSearch";
import HeaderDesktopNav from "@/components/PLP/Header/DesktopNav";
import Footer from "@/components/PLP/Footer";
import MobileHeader from "@/components/PLP/Header/Mobile";
import BottomNavigation from "@/components/PLP/BottomNavigation";
import dynamic from "next/dynamic";
import { useCart } from "@/contexts/CartContext";
import React from "react";
import ScrollToTop from "@/components/ScrollToTop";
import { motion } from "framer-motion";
import { usePathname } from "next/navigation";

const CartDrawer = dynamic(() => import("@/components/ShoppingCart/Drawer"), {
  ssr: false,
});

export default function ProductLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isDrawerOpen } = useCart();
  const [scrolled, setScrolled] = React.useState(false);
  const pathname = usePathname();

  React.useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  return (
    <div dir="rtl" className="bg-white pb-[81px] antialiased md:pb-0">
      {/* Skip to content for accessibility */}
      <a
        href="#content"
        className="shadow-elevated sr-only fixed left-4 top-4 z-[60] rounded-md bg-black/80 px-3 py-2 text-white focus:not-sr-only"
      >
        پرش به محتوا
      </a>
      <header
        className={`sticky top-0 z-50 transition-all ${
          scrolled
            ? "glass-panel shadow-sm"
            : "bg-white/80 supports-[backdrop-filter]:bg-white/60"
        }`}
      >
        <div className="hidden md:block">
          <div className="px-10 py-3">
            <div className="mx-auto max-w-[1440px]">
              <div className="grid grid-cols-[1fr_auto_1fr] items-center">
                <div className="justify-self-start">
                  <DesktopHeaderActions />
                </div>
                <div className="justify-self-center">
                  <Logo />
                </div>
                <div className="justify-self-end">
                  <DesktopSearch />
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="md:hidden">
          <MobileHeader />
        </div>
      </header>

      {/* Desktop categories/navigation (not sticky) */}
      <div className="hidden md:block">
        <HeaderDesktopNav />
      </div>

      <motion.section
        key={pathname}
        id="content"
        initial={{ opacity: 0, x: 16 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.2, ease: "easeOut" }}
      >
        {children}
      </motion.section>

      <footer>
        <Footer />
      </footer>

      <BottomNavigation />

      {/* Cart Drawer */}
      {isDrawerOpen && <CartDrawer />}

      <ScrollToTop />
    </div>
  );
}
