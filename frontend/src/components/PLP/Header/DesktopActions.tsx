import React from "react";
import Link from "next/link";
import ShoppingCartIcon from "@/components/PLP/Icons/ShoppingCartIcon";
import WalletIcon from "@/components/PLP/Icons/WalletIcon";
import OrderTrackingIcon from "@/components/PLP/Icons/OrderTrackingIcon";
import UserProfileIcon from "@/components/PLP/Icons/UserProfileIcon";
import { useCart } from "@/contexts/CartContext";

type Props = object;

const PLPDesktopHeaderActions = ({}: Props) => {
  const { totalItems, openDrawer } = useCart();

  return (
    <div className="inline-flex h-[21px] flex-row-reverse items-center gap-4">
      <button
        onClick={openDrawer}
        aria-label="سبد خرید"
        className="pressable flex items-center gap-1 text-pink-500 transition-colors hover:text-pink-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-pink-500 focus-visible:ring-offset-2 focus-visible:ring-offset-white"
      >
        <span className="text-xs sr-only md:not-sr-only">سبد خرید</span>
        <div className="relative">
          <ShoppingCartIcon className="h-6 w-6" />
          <div className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full border border-slate-200 bg-white">
            <span className="text-xs text-pink-500">{totalItems}</span>
          </div>
        </div>
      </button>

      <div className="h-5 w-px bg-slate-200" />

      <Link
        href="/wallet"
        aria-label="کیف پول"
        className="pressable flex items-center gap-1 text-slate-400 transition-colors hover:text-slate-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-pink-500 focus-visible:ring-offset-2 focus-visible:ring-offset-white"
      >
        <WalletIcon className="h-6 w-6" />
      </Link>

      <div className="h-5 w-px bg-slate-200" />

      <Link
        href="/orders"
        aria-label="پیگیری سفارش"
        className="pressable flex items-center gap-1 text-slate-400 transition-colors hover:text-slate-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-pink-500 focus-visible:ring-offset-2 focus-visible:ring-offset-white"
      >
        <OrderTrackingIcon className="h-6 w-6" />
      </Link>

      <div className="h-5 w-px bg-slate-200" />

      <Link
        href="/auth/login"
        aria-label="ورود"
        className="pressable flex items-center gap-1 text-slate-400 transition-colors hover:text-slate-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-pink-500 focus-visible:ring-offset-2 focus-visible:ring-offset-white"
      >
        <UserProfileIcon className="h-6 w-6" />
      </Link>
    </div>
  );
};

export default PLPDesktopHeaderActions;
