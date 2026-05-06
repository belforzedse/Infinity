"use client";

import type { UserAccountOverview } from "@/hooks/useUserAccountOverview";
import { cn } from "@/lib/utils";
import { faNum } from "@/utils/faNum";

interface OverviewCardsProps {
  data: UserAccountOverview;
  loading: boolean;
  error: string | null;
  onRetry: () => void;
}

const SkeletonCard = () => (
  <div className="flex flex-col gap-3 rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
    <div className="h-4 w-24 animate-pulse rounded bg-slate-200" />
    <div className="h-8 w-20 animate-pulse rounded bg-slate-200" />
    <div className="h-3 w-28 animate-pulse rounded bg-slate-200" />
  </div>
);

const formatDate = (dateString: string | null) => {
  if (!dateString) return "—";

  try {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat("fa-IR", {
      year: "numeric",
      month: "long",
      day: "numeric",
    }).format(date);
  } catch {
    return "—";
  }
};

export default function OverviewCards({ data, loading, error, onRetry }: OverviewCardsProps) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <SkeletonCard key={index} />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-start gap-3 rounded-2xl border border-red-100 bg-red-50/60 p-4 text-right">
        <span className="text-sm font-medium text-red-600">{error}</span>
        <button
          onClick={onRetry}
          className="rounded-lg border border-red-200 px-3 py-1.5 text-xs text-red-600 transition-colors hover:bg-red-100"
        >
          تلاش مجدد
        </button>
      </div>
    );
  }

  const cards = [
    {
      id: "orders-total",
      label: "کل سفارش‌ها",
      value: faNum(data.orders.total),
      helper: `تحویل شده: ${faNum(data.orders.delivered)} • لغو شده: ${faNum(data.orders.cancelled)}`,
    },
    {
      id: "orders-active",
      label: "سفارش‌های در جریان",
      value: faNum(data.orders.active),
      helper: `آخرین سفارش: ${formatDate(data.orders.lastOrderDate)}`,
      highlight: data.orders.active > 0,
    },
    {
      id: "wallet-balance",
      label: "موجودی کیف پول",
      value: `${faNum(Math.floor(data.wallet.balance / 10))} تومان`,
      helper: data.wallet.balance > 0 ? "برای پرداخت‌های سریع آماده‌اید" : "برای خرید راحت‌تر کیف پول را شارژ کنید",
    },
    {
      id: "favorites",
      label: "محصولات مورد علاقه",
      value: faNum(data.favorites.count),
      helper: `آدرس‌های ذخیره‌شده: ${faNum(data.addresses.count)}`,
    },
  ];

  return (
    <div className="hidden grid-cols-1 gap-3 sm:grid-cols-2 lg:grid xl:grid-cols-4">
      {cards.map((card) => (
        <div
          key={card.id}
          className={cn(
            "flex flex-col gap-3 rounded-2xl border border-slate-100 bg-white p-4 text-right shadow-sm transition-transform hover:-translate-y-0.5 hover:shadow-md",
            card.highlight && "border-pink-200 bg-pink-50/60",
          )}
        >
          <span className="text-xs font-medium text-slate-500 lg:text-sm">{card.label}</span>
          <span className="text-foreground-primary text-2xl font-semibold lg:text-3xl">
            {card.value}
          </span>
          <span className="text-xs text-slate-500 lg:text-sm">{card.helper}</span>
        </div>
      ))}
    </div>
  );
}

