"use client";
import Logo from "@/components/Kits/Logo";
import DesktopHeaderActions from "@/components/PLP/Header/DesktopActions";
import DesktopSearch from "@/components/Search/PLPDesktopSearch";
import HeaderDesktopNav from "@/components/PLP/Header/DesktopNav";
import Footer from "@/components/PLP/Footer";
import MobileHeader from "@/components/PLP/Header/Mobile";
import BottomNavigation from "@/components/PLP/BottomNavigation";
import CartDrawer from "@/components/ShoppingCart/Drawer";

export default function ProductLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div dir="rtl" className="pb-[81px] md:pb-0 bg-white">
      <header>
        <div className="hidden md:block">
          <div className="px-10 py-4">
            <div className="max-w-[1440px] mx-auto">
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
      <CartDrawer />
    </div>
  );
}
