import React from "react";
import Link from "next/link";
import ShoppingCartIcon from "@/components/PLP/Icons/ShoppingCartIcon";
import WalletIcon from "@/components/PLP/Icons/WalletIcon";
import OrderTrackingIcon from "@/components/PLP/Icons/OrderTrackingIcon";
import UserProfileIcon from "@/components/PLP/Icons/UserProfileIcon";
import { useCart } from "@/contexts/CartContext";
import { useCartShellReady } from "@/hooks/useCartShellReady";

type Props = object;

const PLPDesktopHeaderActions = ({}: Props) => {
  const { totalItems, openDrawer } = useCart();
  const isCartShellReady = useCartShellReady();
  const visibleTotalItems = isCartShellReady ? totalItems : 0;

  return (
    <div className="inline-flex flex-row-reverse items-center gap-4">
      <button
        type="button"
        onClick={openDrawer}
        aria-label="سبد خرید"
        className="pressable flex items-center gap-2.5 text-infinity-primary transition-all duration-200 hover:scale-105 hover:text-infinity-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-infinity-primary focus-visible:ring-offset-2 focus-visible:ring-offset-white active:scale-95"
      >
        <div className="relative">
          <ShoppingCartIcon className="h-6 w-6" />
          <div className="absolute -right-1 -top-1 flex h-[13px] w-[13px] items-center justify-center rounded-full border border-slate-200 bg-white">
            <span className="text-xs font-normal leading-none text-infinity-primary">
              {visibleTotalItems}
            </span>
          </div>
        </div>
        <span className="text-xs leading-[21px]">سبد خرید</span>
      </button>

      <div className="h-[20.5px] w-px bg-slate-200" aria-hidden />

      <Link
        href="/wallet"
        aria-label="کیف پول"
        className="pressable text-slate-400 transition-all duration-200 hover:scale-105 hover:text-slate-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-infinity-primary focus-visible:ring-offset-2 focus-visible:ring-offset-white active:scale-95"
      >
        <WalletIcon className="h-6 w-6" />
      </Link>

      <div className="h-[20.5px] w-px bg-slate-200" aria-hidden />

      <Link
        href="/orders"
        aria-label="پیگیری سفارش"
        className="pressable text-slate-400 transition-all duration-200 hover:scale-105 hover:text-slate-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-infinity-primary focus-visible:ring-offset-2 focus-visible:ring-offset-white active:scale-95"
      >
        <OrderTrackingIcon className="h-6 w-6" />
      </Link>

      <div className="h-[20.5px] w-px bg-slate-200" aria-hidden />

      <Link
        href="/auth/login"
        aria-label="ورود"
        className="pressable text-slate-400 transition-all duration-200 hover:scale-105 hover:text-slate-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-infinity-primary focus-visible:ring-offset-2 focus-visible:ring-offset-white active:scale-95"
      >
        <UserProfileIcon className="h-6 w-6" />
      </Link>
    </div>
  );
};

export default PLPDesktopHeaderActions;
