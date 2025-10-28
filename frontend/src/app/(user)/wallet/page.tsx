"use client";
import { useState } from "react";
import UserSidebar from "@/components/User/Sidebar";
import WalletBalance from "@/components/User/Wallet/Balance";
import IncreaseBalance from "@/components/User/Wallet/IncreaseBalance";
import TransactionsList from "@/components/User/Wallet/TransactionsList";
import TransactionsIcon from "@/components/User/Icons/TransactionsIcon";
import UserContainer from "@/components/layout/UserContainer";
import AccountQuickLinks from "@/components/User/Account/QuickLinks";

export default function WalletPage() {
  const [isTransactionsHistoryOpen, setIsTransactionsHistoryOpen] = useState(false);

  return (
    <UserContainer className="flex flex-col gap-6 py-6 lg:py-10" dir="rtl">
      <div className="flex flex-col gap-6 lg:flex-row lg:gap-8">
        <aside className="hidden w-full max-w-[240px] flex-shrink-0 lg:block">
          <UserSidebar />
        </aside>

        <main className="flex flex-1 flex-col gap-6">
          <AccountQuickLinks />

          <div className="flex flex-col gap-2">
            <h1 className="text-2xl font-semibold text-foreground-primary lg:text-3xl">کیف پول</h1>
            <p className="text-sm text-slate-500 lg:text-base">
              موجودی خود را مدیریت کنید و حساب را به‌راحتی شارژ یا پیگیری کنید.
            </p>
          </div>

          <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-4 shadow-sm lg:flex-row lg:items-center lg:justify-between lg:px-6">
            <span className="text-sm text-slate-600 lg:text-base">
              {isTransactionsHistoryOpen
                ? "نمایش سوابق و جزئیات تراکنش‌های کیف پول."
                : "برای مشاهده تاریخچه تراکنش‌ها یا ثبت شارژ جدید اقدام کنید."}
            </span>
            <button
              type="button"
              onClick={() => setIsTransactionsHistoryOpen((prev) => !prev)}
              className="flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2 text-sm text-slate-600 transition hover:border-pink-200 hover:text-pink-600"
            >
              <TransactionsIcon className="h-5 w-5" />
              <span>{isTransactionsHistoryOpen ? "نمایش موجودی و شارژ" : "مشاهده سوابق تراکنش"}</span>
            </button>
          </div>

          <div className="flex w-full flex-col gap-6 lg:flex-row lg:gap-5">
            {isTransactionsHistoryOpen ? (
              <TransactionsList
                debbitList={[]}
                depositList={[
                  { date: "2025-02-07", amount: "50000" },
                  { date: "2025-02-07", amount: "50000" },
                ]}
              />
            ) : (
              <>
                <WalletBalance />
                <IncreaseBalance />
              </>
            )}
          </div>
        </main>
      </div>
    </UserContainer>
  );
}
