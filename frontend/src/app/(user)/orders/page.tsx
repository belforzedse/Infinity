"use client";

import React from "react";
import { useRouter } from "next/navigation";
import UserSidebar from "@/components/User/Sidebar";
import BreadCrumb from "@/components/User/BreadCrumb";
import SortIcon from "@/components/User/Icons/SortIcon";
import OrdersTabs from "@/components/User/Orders/Tabs";
import UserContainer from "@/components/layout/UserContainer";

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
    <UserContainer
      className="flex min-h-[60vh] gap-10 bg-white"
      dir="rtl"
    >
      <UserSidebar />

      <main className="flex flex-1 flex-col gap-4 overflow-y-auto">
        <BreadCrumb
          onClick={() => {}}
          hasBackButton={false}
          currentTitle="تاریخچه سفارش ها"
          icon={<SortIcon className="h-5 w-5" />}
          nextStepTitle="مرتب سازی"
        />

        <div className="flex w-full flex-col gap-8 lg:flex-row lg:gap-5">
          <OrdersTabs />
        </div>
      </main>
    </UserContainer>
  );
}
