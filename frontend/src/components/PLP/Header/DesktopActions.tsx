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
        className="flex items-center gap-1 text-pink-500 hover:text-pink-600"
      >
        <span className="text-xs">سبد خرید</span>
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
        className="flex items-center gap-1 text-slate-400 hover:text-slate-500"
      >
        <WalletIcon className="h-6 w-6" />
      </Link>

      <div className="h-5 w-px bg-slate-200" />

      <Link
        href="/orders"
        className="flex items-center gap-1 text-slate-400 hover:text-slate-500"
      >
        <OrderTrackingIcon className="h-6 w-6" />
      </Link>

      <div className="h-5 w-px bg-slate-200" />

      <Link
        href="/auth/login"
        className="flex items-center gap-1 text-slate-400 hover:text-slate-500"
      >
        <UserProfileIcon className="h-6 w-6" />
      </Link>
    </div>
  );
};

export default PLPDesktopHeaderActions;
