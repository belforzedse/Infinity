"use client";
import ShoppingCart from "@/components/ShoppingCart";
import UserContainer from "@/components/layout/UserContainer";

export default function CartPage() {
  return (
    <UserContainer
      className="flex min-h-[60vh] gap-10 bg-white"
      dir="rtl"
    >
      <main className="flex flex-1 flex-col gap-3 overflow-y-auto">
        <ShoppingCart />
      </main>
    </UserContainer>
  );
}
