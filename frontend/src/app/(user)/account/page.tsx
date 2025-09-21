"use client";

import UserSidebar from "@/components/User/Sidebar";
import WelcomNotifBar from "@/components/User/Account/WelcomNotifBar";
import AccountForm from "@/components/User/Account/AccountForm";
import useUser from "@/hooks/useUser";

export default function AccountPage() {
  const { userData } = useUser();

  const fullName = userData
    ? `${userData.FirstName || ""} ${userData.LastName || ""}`.trim()
    : "کاربر";

  return (
    <div
      className="container mx-auto flex min-h-[60vh] flex-col gap-1 bg-white px-4 lg:flex-row lg:gap-10 lg:p-0"
      dir="rtl"
    >
      <span className="text-3xl text-foreground-primary lg:hidden">حساب من</span>

      <UserSidebar />

      <main className="flex flex-1 flex-col gap-3 overflow-y-auto lg:gap-4 lg:py-8">
        <WelcomNotifBar username={fullName} />

        <AccountForm />
      </main>
    </div>
  );
}
