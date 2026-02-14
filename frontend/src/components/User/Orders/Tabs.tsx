"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Tabs from "@/components/Kits/Tabs";
import { PersianOrderStatus } from "@/constants/enums";
import { getOrderStatusCategory } from "@/utils/statusTranslations";
import { IMAGE_BASE_URL, PLACEHOLDER_IMAGE } from "@/utils/orderDisplayConstants";
import {
  formatOrderDate,
  formatOrderTime,
  mapOrderToDisplayProps,
  persistOrderSnapshot as persistOrderSnapshotHelper,
} from "@/utils/orderDisplayHelpers";
import OrderRow from "./OrderRow";
import OrderCard from "./OrderCard";
import OrderCardSkeleton from "./OrderCardSkeleton";
import OrderRowSkeleton from "./OrderRowSkeleton";
import { ORDER_STATUS } from "../Constnats";
import type { Order } from "@/services/order";
import OrderService from "@/services/order";
import { faNum } from "@/utils/faNum";
import { Search, RefreshCcw } from "lucide-react";
import toast from "react-hot-toast";
import OrderDetailsDrawer from "./OrderDetailsDrawer";

type OrderRowProps = {
  id: string;
  title: string;
  date: string;
  time: string;
  price: string;
  status: PersianOrderStatus;
  image: string;
  category: string;
  orderId?: number;
  shippingBarcode?: string;
  detailHref: string;
  onViewDetails: () => void;
  onOpenFullDetails?: () => void;
  isReserveOrder?: boolean;
  reserveExpiresAt?: string | null;
  reserveGroupOrderCount?: number;
  onReleaseReserve?: (orderId: number) => void;
  isReleasingReserve?: boolean;
  rawOrder?: Order | null;
  isGroupRow?: boolean;
  sortDate?: string;
};

