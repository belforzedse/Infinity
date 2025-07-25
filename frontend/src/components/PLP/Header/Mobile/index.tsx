"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import MobileMenu from "./MobileMenu";
import MobileSearch from "./MobileSearch";
import OrderTrackingIcon from "../../Icons/OrderTrackingIcon";
import SearchIcon from "../../Icons/SearchIcon";
import CartIcon from "../../Icons/CartIcon";
import MenuIcon from "../../Icons/MenuIcon";
import Logo from "@/components/Kits/Logo";
import ChevronDownIcon from "@/components/Search/Icons/ChevronDownIcon";
import { useCart } from "@/contexts/CartContext";

interface Props {}

export default function PLPMobileHeader({}: Props) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchInput, setSearchInput] = useState("");
  const { totalItems, openDrawer } = useCart();
  const router = useRouter();

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchInput.trim()) return;

    router.push(`/plp?search=${encodeURIComponent(searchInput.trim())}`);
  };

  return (
    <header className="lg:hidden">
      <div className="flex flex-row-reverse items-center justify-between px-4 py-3 bg-white">
        <Link
          href="/orders"
          className="flex items-center gap-1 text-neutral-800 border border-slate-200 rounded-[28px] px-4 py-3 max-h-[43px]"
        >
          <span className="text-sm">پیگیری سفارش</span>
          <OrderTrackingIcon className="text-neutral-800" />
        </Link>

        <Logo />

        {/* Left Section */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsMenuOpen(true)}
            className="flex items-center justify-center border border-slate-200 rounded-[28px] w-[43px] h-[43px]"
          >
            <MenuIcon className="text-neutral-800" />
          </button>

          <button
            onClick={openDrawer}
            className="flex items-center justify-center bg-pink-500 text-white rounded-[28px] w-[43px] h-[43px] relative"
          >
            <CartIcon className="text-white" />
            <div className="absolute -top-1 -right-1 w-5 h-5 flex items-center justify-center border border-slate-200 bg-white rounded-full">
              <span className="text-xs text-pink-500">{totalItems}</span>
            </div>
          </button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="p-4">
        <form
          onSubmit={handleSearchSubmit}
          className="flex flex-row-reverse items-center justify-between bg-white border border-slate-50 rounded-[28px] px-2 py-2"
        >
          <button
            type="submit"
            className="flex items-center gap-[2px] bg-pink-500 text-white rounded-[28px] px-2 py-1"
          >
            <span className="text-xs">جستجو</span>
            <SearchIcon className="text-white" />
          </button>

          <div className="flex w-full">
            <div className="flex items-center gap-1 border-l border-slate-200 px-2">
              <span className="text-xs text-neutral-600">محصولات</span>
              <ChevronDownIcon className="text-neutral-600" />
            </div>

            <input
              className="w-full mx-1 text-right outline-none"
              placeholder="دنبال چی میگردی؟"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
            />
          </div>
        </form>
      </div>

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
