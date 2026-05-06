import React from "react";
import { useCart } from "@/contexts/CartContext";
import CartDrawerItem from "./Item";

export default function CartDrawerContent() {
  const { cartItems } = useCart();

  return (
    <div className="flex-1 overflow-y-auto p-4">
      <div className="flex flex-col gap-4">
        {cartItems.map((item) => (
          <CartDrawerItem key={`${item.id}-${item.cartItemId ?? item.slug}`} item={item} />
        ))}
      </div>
    </div>
  );
}