export default function OrdersTabs() {
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pageCount, setPageCount] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [releasingOrderId, setReleasingOrderId] = useState<number | null>(null);
  const pageSize = 20; // Fetch more orders for tabs

  const loadOrders = useCallback(async (targetPage: number) => {
    try {
      setLoading(true);

      const response = await OrderService.getMyOrders(targetPage, pageSize);
      setOrders(response.data);
      setPageCount(response.meta.pagination.pageCount);
    } catch (err: any) {
      console.error("Error fetching orders:", err);
    } finally {
      setLoading(false);
    }
  }, [pageSize]);

  useEffect(() => {
    loadOrders(page);
  }, [loadOrders, page]);

  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
  };

  const clearSearch = () => setSearchTerm("");

  const handleReleaseReserve = useCallback(
    async (orderId: number) => {
      try {
        setReleasingOrderId(orderId);
        await OrderService.releaseReserve(orderId);
        toast.success("سفارش شما برای ارسال آماده شد");
        await loadOrders(page);
      } catch (err: unknown) {
        console.error("Failed to release reserve:", err);
        toast.error("خطا در به‌روزرسانی. لطفاً دوباره تلاش کنید.");
      } finally {
        setReleasingOrderId(null);
      }
    },
    [loadOrders, page],
  );

  const matchesSearch = useCallback(
    (order: Order) => {
      const term = searchTerm.trim();
      if (!term) return true;

      const normalisedTerm = term.toLowerCase();
      const idMatch = order.id.toString().includes(normalisedTerm);

      const productMatch = order.order_items.some((item) => {
        const title = item.ProductTitle || item.product_variation?.product?.Title || "";
        return title.toLowerCase().includes(normalisedTerm);
      });

      return idMatch || productMatch;
    },
    [searchTerm],
  );

  // Group orders by status
  const ordersByStatus = useMemo(() => {
    const filtered = orders.filter(matchesSearch);
    return {
      "همه سفارش‌ها": filtered,
      [PersianOrderStatus.INPROGRESS]: filtered.filter(
        (order) =>
          order.Status === "Paying" ||
          order.Status === "Started" ||
          order.Status === "Processing" ||
          order.Status === "Shipment" ||
          order.Status === "PROCESSING" ||
          order.Status === "SHIPPED" ||
          order.Status === "جاری",
      ),
      [PersianOrderStatus.DELIVERED]: filtered.filter(
        (order) =>
          order.Status === "Done" ||
          order.Status === "DELIVERED" ||
          order.Status === "تحویل داده شده",
      ),
      [PersianOrderStatus.CANCELLED]: filtered.filter(
        (order) =>
          order.Status === "Cancelled" ||
          order.Status === "CANCELLED" ||
          order.Status === "لغو شده",
      ),
    };
  }, [orders, matchesSearch]);

  // Reserve groups: one row per reserveGroupId (orders that have reserveGroupId)
  const reserveGroupMap = useMemo(() => {
    const map = new Map<string, Order[]>();
    for (const order of orders) {
      const gid = order.reserveGroupId;
      if (gid) {
        const list = map.get(gid) ?? [];
        list.push(order);
        map.set(gid, list);
      }
    }
    // Sort orders within each group by date desc
    map.forEach((list) => {
      list.sort((a, b) => new Date(b.Date).getTime() - new Date(a.Date).getTime());
    });
    return map;
  }, [orders]);

  const mapReserveGroupToProps = useCallback(
    (reserveGroupId: string, groupOrders: Order[]): OrderRowProps => {
      const first = groupOrders[0];
      const firstItem = first?.order_items?.[0];
      const product = firstItem?.product_variation?.product as
        | { cover_image?: { url?: string }; CoverImage?: { url?: string } }
        | null
        | undefined;
      const coverImage = product?.cover_image ?? product?.CoverImage;
      const image = coverImage?.url ? `${IMAGE_BASE_URL}${coverImage.url}` : PLACEHOLDER_IMAGE;
      const totalPrice = groupOrders.reduce(
        (sum, o) =>
          sum +
          (o.order_items?.reduce((s, i) => s + i.Count * i.PerAmount, 0) ?? 0) +
          (o.ShippingCost ?? 0),
        0,
      );
      const statuses = groupOrders.map((o) => getOrderStatusCategory(o.Status));
      const status = statuses.some((s) => s === PersianOrderStatus.INPROGRESS)
        ? PersianOrderStatus.INPROGRESS
        : statuses.some((s) => s === PersianOrderStatus.DELIVERED)
          ? PersianOrderStatus.DELIVERED
          : PersianOrderStatus.CANCELLED;
      const groupDetailHref = `/orders/reserve/${reserveGroupId}`;
      return {
        id: `reserve-${reserveGroupId}`,
        title: `سفارش رزروی (${faNum(groupOrders.length)} سفارش)`,
        date: first ? formatOrderDate(first.createdAt) : "",
        time: first ? formatOrderTime(first.createdAt) : "",
        price: faNum(totalPrice),
        status,
        image,
        category: "سفارش رزروی",
        detailHref: groupDetailHref,
        onViewDetails: () => router.push(groupDetailHref),
        onOpenFullDetails: () => router.push(groupDetailHref),
        isReserveOrder: true,
        reserveExpiresAt: first?.reserveExpiresAt ?? null,
        reserveGroupOrderCount: groupOrders.length,
        rawOrder: null,
        isGroupRow: true,
        sortDate: first?.createdAt,
      };
    },
    [router],
  );

  const mapOrderToProps = useCallback(
    (order: Order, allOrders: Order[]) =>
      mapOrderToDisplayProps(order, {
        imageBaseUrl: IMAGE_BASE_URL,
        placeholderImage: PLACEHOLDER_IMAGE,
        formatDate: formatOrderDate,
        formatTime: formatOrderTime,
        faNum,
        ordersLength: 0,
        getReserveGroupCount: (o) =>
          o.reserveGroupId && o.isReserveOrder
            ? allOrders.filter(
                (a) => a.reserveGroupId === o.reserveGroupId && a.isReserveOrder,
              ).length
            : undefined,
        handleReleaseReserve,
        persistOrderSnapshot: persistOrderSnapshotHelper,
        releasingOrderId,
        setSelectedOrder,
      }),
    [handleReleaseReserve, releasingOrderId],
  );

  const tabContent = ORDER_STATUS.map(({ value }) => {
    const statusOrders = ordersByStatus[value as keyof typeof ordersByStatus] || [];
    const reserveGroupIdsInTab = new Set(
      statusOrders.filter((o) => o.reserveGroupId).map((o) => o.reserveGroupId as string),
    );
    const groupRows: OrderRowProps[] = Array.from(reserveGroupIdsInTab).map((gid) =>
      mapReserveGroupToProps(gid, reserveGroupMap.get(gid) ?? []),
    );
    const orderRows = statusOrders
      .filter((o) => !o.reserveGroupId)
      .map((o) => mapOrderToProps(o, orders));
    const combined = [...groupRows, ...orderRows].sort((a, b) => {
      const tA = new Date(a.sortDate ?? 0).getTime();
      const tB = new Date(b.sortDate ?? 0).getTime();
      return tB - tA;
    });

    return (
      <div key={value} className="w-full">
        {loading && combined.length === 0 ? (
          <>
            <div className="lg:hidden">
              {Array.from({ length: 3 }).map((_, i) => (
                <OrderCardSkeleton key={i} />
              ))}
            </div>
            <div className="hidden overflow-x-auto lg:flex">
              <table className="w-full">
                <tbody className="divide-y divide-gray-100">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <OrderRowSkeleton key={i} />
                  ))}
                </tbody>
              </table>
            </div>
          </>
        ) : combined.length === 0 ? (
          <div className="rounded-lg bg-gray-50 p-8 text-center">
            <p className="text-gray-600">سفارشی با این وضعیت یافت نشد.</p>
          </div>
        ) : (
          <>
            {combined.map((row) => {
              const { rawOrder, isGroupRow, sortDate, ...rest } = row;
              return <OrderCard key={row.id} {...rest} />;
            })}

            <div className="hidden overflow-x-auto lg:flex">
              <table className="w-full">
                <tbody className="divide-y divide-gray-100">
                  {combined.map((row) => {
                    const { rawOrder, isGroupRow, sortDate, ...rest } = row;
                    return <OrderRow key={row.id} {...rest} />;
                  })}
                </tbody>
              </table>
            </div>
          </>
        )}

        {pageCount > 1 && (
          <div className="mt-4 flex justify-center">
            <div className="flex items-center gap-2">
              {page > 1 && (
                <button
                  onClick={() => setPage(page - 1)}
                  className="text-sm rounded-md border border-gray-300 px-3 py-1 hover:bg-gray-50"
                >
                  قبلی
                </button>
              )}
              <span className="text-sm text-gray-600">
                صفحه {page} از {pageCount}
              </span>
              {page < pageCount && (
                <button
                  onClick={() => setPage(page + 1)}
                  className="text-sm rounded-md border border-gray-300 px-3 py-1 hover:bg-gray-50"
                >
                  بعدی
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    );
  });

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white/80 p-4 shadow-sm lg:flex-row lg:items-center lg:justify-between">
        <div className="relative w-full max-w-md">
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
            <Search className="h-4 w-4" />
          </span>
          <input
            value={searchTerm}
            onChange={(event) => handleSearchChange(event.target.value)}
            placeholder="جستجوی سفارش با شماره یا نام محصول"
            className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pr-4 text-sm text-right text-slate-700 outline-none transition focus:border-pink-400 focus:ring-2 focus:ring-pink-200"
          />
          {searchTerm ? (
            <button
              type="button"
              onClick={clearSearch}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-pink-500 hover:text-pink-600"
            >
              پاک کردن
            </button>
          ) : null}
        </div>

        <div className="flex items-center gap-3">
          <span className="text-xs text-slate-500 lg:text-sm">
            {searchTerm ? `نتیجه برای "${searchTerm}"` : `تعداد سفارش‌ها: ${faNum(orders.length)}`}
          </span>
          <button
            type="button"
            onClick={() => {
              setPage(1);
              loadOrders(1);
            }}
            className="flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-600 transition hover:border-pink-200 hover:text-pink-600"
          >
            <RefreshCcw className="h-4 w-4" />
            بروزرسانی
          </button>
        </div>
      </div>

      <Tabs tabs={ORDER_STATUS}>{tabContent}</Tabs>

      <OrderDetailsDrawer
        isOpen={Boolean(selectedOrder)}
        order={selectedOrder}
        onClose={() => setSelectedOrder(null)}
      />
    </div>
  );
}
