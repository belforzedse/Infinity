"use client";

import UserSidebar from "@/components/User/Sidebar";
import AddressContainer from "@/components/User/Address";
import UserContainer from "@/components/layout/UserContainer";
import AccountQuickLinks from "@/components/User/Account/QuickLinks";

export default function AddressesPage() {
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
              آدرس‌های من
            </h1>
            <p className="text-sm text-slate-500 lg:text-base">
              آدرس‌های ذخیره‌شده برای پرداخت سریع و ارسال سفارش را مدیریت کنید.
            </p>
          </div>

          <section className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white px-4 py-4 shadow-sm lg:px-6 lg:py-6">
            <span className="text-sm text-slate-600 lg:text-base">
              آدرس‌های پیش‌فرض در صفحه پرداخت نمایش داده می‌شوند.
            </span>

            <AddressContainer />
          </section>
        </main>
      </div>
    </UserContainer>
  );
}
