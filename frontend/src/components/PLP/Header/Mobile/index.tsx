"use client";

import Link from "next/link";
import { useState } from "react";
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

  // Search is handled within the MobileSearch modal

  return (
    <header className="lg:hidden">
      <div className="flex flex-row-reverse items-center justify-between bg-transparent px-4 py-3">
        <Link
          href="/orders"
          className="pressable flex max-h-[43px] items-center gap-1 rounded-[28px] border border-slate-200 bg-white/60 px-4 py-3 text-neutral-800 backdrop-blur-sm transition-colors hover:bg-white/80"
        >
          <span className="text-sm">پیگیری سفارش</span>
          <OrderTrackingIcon className="text-neutral-800" />
        </Link>

        <Logo />

        {/* Left Section */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsSearchOpen(true)}
            className="pressable flex h-[43px] w-[43px] items-center justify-center rounded-[28px] border border-slate-200 bg-white/50 backdrop-blur-sm transition-colors hover:bg-white/70"
            aria-label="جستجو"
          >
            <SearchIcon className="text-neutral-800" />
          </button>
          <button
            onClick={() => setIsMenuOpen(true)}
            className="pressable flex h-[43px] w-[43px] items-center justify-center rounded-[28px] border border-slate-200 bg-white/50 backdrop-blur-sm transition-colors hover:bg-white/70"
          >
            <MenuIcon className="text-neutral-800" />
          </button>

          <button
            onClick={openDrawer}
            className="pressable relative flex h-[43px] w-[43px] items-center justify-center rounded-[28px] bg-pink-500 text-white transition-transform"
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
      <MobileMenu isOpen={isMenuOpen} onClose={() => setIsMenuOpen(false)} />

      {/* Mobile Search Modal */}
      <MobileSearch
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
      />
    </header>
  );
}
