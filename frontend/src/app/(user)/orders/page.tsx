"use client";

import React from "react";
import { useRouter } from "next/navigation";
import UserSidebar from "@/components/User/Sidebar";
import BreadCrumb from "@/components/User/BreadCrumb";
import SortIcon from "@/components/User/Icons/SortIcon";
import OrdersTabs from "@/components/User/Orders/Tabs";

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
    // TODO: change contaianer to handle padding and delete padding from main
    <div
      className="flex min-h-[60vh] bg-white overflow-hidden container mx-auto gap-10 lg:p-0 px-4"
      dir="rtl"
    >
      <UserSidebar />

      <main className="flex-1 overflow-y-auto flex flex-col gap-4">
        <BreadCrumb
          onClick={() => {}}
          hasBackButton={false}
          currentTitle="تاریخچه سفارش ها"
          icon={<SortIcon className="w-5 h-5" />}
          nextStepTitle="مرتب سازی"
        />

        <div className="w-full flex lg:flex-row flex-col lg:gap-5 gap-8">
          <OrdersTabs />
        </div>
      </main>
    </div>
  );
}
