"use client";
import UserSidebar from "@/components/User/Sidebar";
import BreadCrumb from "@/components/User/BreadCrumb";
import WalletBalance from "@/components/User/Wallet/Balance";
import IncreaseBalance from "@/components/User/Wallet/IncreaseBalance";
import { useState } from "react";
import TransactionsList from "@/components/User/Wallet/TransactionsList";
import TransactionsIcon from "@/components/User/Icons/TransactionsIcon";

export default function WalletPage() {
  const [isTransactionsHistoryOpen, setIsTransactionsHistoryOpen] =
    useState(false);

  return (
    // TODO: change contaianer to handle padding and delete padding from main
    <div
      className="flex min-h-[60vh] bg-white overflow-hidden container mx-auto gap-10 lg:p-0 px-4"
      dir="rtl"
    >
      <UserSidebar />

      <main className="flex-1 overflow-y-auto flex flex-col gap-3">
        <BreadCrumb
          onClick={() =>
            setIsTransactionsHistoryOpen(!isTransactionsHistoryOpen)
          }
          isNextStepShown={isTransactionsHistoryOpen}
          hasBackButton={true}
          currentTitle="کیف پول"
          nextStepTitle="سوابق تراکنش"
          icon={<TransactionsIcon className="w-5 h-5" />}
        />

        <div className="w-full flex lg:flex-row flex-col lg:gap-5 gap-8">
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
    </div>
  );
}
