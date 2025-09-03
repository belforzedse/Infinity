"use client";
import ShoppingCart from "@/components/ShoppingCart";

export default function CartPage() {
  return (
    // TODO: change contaianer to handle padding and delete padding from main
    <div
      className="container mx-auto flex min-h-[60vh] gap-10 overflow-hidden bg-white lg:p-0"
      dir="rtl"
    >
      <main className="flex flex-1 flex-col gap-3 overflow-y-auto">
        <ShoppingCart />
      </main>
    </div>
  );
}
