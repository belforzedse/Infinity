"use client";

import React from "react";
import { useRouter } from "next/navigation";
import OrdersTabs from "@/components/User/Orders/Tabs";
import UserContainer from "@/components/layout/UserContainer";
import AccountQuickLinks from "@/components/User/Account/QuickLinks";
import { StorefrontAccountShell } from "@/components/storefront";

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
      <StorefrontAccountShell contentClassName="flex flex-col gap-6">
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
      </StorefrontAccountShell>
    </UserContainer>
  );
}
