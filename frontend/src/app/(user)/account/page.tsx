"use client";

import UserSidebar from "@/components/User/Sidebar";
import WelcomNotifBar from "@/components/User/Account/WelcomNotifBar";
import AccountForm from "@/components/User/Account/AccountForm";
import useUser from "@/hooks/useUser";

export default function AccountPage() {
  const { userData, isLoading } = useUser();

  const fullName = userData
    ? `${userData.FirstName || ""} ${userData.LastName || ""}`.trim()
    : "کاربر";

  return (
    <div
      className="flex lg:flex-row flex-col min-h-[60vh] bg-white overflow-hidden container mx-auto lg:gap-10 gap-1 lg:p-0 px-4"
      dir="rtl"
    >
      <span className="text-3xl text-foreground-primary lg:hidden">
        حساب من
      </span>

      <UserSidebar />

      <main className="flex-1 overflow-y-auto flex flex-col lg:gap-4 gap-3 lg:py-8">
        <WelcomNotifBar username={fullName} />

        <AccountForm />
      </main>
    </div>
  );
}
