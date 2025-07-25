"use client";
import UserSidebar from "@/components/User/Sidebar";
import AddressContainer from "@/components/User/Address";
import AddAddress from "@/components/User/Address/AddAddress";
export default function AddressesPage() {
  return (
    <div
      className="flex min-h-[60vh] bg-white overflow-hidden container mx-auto gap-10 lg:p-0 px-4"
      dir="rtl"
    >
      <UserSidebar />

      <main className="flex-1 overflow-y-auto flex flex-col gap-7">
        <div className="w-full flex flex-col lg:gap-6 gap-0 flex-grow">
          <span className="lg:text-lg text-sm text-foreground-primary lg:order-1 order-2">
            آدرس‌های زیر به طور پیش‌فرض در صفحه پرداخت مورد استفاده قرار
            مي‌گیرد.
          </span>

          <div className="flex items-center justify-between w-full lg:order-2 order-1">
            <span className="text-foreground-primary text-2xl lg:flex hidden">
              آدرس صورت حساب
            </span>
            <span className="text-foreground-primary text-2xl lg:hidden flex">
              حساب من
            </span>

            <AddAddress />
          </div>

          <div className="order-3 lg:mt-0 mt-5">
            <AddressContainer />
          </div>
        </div>
      </main>
    </div>
  );
}
