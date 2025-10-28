"use client";

import WelcomNotifBar from "@/components/User/Account/WelcomNotifBar";
import AccountForm from "@/components/User/Account/AccountForm";
import UserContainer from "@/components/layout/UserContainer";
import useUser from "@/hooks/useUser";
import useUserAccountOverview from "@/hooks/useUserAccountOverview";
import OverviewCards from "@/components/User/Account/OverviewCards";
import RecentOrders from "@/components/User/Account/RecentOrders";
import AccountQuickLinks from "@/components/User/Account/QuickLinks";
import UserSidebar from "@/components/User/Sidebar";

export default function AccountPage() {
  const { userData } = useUser();
  const { data, loading, error, refetch } = useUserAccountOverview();

  const fullName = userData
    ? `${userData.FirstName || ""} ${userData.LastName || ""}`.trim() || "کاربر"
    : "کاربر";

  const description = `${fullName} عزیز، از این بخش می‌توانید اطلاعات حساب، سفارش‌ها و تنظیمات شخصی خود را مدیریت کنید.`;

  return (
    <UserContainer className="flex flex-col gap-6 py-6 lg:py-10" dir="rtl">
      <div className="flex flex-col gap-6 lg:flex-row lg:gap-8">
        <aside className="hidden w-full max-w-[240px] flex-shrink-0 lg:block">
          <UserSidebar />
        </aside>

        <main className="flex flex-1 flex-col gap-5">
          <WelcomNotifBar username={fullName} />
          <header className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-4 shadow-sm lg:hidden lg:px-6 lg:py-6">
            <span className="text-sm font-semibold text-slate-400">مدیریت حساب کاربری</span>
            <h1 className="text-foreground-primary text-2xl font-semibold lg:text-3xl">حساب من</h1>
            <p className="text-sm text-slate-500 lg:text-base">{description}</p>
            <AccountQuickLinks />
          </header>

          <OverviewCards data={data} loading={loading} error={error} onRetry={refetch} />
          <RecentOrders data={data.orders.recent} loading={loading} />
          <AccountForm />
        </main>
      </div>
    </UserContainer>
  );
}
