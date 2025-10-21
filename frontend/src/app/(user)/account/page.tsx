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
      className="container mx-auto flex min-h-[60vh] flex-col gap-4 bg-white px-4 py-4 lg:flex-row lg:gap-8 lg:px-8 lg:py-8"
      dir="rtl"
    >
      <span className="text-2xl font-semibold text-foreground-primary lg:hidden">حساب من</span>

      <UserSidebar />

      <main className="flex flex-1 flex-col gap-4">
        <WelcomNotifBar username={fullName} />

        <AccountForm />
      </main>
    </div>
  );
}
