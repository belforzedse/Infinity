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

const CartDrawer = dynamic(
  () => import("@/components/ShoppingCart/Drawer"),
  { ssr: false }
);

export default function ProductLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isDrawerOpen } = useCart();
  return (
    <div dir="rtl" className="bg-white antialiased scroll-smooth pb-[81px] md:pb-0">
      <header>
        <div className="hidden md:block">
          <div className="px-10 py-4">
            <div className="mx-auto max-w-[1440px]">
              <div className="flex items-center justify-between">
                <DesktopHeaderActions />
                <Logo />
                <DesktopSearch />
              </div>
            </div>
          </div>
          <HeaderDesktopNav />
        </div>

        <div className="md:hidden">
          <MobileHeader />
        </div>
      </header>

      <section>{children}</section>

      <footer>
        <Footer />
      </footer>

      <BottomNavigation />

      {/* Cart Drawer */}
      {isDrawerOpen && <CartDrawer />}
    </div>
  );
}
