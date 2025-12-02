"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import UserContainer from "@/components/layout/UserContainer";
import UserSidebar from "@/components/User/Sidebar";
import OrderService, { Order } from "@/services/order";
import OrderTimeline from "./OrderTimeline";
import PaymentSummaryCard from "./PaymentSummaryCard";
import ShippingInfoCard from "./ShippingInfoCard";
import OrderItemsList from "./OrderItemsList";
import SupportActions from "./SupportActions";

interface OrderDetailPageClientProps {
  orderId: string;
}

const formatTitle = (order?: Order) =>
  order ? `سفارش شماره #${order.id}` : "جزئیات سفارش";

export default function OrderDetailPageClient({ orderId }: OrderDetailPageClientProps) {
  const router = useRouter();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [fatalError, setFatalError] = useState<string | null>(null);
  const [warning, setWarning] = useState<string | null>(null);
  const hasSnapshotRef = useRef(false);

  const numericOrderId = useMemo(() => Number(orderId), [orderId]);
  const cacheKey = useMemo(() => `infinity:order-detail:${numericOrderId}`, [numericOrderId]);

  useEffect(() => {
    if (Number.isNaN(numericOrderId)) {
      router.replace("/orders");
    }
  }, [numericOrderId, router]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const cached = sessionStorage.getItem(cacheKey);
      if (!cached) return;
      const parsed: Order = JSON.parse(cached);
      if (parsed?.id === numericOrderId) {
        setOrder(parsed);
        hasSnapshotRef.current = true;
      }
    } catch (err) {
      console.warn("Failed to parse cached order detail", err);
      sessionStorage.removeItem(cacheKey);
    }
  }, [cacheKey, numericOrderId]);

  useEffect(() => {
    const token = localStorage.getItem("accessToken");
    if (!token) {
      router.push("/auth/login");
      return;
    }
  }, [router]);

  useEffect(() => {
    let isMounted = true;
    const fetchOrder = async () => {
      try {
        setLoading(true);
        const response = await OrderService.getOrderDetail(numericOrderId);
        if (!isMounted) return;
        setOrder(response);
        hasSnapshotRef.current = true;
        setFatalError(null);
        setWarning(null);
        if (typeof window !== "undefined") {
          sessionStorage.setItem(cacheKey, JSON.stringify(response));
        }
      } catch (err: any) {
        if (!isMounted) return;
        const status = err?.status ?? err?.error?.status;
        if (status === 404 && hasSnapshotRef.current) {
          setWarning("اطلاعات کامل این سفارش هنوز در دسترس نیست. داده‌های نمایش داده‌شده ممکن است ناقص باشند.");
          setFatalError(null);
          return;
        }
        if (status === 404) {
          setFatalError("سفارش مورد نظر یافت نشد.");
          setOrder(null);
        } else {
          setFatalError("بازیابی اطلاعات سفارش با خطا مواجه شد. لطفاً دوباره تلاش کنید.");
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    if (!Number.isNaN(numericOrderId)) {
      fetchOrder();
    }

    return () => {
      isMounted = false;
    };
  }, [cacheKey, numericOrderId]);

  if (loading && !order) {
    return (
      <UserContainer className="py-6 lg:py-10" dir="rtl">
        <div className="animate-pulse rounded-2xl bg-slate-100 p-6 text-center text-slate-500">
          در حال بارگذاری جزئیات سفارش...
        </div>
      </UserContainer>
    );
  }

  if (fatalError || !order) {
    return (
      <UserContainer className="py-6 lg:py-10" dir="rtl">
        <div className="flex flex-col items-center gap-4 rounded-2xl border border-rose-100 bg-rose-50 p-6 text-center text-rose-600">
          <p>{fatalError ?? "سفارش یافت نشد."}</p>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => router.refresh()}
              className="rounded-xl bg-rose-600 px-4 py-2 text-white transition hover:bg-rose-700"
            >
              تلاش مجدد
            </button>
            <button
              type="button"
              onClick={() => router.push("/orders")}
              className="rounded-xl border border-rose-200 px-4 py-2 text-rose-600 transition hover:bg-white"
            >
              بازگشت به سفارش‌ها
            </button>
          </div>
        </div>
      </UserContainer>
    );
  }

  return (
    <UserContainer className="flex flex-col gap-6 py-6 lg:py-10" dir="rtl">
      <div className="flex flex-col gap-6 lg:flex-row lg:gap-8">
        <aside className="hidden w-full max-w-[240px] flex-shrink-0 lg:block">
          <UserSidebar />
        </aside>

        <main className="flex flex-1 flex-col gap-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <button
                type="button"
                onClick={() => router.push("/orders")}
                className="mb-2 text-xs text-slate-500 transition hover:text-slate-700"
              >
                ← بازگشت به سفارش‌ها
              </button>
              <h1 className="text-2xl font-semibold text-foreground-primary lg:text-3xl">
                {formatTitle(order)}
              </h1>
              <p className="text-sm text-slate-500 lg:text-base">
                وضعیت سفارش خود را به‌صورت کامل مشاهده و پیگیری کنید.
              </p>
            </div>
          </div>

          {warning ? (
            <div className="rounded-2xl border border-amber-100 bg-amber-50 p-4 text-sm text-amber-700">
              {warning}
            </div>
          ) : null}

          <div className="grid gap-4 lg:grid-cols-2">
            <OrderTimeline order={order} />
            <ShippingInfoCard order={order} />
            <PaymentSummaryCard order={order} />
            <SupportActions orderId={order.id} shippingBarcode={order.ShippingBarcode} />
          </div>

          <OrderItemsList order={order} />
        </main>
      </div>
    </UserContainer>
  );
}

