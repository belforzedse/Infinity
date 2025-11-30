"use client";

import { useState, useEffect } from "react";
import MobileMenu from "./MobileMenu";
import MobileSearch from "./MobileSearch";
import OrderTrackingIcon from "../../Icons/OrderTrackingIcon";
import SearchIcon from "../../Icons/SearchIcon";
import CartIcon from "../../Icons/CartIcon";
import MenuIcon from "../../Icons/MenuIcon";
import Logo from "@/components/Kits/Logo";
import { useCart } from "@/contexts/CartContext";

type Props = object;

export default function PLPMobileHeader({}: Props) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const { totalItems, openDrawer } = useCart();
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
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

  // Search is handled within the MobileSearch modal

  return (
    <>
      {/* Safe area white bar for standalone mode */}
      {isStandalone && (
        <div
          className="fixed top-0 left-0 right-0 z-[60] bg-white lg:hidden"
          style={{ height: "env(safe-area-inset-top)" }}
        />
      )}
      <header
        className="lg:hidden"
        style={{
          paddingTop: "0.75rem",
          marginTop: isStandalone ? "env(safe-area-inset-top)" : "0",
        }}
      >
      <div className="flex flex-row-reverse items-center justify-between bg-transparent px-4 py-3">
        <button
          onClick={() => window.location.href = "/orders"}
          className="flex items-center gap-1 rounded-full border border-slate-200 bg-white px-3 py-2"
          aria-label="پیگیری سفارش"
        >
          <span className="text-xs font-medium text-neutral-800">پیگیری سفارش</span>
          <OrderTrackingIcon className="text-neutral-800" />
        </button>

        <Logo />

        {/* Left Section */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsSearchOpen(true)}
            className="hidden 440:flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white"
            aria-label="جستجو"
          >
            <SearchIcon className="text-neutral-800" />
          </button>
          <button
            onClick={() => setIsMenuOpen(true)}
            className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white"
            aria-label="فهرست"
          >
            <MenuIcon className="text-neutral-800" />
          </button>

          <button
            onClick={openDrawer}
            className="relative flex h-10 w-10 items-center justify-center rounded-full bg-pink-500"
            aria-label="سبد خریدتان"
          >
            <CartIcon className="text-white" />
            <div className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full border border-slate-200 bg-white">
              <span className="text-xs text-pink-500">{totalItems}</span>
            </div>
          </button>
        </div>
      </div>

      {/* Search Bar managed via MobileSearch modal */}

      {/* Mobile Menu Modal */}
      <MobileMenu
        isOpen={isMenuOpen}
        onClose={() => setIsMenuOpen(false)}
        onSearchClick={() => setIsSearchOpen(true)}
      />

      {/* Mobile Search Modal */}
      <MobileSearch isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
    </header>
    </>
  );
}
