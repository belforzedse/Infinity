"use client";
import UserSidebar from "@/components/User/Sidebar";
import AddressContainer from "@/components/User/Address";
import AddAddress from "@/components/User/Address/AddAddress";
export default function AddressesPage() {
  return (
    <div className="container mx-auto flex min-h-[60vh] gap-10 bg-white px-4 lg:p-0" dir="rtl">
      <UserSidebar />

      <main className="flex flex-1 flex-col gap-7 overflow-y-auto">
        <div className="flex w-full flex-grow flex-col gap-0 lg:gap-6">
          <span className="text-sm order-2 text-foreground-primary lg:text-lg lg:order-1">
            آدرس‌های زیر به طور پیش‌فرض در صفحه پرداخت مورد استفاده قرار مي‌گیرد.
          </span>

          <div className="order-1 flex w-full items-center justify-between lg:order-2">
            <span className="text-2xl hidden text-foreground-primary lg:flex">آدرس صورت حساب</span>
            <span className="text-2xl flex text-foreground-primary lg:hidden">حساب من</span>

            <AddAddress />
          </div>

          <div className="order-3 mt-5 lg:mt-0">
            <AddressContainer />
          </div>
        </div>
      </main>
    </div>
  );
}
