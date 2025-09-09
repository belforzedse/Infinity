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
      <div className="flex flex-row-reverse items-center justify-between bg-white px-4 py-3">
        <Link
          href="/orders"
          className="flex max-h-[43px] items-center gap-1 rounded-[28px] border border-slate-200 px-4 py-3 text-neutral-800"
        >
          <span className="text-sm">پیگیری سفارش</span>
          <OrderTrackingIcon className="text-neutral-800" />
        </Link>

        <Logo />

        {/* Left Section */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsMenuOpen(true)}
            className="flex h-[43px] w-[43px] items-center justify-center rounded-[28px] border border-slate-200"
          >
            <MenuIcon className="text-neutral-800" />
          </button>

          <button
            onClick={openDrawer}
            className="relative flex h-[43px] w-[43px] items-center justify-center rounded-[28px] bg-pink-500 text-white"
          >
            <CartIcon className="text-white" />
            <div className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full border border-slate-200 bg-white">
              <span className="text-xs text-pink-500">{totalItems}</span>
            </div>
          </button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="p-4">
        <form
          onSubmit={handleSearchSubmit}
          className="flex flex-row-reverse items-center justify-between rounded-[28px] border border-slate-50 bg-white px-2 py-2"
        >
          <button
            type="submit"
            className="flex items-center gap-[2px] rounded-[28px] bg-pink-500 px-2 py-1 text-white"
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
              className="mx-1 w-full text-right outline-none"
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
