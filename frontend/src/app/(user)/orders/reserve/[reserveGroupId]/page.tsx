"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import UserContainer from "@/components/layout/UserContainer";
import UserSidebar from "@/components/User/Sidebar";
import OrderRow from "@/components/User/Orders/OrderRow";
import OrderCard from "@/components/User/Orders/OrderCard";
import OrderCardSkeleton from "@/components/User/Orders/OrderCardSkeleton";
import OrderRowSkeleton from "@/components/User/Orders/OrderRowSkeleton";
import OrderDetailsDrawer from "@/components/User/Orders/OrderDetailsDrawer";
import OrderService from "@/services/order";
import type { Order } from "@/services/order";
import { PersianOrderStatus } from "@/constants/enums";
import { faNum } from "@/utils/faNum";
import { ChevronRight } from "lucide-react";
import toast from "react-hot-toast";

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

  const loadOrders = useCallback(async () => {
    if (!reserveGroupId) return;
    try {
      setLoading(true);
      const response = await OrderService.getMyOrders(1, 100, { reserveGroupId });
      setOrders(response.data);
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

  const formatDate = useCallback((dateString: string): string => {
    return new Intl.DateTimeFormat("fa-IR", {
      year: "numeric",
      month: "numeric",
      day: "numeric",
    }).format(new Date(dateString));
  }, []);

  const formatTime = useCallback((dateString: string): string => {
    return new Intl.DateTimeFormat("fa-IR", {
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(dateString));
  }, []);

  const imageBaseUrl = process.env.NEXT_PUBLIC_IMAGE_BASE_URL || "https://api.new.infinitycolor.co/";
  const placeholderImage =
    "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200'%3E%3Crect fill='%23f3f4f6' width='200' height='200'/%3E%3C/svg%3E";

  const persistOrderSnapshot = useCallback((order: Order) => {
    try {
      sessionStorage.setItem(`infinity:order-detail:${order.id}`, JSON.stringify(order));
    } catch {
      // ignore
    }
  }, []);

  const mapOrderToProps = useCallback(
    (order: Order) => {
      const firstItem = order.order_items?.[0];
      const product = firstItem?.product_variation?.product as
        | { cover_image?: { url?: string }; CoverImage?: { url?: string } }
        | null
        | undefined;
      const coverImage = product?.cover_image ?? product?.CoverImage;
      const image = coverImage?.url ? `${imageBaseUrl}${coverImage.url}` : placeholderImage;
      const category =
        firstItem?.product_variation?.product?.Title ||
        firstItem?.ProductTitle ||
        "محصول";
      const totalPrice =
        (order.order_items?.reduce((sum, item) => sum + item.Count * item.PerAmount, 0) ?? 0) +
        (order.ShippingCost ?? 0);

      let status = PersianOrderStatus.INPROGRESS;
      if (
        order.Status === "Done" ||
        order.Status === "DELIVERED" ||
        order.Status === "تحویل داده شده"
      )
        status = PersianOrderStatus.DELIVERED;
      else if (
        order.Status === "Cancelled" ||
        order.Status === "CANCELLED" ||
        order.Status === "لغو شده"
      )
        status = PersianOrderStatus.CANCELLED;

      return {
        id: order.id.toString(),
        title: `سفارش شماره #${order.id}`,
        date: formatDate(order.createdAt),
        time: formatTime(order.createdAt),
        price: faNum(totalPrice),
        status,
        image,
        category,
        orderId: order.id,
        shippingBarcode: order.ShippingBarcode,
        detailHref: `/orders/${order.id}`,
        isReserveOrder: order.IsReserveOrder,
        reserveExpiresAt: order.ReserveExpiresAt,
        reserveGroupOrderCount: orders.length,
        onReleaseReserve: handleReleaseReserve,
        isReleasingReserve: releasingOrderId === order.id,
        onViewDetails: () => setSelectedOrder(order),
        onOpenFullDetails: () => persistOrderSnapshot(order),
      };
    },
    [
      formatDate,
      formatTime,
      orders.length,
      persistOrderSnapshot,
      handleReleaseReserve,
      releasingOrderId,
    ],
  );

  const rows = useMemo(() => orders.map(mapOrderToProps), [orders, mapOrderToProps]);

  if (!reserveGroupId) {
    return (
      <UserContainer className="flex flex-col gap-6 py-6 lg:py-10" dir="rtl">
        <p className="text-slate-600">شناسه گروه رزرو نامعتبر است.</p>
        <Link href="/orders" className="text-pink-600 hover:underline">
          بازگشت به سفارش‌ها
        </Link>
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
          <nav className="flex items-center gap-2 text-sm text-slate-500">
            <Link href="/orders" className="hover:text-pink-600">
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
              <Link href="/orders" className="mt-4 inline-block text-pink-600 hover:underline">
                بازگشت به لیست سفارش‌ها
              </Link>
            </div>
          ) : (
            <>
              <div className="lg:hidden">
                {rows.map((props) => (
                  <OrderCard
                    key={props.id}
                    {...props}
                    onViewDetails={props.onViewDetails}
                    onOpenFullDetails={props.onOpenFullDetails}
                  />
                ))}
              </div>
              <div className="hidden overflow-x-auto lg:flex">
                <table className="w-full">
                  <tbody className="divide-y divide-gray-100">
                    {rows.map((props) => (
                      <OrderRow
                        key={props.id}
                        {...props}
                        onViewDetails={props.onViewDetails}
                        onOpenFullDetails={props.onOpenFullDetails}
                      />
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </main>
      </div>

      <OrderDetailsDrawer
        isOpen={Boolean(selectedOrder)}
        order={selectedOrder}
        onClose={() => setSelectedOrder(null)}
      />
    </UserContainer>
  );
}
