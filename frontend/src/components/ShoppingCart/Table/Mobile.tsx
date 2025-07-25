"use client";

import Image from "next/image";
import ShoppingCartMobileProductCard from "./MobileProductCard";
import { CartItem } from "@/contexts/CartContext";

interface Props {
  cartItems: CartItem[];
  className?: string;
}

export default function ShoppingCartMobileTable({
  cartItems,
  className,
}: Props) {
  return (
    <div className={`flex flex-col gap-3 w-full ${className}`}>
      {cartItems.map((cartItem) => (
        <ShoppingCartMobileProductCard key={cartItem.id} cartItem={cartItem} />
      ))}
    </div>
  );
}
