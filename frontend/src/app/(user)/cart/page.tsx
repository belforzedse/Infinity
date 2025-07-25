"use client";
import ShoppingCart from "@/components/ShoppingCart";

export default function CartPage() {
  return (
    // TODO: change contaianer to handle padding and delete padding from main
    <div
      className="flex min-h-[60vh] bg-white overflow-hidden container mx-auto gap-10 lg:p-0"
      dir="rtl"
    >
      <main className="flex-1 overflow-y-auto flex flex-col gap-3">
        <ShoppingCart />
      </main>
    </div>
  );
}
