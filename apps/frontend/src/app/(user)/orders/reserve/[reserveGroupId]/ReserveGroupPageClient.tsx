"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import UserContainer from "@/components/layout/UserContainer";
import OrderRow from "@/components/User/Orders/OrderRow";
import OrderCard from "@/components/User/Orders/OrderCard";
import OrderCardSkeleton from "@/components/User/Orders/OrderCardSkeleton";
import OrderRowSkeleton from "@/components/User/Orders/OrderRowSkeleton";
import OrderDetailsDrawer from "@/components/User/Orders/OrderDetailsDrawer";
import OrderService from "@/services/order";
import type { Order } from "@/services/order";
import { faNum } from "@/utils/faNum";
import { IMAGE_BASE_URL, PLACEHOLDER_IMAGE } from "@/utils/orderDisplayConstants";
import {
  formatOrderDate,
  formatOrderTime,
  mapOrderToDisplayProps,
  persistOrderSnapshot,
} from "@/utils/orderDisplayHelpers";
import { ChevronRight } from "lucide-react";
import toast from "react-hot-toast";
import { StorefrontAccountShell } from "@/components/storefront";

export default function ReserveGroupPage() {
  const router = useRouter();
  const params = useParams();
  const reserveGroupId = typeof params?.reserveGroupId === "string" ? params.reserveGroupId : null;
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [releasingOrderId, setReleasingOrderId] = useState<number | null>(null);

  useEffect(() => {
    const token = typeof window !== "undefined" ? localStorage.getItem("accessToken") : null;
    if (!token) {
      router.push("/auth/login");
      return;
    }
  }, [router]);

  const RESERVE_GROUP_PAGE_SIZE = 100;

  const loadOrders = useCallback(async () => {
    if (!reserveGroupId) return;
    try {
      setLoading(true);
      const first = await OrderService.getMyOrders(1, RESERVE_GROUP_PAGE_SIZE, { reserveGroupId });
      const pageCount = first.meta?.pagination?.pageCount ?? 1;
      if (pageCount <= 1) {
        setOrders(first.data);
        return;
      }
      const all: Order[] = [...first.data];
      for (let p = 2; p <= pageCount; p++) {
        const next = await OrderService.getMyOrders(p, RESERVE_GROUP_PAGE_SIZE, { reserveGroupId });
        all.push(...next.data);
      }
      setOrders(all);
    } catch (err) {
      console.error("Error fetching reserve group orders:", err);
      setOrders([]);
    } finally {
      setLoading(false);
    }
  }, [reserveGroupId]);

  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  const handleReleaseReserve = useCallback(
    async (orderId: number) => {
      try {
        setReleasingOrderId(orderId);
        await OrderService.releaseReserve(orderId);
        toast.success("سفارش شما برای ارسال آماده شد");
        await loadOrders();
      } catch (err) {
        console.error("Failed to release reserve:", err);
        toast.error("خطا در به‌روزرسانی. لطفاً دوباره تلاش کنید.");
      } finally {
        setReleasingOrderId(null);
      }
    },
    [loadOrders],
  );

  const mapOrderToProps = useCallback(
    (order: Order) =>
      mapOrderToDisplayProps(order, {
        imageBaseUrl: IMAGE_BASE_URL,
        placeholderImage: PLACEHOLDER_IMAGE,
        formatDate: formatOrderDate,
        formatTime: formatOrderTime,
        faNum,
        ordersLength: orders.length,
        handleReleaseReserve,
        persistOrderSnapshot,
        releasingOrderId,
        setSelectedOrder,
      }),
    [orders.length, handleReleaseReserve, releasingOrderId],
  );

  const rows = useMemo(() => orders.map(mapOrderToProps), [orders, mapOrderToProps]);

  if (!reserveGroupId) {
    return (
      <UserContainer className="flex flex-col gap-6 py-6 lg:py-10" dir="rtl">
        <p className="text-slate-600">شناسه گروه رزرو نامعتبر است.</p>
        <Link href="/orders" className="text-infinity-primary hover:underline">
          بازگشت به سفارش‌ها
        </Link>
      </UserContainer>
    );
  }

  return (
    <UserContainer className="flex flex-col gap-6 py-6 lg:py-10" dir="rtl">
      <StorefrontAccountShell contentClassName="flex flex-col gap-6">
          <nav className="flex items-center gap-2 text-sm text-slate-500">
            <Link href="/orders" className="hover:text-infinity-primary">
              سفارش‌ها
            </Link>
            <ChevronRight className="h-4 w-4 rotate-180" />
            <span className="text-slate-700">سفارش رزروی ({faNum(orders.length)} سفارش)</span>
          </nav>

          <div className="flex flex-col gap-2">
            <h1 className="text-2xl font-semibold text-foreground-primary lg:text-3xl">
              سفارش رزروی
            </h1>
            <p className="text-sm text-slate-500 lg:text-base">
              {orders.length > 0
                ? `${faNum(orders.length)} سفارش در این گروه. برای مشاهده جزئیات هر سفارش روی آن کلیک کنید.`
                : "سفارشی در این گروه یافت نشد."}
            </p>
          </div>

          {loading ? (
            <>
              <div className="lg:hidden">
                {Array.from({ length: 3 }).map((_, i) => (
                  <OrderCardSkeleton key={i} />
                ))}
              </div>
              <div className="hidden overflow-x-auto lg:flex">
                <table className="w-full">
                  <tbody className="divide-y divide-gray-100">
                    {Array.from({ length: 4 }).map((_, i) => (
                      <OrderRowSkeleton key={i} />
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          ) : rows.length === 0 ? (
            <div className="rounded-lg bg-gray-50 p-8 text-center">
              <p className="text-gray-600">سفارشی در این گروه یافت نشد.</p>
              <Link href="/orders" className="mt-4 inline-block text-infinity-primary hover:underline">
                بازگشت به لیست سفارش‌ها
              </Link>
            </div>
          ) : (
            <>
              <div className="lg:hidden">
                {rows.map((row) => {
                  const { rawOrder, isGroupRow, sortDate, ...rest } = row;
                  return <OrderCard key={row.id} {...rest} />;
                })}
              </div>
              <div className="hidden overflow-x-auto lg:flex">
                <table className="w-full">
                  <tbody className="divide-y divide-gray-100">
                    {rows.map((row) => {
                      const { rawOrder, isGroupRow, sortDate, ...rest } = row;
                      return <OrderRow key={row.id} {...rest} />;
                    })}
                  </tbody>
                </table>
              </div>
            </>
          )}
      </StorefrontAccountShell>

      <OrderDetailsDrawer
        isOpen={Boolean(selectedOrder)}
        order={selectedOrder}
        onClose={() => setSelectedOrder(null)}
      />
    </UserContainer>
  );
}
