"use client";
import { useEffect, useMemo, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import UserSidebar from "@/components/User/Sidebar";
import WalletBalance from "@/components/User/Wallet/Balance";
import IncreaseBalance from "@/components/User/Wallet/IncreaseBalance";
import TransactionsList from "@/components/User/Wallet/TransactionsList";
import TransactionsIcon from "@/components/User/Icons/TransactionsIcon";
import UserContainer from "@/components/layout/UserContainer";
import AccountQuickLinks from "@/components/User/Account/QuickLinks";
import { AlertCircleIcon, CheckIcon } from "lucide-react";
import WalletService from "@/services/wallet";

function StatusBanner({ variant, title, description }: { variant: "success" | "error"; title: string; description: string }) {
  const styles =
    variant === "success"
      ? "border-green-200 bg-green-50 text-green-800"
      : "border-red-200 bg-red-50 text-red-800";

  const Icon = variant === "success" ? CheckIcon : AlertCircleIcon;

  return (
    <div className={`flex items-start gap-3 rounded-2xl border px-4 py-3 text-sm md:text-base ${styles}`}>
      <Icon className="mt-0.5 h-5 w-5 flex-shrink-0" />
      <div className="flex flex-col gap-1">
        <span className="font-semibold">{title}</span>
        <span className="text-xs md:text-sm">{description}</span>
      </div>
    </div>
  );
}

interface Transaction {
  date: string;
  amount: string;
}

export default function WalletPage() {
  const [isTransactionsHistoryOpen, setIsTransactionsHistoryOpen] = useState(false);
  const [depositList, setDepositList] = useState<Transaction[]>([]);
  const [transactionsLoading, setTransactionsLoading] = useState(false);
  const [transactionsError, setTransactionsError] = useState<string | null>(null);
  const searchParams = useSearchParams();
  const router = useRouter();
  const status = searchParams.get("status");
  const reason = searchParams.get("reason");
  const code = searchParams.get("code");

  const statusConfig = useMemo(() => {
    if (status === "success") {
      return {
        variant: "success" as const,
        title: "شارژ کیف پول با موفقیت انجام شد",
        description: "موجودی شما به‌روزرسانی شد. می‌توانید از آن در خرید بعدی استفاده کنید.",
      };
    }

    if (status === "failure") {
      const reasonMessage =
        reason === "not_found"
          ? "درخواست شارژ پیدا نشد. لطفاً دوباره امتحان کنید."
          : reason === "verify"
            ? "تأیید پرداخت توسط بانک ناموفق بود. لطفاً دوباره تلاش کنید."
            : reason === "settle"
              ? "مشکل در ثبت نهایی پرداخت. در صورت کسر وجه با پشتیبانی تماس بگیرید."
              : reason === "wallet_update"
                ? "پرداخت انجام شد اما به‌روزرسانی کیف پول ناموفق بود. لطفاً با پشتیبانی تماس بگیرید."
                : reason === "internal"
                  ? "در حین پردازش پرداخت خطایی رخ داد."
                  : code
                    ? `پرداخت توسط بانک با خطا (${code}) مواجه شد.`
                    : "پرداخت ناموفق بود. لطفاً دوباره تلاش کنید.";

      return {
        variant: "error" as const,
        title: "پرداخت ناموفق بود",
        description: reasonMessage,
      };
    }

    if (status === "pending") {
      return {
        variant: "error" as const,
        title: "پرداخت در انتظار تأیید",
        description: "نتیجه پرداخت مشخص نشد. اگر مبلغ از حساب شما کسر شده است، با پشتیبانی تماس بگیرید.",
      };
    }

    return null;
  }, [status, reason, code]);

  useEffect(() => {
    if (statusConfig) {
      const cleanup = setTimeout(() => {
        const params = new URLSearchParams(Array.from(searchParams.entries()));
        params.delete("status");
        params.delete("reason");
        params.delete("code");
        router.replace(`/wallet${params.toString() ? `?${params}` : ""}`);
      }, 6000);
      return () => clearTimeout(cleanup);
    }
    return undefined;
  }, [router, searchParams, statusConfig]);

  // Fetch transactions when transactions history is opened
  useEffect(() => {
    const fetchTransactions = async () => {
      if (!isTransactionsHistoryOpen) return;

      try {
        setTransactionsLoading(true);
        setTransactionsError(null);

        // First get wallet to get wallet ID
        const walletResponse = await WalletService.getMyWallet();
        if (!walletResponse.success || !walletResponse.data?.id) {
          throw new Error("Wallet not found");
        }

        const walletId = walletResponse.data.id;

        // Fetch transactions
        const transactionsResponse = await WalletService.getWalletTransactions(walletId);
        const transactionsData = transactionsResponse.data || [];

        // Transform transactions to match Transaction interface (only deposits)
        const deposits: Transaction[] = [];

        transactionsData.forEach((tx) => {
          // Only include "Add" type transactions (deposits)
          if (tx.Type === "Add") {
            const transaction: Transaction = {
              date: tx.Date ? new Date(tx.Date).toISOString().split("T")[0] : "",
              amount: tx.Amount ? (tx.Amount / 10).toLocaleString() : "0", // Convert IRR to toman
            };
            deposits.push(transaction);
          }
        });

        setDepositList(deposits);
      } catch (err: any) {
        console.error("Failed to fetch transactions:", err);
        setTransactionsError(err.message || "خطا در دریافت تراکنش‌ها");
        setDepositList([]);
      } finally {
        setTransactionsLoading(false);
      }
    };

    fetchTransactions();
  }, [isTransactionsHistoryOpen]);

  return (
    <UserContainer className="flex flex-col gap-6 py-6 lg:py-10" dir="rtl">
      {statusConfig ? (
        <StatusBanner variant={statusConfig.variant} title={statusConfig.title} description={statusConfig.description} />
      ) : null}
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
              transactionsLoading ? (
                <div className="flex w-full items-center justify-center rounded-xl border border-slate-200 bg-white p-8">
                  <div className="h-10 w-10 animate-spin rounded-full border-b-2 border-t-2 border-pink-500"></div>
                </div>
              ) : transactionsError ? (
                <div className="flex w-full items-center justify-center rounded-xl border border-red-200 bg-red-50 p-8 text-red-800">
                  <span>{transactionsError}</span>
                </div>
              ) : (
                <TransactionsList depositList={depositList} />
              )
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
