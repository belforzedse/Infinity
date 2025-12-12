"use client";
import Image from "next/image";
import Link from "next/link";
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
import GlassSurface from "@/components/GlassSurface";

const CartDrawer = dynamic(() => import("@/components/ShoppingCart/Drawer"), {
  ssr: false,
});

export default function ProductLayout({ children }: { children: React.ReactNode }) {
  const { isDrawerOpen } = useCart();
  const [scrolled, setScrolled] = React.useState(false);
  const [showHeader, setShowHeader] = React.useState(true);
  const pathname = usePathname();
  const lastScrollY = React.useRef(0);
  const updateHeaderOffset = React.useCallback(() => {
    if (typeof window === "undefined") return;
    const header = document.querySelector<HTMLElement>("[data-main-header]");
    const safeArea = document.querySelector<HTMLElement>("[data-safe-area-top]");
    const headerHeight = header?.getBoundingClientRect().height ?? 0;
    const safeAreaHeight = safeArea?.getBoundingClientRect().height ?? 0;
    const offset = Math.max(0, Math.round(headerHeight + safeAreaHeight));
    document.documentElement.style.setProperty("--header-offset", `${offset}px`);
  }, []);

  React.useEffect(() => {
    const handleScroll = () => {
      const currentY = window.scrollY;
      setScrolled(currentY > 8);

      if (window.innerWidth >= 1024) {
        lastScrollY.current = currentY;
        setShowHeader(true);
        return;
      }

      const isScrollingUp = currentY <= lastScrollY.current;
      const nearTop = currentY < 80;
      setShowHeader(isScrollingUp || nearTop);
      lastScrollY.current = Math.max(0, currentY);
    };

    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  React.useEffect(() => {
    updateHeaderOffset();
    const header = typeof window !== "undefined"
      ? document.querySelector<HTMLElement>("[data-main-header]")
      : null;

    const resizeObserver =
      header && typeof ResizeObserver !== "undefined"
        ? new ResizeObserver(() => updateHeaderOffset())
        : null;

    if (header && resizeObserver) {
      resizeObserver.observe(header);
    }

    const handleResize = () => updateHeaderOffset();
    window.addEventListener("resize", handleResize, { passive: true });
    window.addEventListener("orientationchange", handleResize);

    return () => {
      resizeObserver?.disconnect();
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("orientationchange", handleResize);
    };
  }, [updateHeaderOffset]);

  React.useEffect(() => {
    updateHeaderOffset();
  }, [showHeader, updateHeaderOffset]);
  const HeaderContent = () => (
    <>
      <div className="hidden lg:block">
        <div className="px-10 py-3">
          <div className="mx-auto max-w-[1440px]">
            <div className="grid grid-cols-[1fr_auto_1fr] items-center">
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
                    className="h-[48px] w-[150px] object-contain md:h-[72px] md:w-[210px]"
                    priority
                  />
                </Link>
              </div>
              <div className="justify-self-end">
                <DesktopSearch />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="lg:hidden">
        <MobileHeader />
      </div>
    </>
  );

  const headerStyle = !showHeader
    ? { borderBottomWidth: 0, borderBottomColor: "transparent", boxShadow: "none" }
    : undefined;

  const [isStandalone, setIsStandalone] = React.useState(false);

  React.useEffect(() => {
    if (typeof window !== "undefined" && "matchMedia" in window) {
      const mq = window.matchMedia("(display-mode: standalone)");
      setIsStandalone(mq.matches);

      // Optional: listen for changes
      const handleChange = (e: MediaQueryListEvent) => {
        setIsStandalone(e.matches);
      };

      if (mq.addEventListener) {
        mq.addEventListener("change", handleChange);
        return () => mq.removeEventListener("change", handleChange);
      } else if (mq.addListener) {
        mq.addListener(handleChange);
        return () => mq.removeListener(handleChange);
      }
    }
  }, []);

  return (
    <div dir="rtl" className="bg-white pb-[81px] antialiased lg:pb-0">
      {/* Safe area white bar for standalone mode */}
      {isStandalone && (
        <div
          className="fixed left-0 right-0 top-0 z-[60] bg-white"
          data-safe-area-top
          style={{ height: "env(safe-area-inset-top)" }}
        />
      )}

      {/* Skip to content for accessibility */}
      <a
        href="#content"
        className="shadow-elevated sr-only fixed left-4 top-4 z-[60] rounded-md bg-black/80 px-3 py-2 text-white focus:not-sr-only"
      >
        پرش به محتوا
      </a>
      <header
        className={`allow-overflow sticky z-50 transform border-t-0 transition-all duration-200 ${
          scrolled ? "glass-panel shadow-sm" : "bg-white/80 supports-[backdrop-filter]:bg-white/60"
        } ${showHeader ? "translate-y-0" : "-translate-y-full"}`}
        data-main-header
        style={{
          ...headerStyle,
          top: isStandalone ? "env(safe-area-inset-top)" : "0",
        }}
      >
        <div className="relative">
          {scrolled && (
            <GlassSurface
              disableLayoutStyles
              width="100%"
              height="100%"
              borderRadius={0}
              blur={14}
              brightness={88}
              opacity={0.7}
              backgroundOpacity={0.14}
              saturation={1.3}
              distortionScale={-80}
              redOffset={4}
              greenOffset={7}
              blueOffset={9}
              mixBlendMode="screen"
              className="pointer-events-none absolute inset-0 -z-10 opacity-95"
              contentClassName="hidden"
              style={{ width: "100%", height: "100%" }}
            />
          )}
          <HeaderContent />
        </div>
      </header>

      {/* Desktop categories/navigation (not sticky) */}
      <div className="hidden lg:block">
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
