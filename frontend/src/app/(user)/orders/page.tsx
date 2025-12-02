"use client";

import React from "react";
import { useRouter } from "next/navigation";
import OrdersTabs from "@/components/User/Orders/Tabs";
import UserContainer from "@/components/layout/UserContainer";
import UserSidebar from "@/components/User/Sidebar";
import AccountQuickLinks from "@/components/User/Account/QuickLinks";

export default function OrdersPage() {
  const router = useRouter();

  // Check if the user is authenticated (client-side)
  React.useEffect(() => {
    const token = localStorage.getItem("accessToken");
    if (!token) {
      router.push("/auth/login");
    }
  }, [router]);

  return (
    <UserContainer className="flex flex-col gap-6 py-6 lg:py-10" dir="rtl">
      <div className="flex flex-col gap-6 lg:flex-row lg:gap-8">
        <aside className="hidden w-full max-w-[240px] flex-shrink-0 lg:block">
          <UserSidebar />
        </aside>

        <main className="flex flex-1 flex-col gap-6">
          <AccountQuickLinks />

          <div className="flex flex-col gap-2">
            <h1 className="text-2xl font-semibold text-foreground-primary lg:text-3xl">
              تاریخچه سفارش‌ها
            </h1>
            <p className="text-sm text-slate-500 lg:text-base">
              سفارش‌های خود را ردیابی کنید، وضعیت پرداخت را بررسی کنید و جزئیات هر سفارش را ببینید.
            </p>
          </div>

          <OrdersTabs />
        </main>
      </div>
    </UserContainer>
  );
}
