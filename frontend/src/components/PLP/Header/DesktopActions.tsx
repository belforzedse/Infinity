import React from "react";
import Link from "next/link";
import ShoppingCartIcon from "@/components/PLP/Icons/ShoppingCartIcon";
import WalletIcon from "@/components/PLP/Icons/WalletIcon";
import OrderTrackingIcon from "@/components/PLP/Icons/OrderTrackingIcon";
import UserProfileIcon from "@/components/PLP/Icons/UserProfileIcon";
import { useCart } from "@/contexts/CartContext";

type Props = {};

const PLPDesktopHeaderActions = ({}: Props) => {
  const { totalItems, openDrawer } = useCart();

  return (
    <div className="items-center gap-4 flex-row-reverse inline-flex h-[21px]">
      <button
        onClick={openDrawer}
        className="flex items-center gap-1 text-pink-500 hover:text-pink-600"
      >
        <span className="text-xs">سبد خرید</span>
        <div className="relative">
          <ShoppingCartIcon className="w-6 h-6" />
          <div className="absolute -top-1 -right-1 w-4 h-4 flex items-center justify-center bg-white border border-slate-200 rounded-full">
            <span className="text-xs text-pink-500">{totalItems}</span>
          </div>
        </div>
      </button>

      <div className="w-px h-5 bg-slate-200" />

      <Link
        href="/wallet"
        className="flex items-center gap-1 text-slate-400 hover:text-slate-500"
      >
        <WalletIcon className="w-6 h-6" />
      </Link>

      <div className="w-px h-5 bg-slate-200" />

      <Link
        href="/orders"
        className="flex items-center gap-1 text-slate-400 hover:text-slate-500"
      >
        <OrderTrackingIcon className="w-6 h-6" />
      </Link>

      <div className="w-px h-5 bg-slate-200" />

      <Link
        href="/auth/login"
        className="flex items-center gap-1 text-slate-400 hover:text-slate-500"
      >
        <UserProfileIcon className="w-6 h-6" />
      </Link>
    </div>
  );
};

export default PLPDesktopHeaderActions;
