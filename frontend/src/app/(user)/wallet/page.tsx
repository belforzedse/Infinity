"use client";
import UserSidebar from "@/components/User/Sidebar";
import BreadCrumb from "@/components/User/BreadCrumb";
import WalletBalance from "@/components/User/Wallet/Balance";
import IncreaseBalance from "@/components/User/Wallet/IncreaseBalance";
import { useState } from "react";
import TransactionsList from "@/components/User/Wallet/TransactionsList";
import TransactionsIcon from "@/components/User/Icons/TransactionsIcon";
import UserContainer from "@/components/layout/UserContainer";

export default function WalletPage() {
  const [isTransactionsHistoryOpen, setIsTransactionsHistoryOpen] =
    useState(false);

  return (
    <UserContainer
      className="flex min-h-[60vh] gap-10 bg-white"
      dir="rtl"
    >
      <UserSidebar />

      <main className="flex flex-1 flex-col gap-3 overflow-y-auto">
        <BreadCrumb
          onClick={() =>
            setIsTransactionsHistoryOpen(!isTransactionsHistoryOpen)
          }
          isNextStepShown={isTransactionsHistoryOpen}
          hasBackButton={true}
          currentTitle="کیف پول"
          nextStepTitle="سوابق تراکنش"
          icon={<TransactionsIcon className="h-5 w-5" />}
        />

        <div className="flex w-full flex-col gap-8 lg:flex-row lg:gap-5">
          {isTransactionsHistoryOpen ? (
            <TransactionsList
              debbitList={
                [
                  // { date: "2025-02-07", amount: "345000" },
                  // { date: "2024-02-07", amount: "210000" },
                  // { date: "2024-02-12", amount: "210000" },
                  // { date: "2024-02-07", amount: "210000" },
                ]
              }
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
    </UserContainer>
  );
}
