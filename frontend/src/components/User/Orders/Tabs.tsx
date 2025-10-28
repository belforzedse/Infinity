"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Tabs from "@/components/Kits/Tabs";
import { PersianOrderStatus } from "@/constants/enums";
import OrderRow from "./OrderRow";
import OrderCard from "./OrderCard";
import OrderCardSkeleton from "./OrderCardSkeleton";
import OrderRowSkeleton from "./OrderRowSkeleton";
import { ORDER_STATUS } from "../Constnats";
import type { Order } from "@/services/order";
import OrderService from "@/services/order";
import { faNum } from "@/utils/faNum";
import SearchIcon from "@/components/Icons/SearchIcon";
import RefreshIcon from "@/components/User/Icons/RefreshIcon";
import OrderDetailsDrawer from "./OrderDetailsDrawer";

export default function OrdersTabs() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pageCount, setPageCount] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const pageSize = 20; // Fetch more orders for tabs

  const fetchOrders = useCallback(async () => {
    try {
      setLoading(true);

      const response = await OrderService.getMyOrders(page, pageSize);
      setOrders(response.data);
      setPageCount(response.meta.pagination.pageCount);
    } catch (err: any) {
      console.error("Error fetching orders:", err);
    } finally {
      setLoading(false);
    }
  }, [page, pageSize]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
  };

  const clearSearch = () => setSearchTerm("");

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
      "همه سفارش‌ها": filtered, // All orders
      [PersianOrderStatus.INPROGRESS]: filtered.filter(
        (order) =>
          order.Status === "Started" ||
          order.Status === "Processing" ||
          order.Status === "Shipment",
      ),
      [PersianOrderStatus.DELIVERED]: filtered.filter((order) => order.Status === "Done"),
      [PersianOrderStatus.CANCELLED]: filtered.filter((order) => order.Status === "Cancelled"),
    };
  }, [orders, matchesSearch]);

  // Helper function to format date to Persian
  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat("fa-IR", {
      year: "numeric",
      month: "numeric",
      day: "numeric",
    }).format(date);
  };

  // Helper function to format time
  const formatTime = (dateString: string): string => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat("fa-IR", {
      hour: "2-digit",
      minute: "2-digit",
    }).format(date);
  };

  // Map API order to the component props format
  const mapOrderToProps = (order: Order) => {
    const firstItem = order.order_items[0];
    const image =
      firstItem?.product_variation?.product?.cover_image?.url ||
      "/images/placeholders/product-placeholder.png";
    const category =
      firstItem?.product_variation?.product?.Title ||
      firstItem?.product_variation?.product?.Title ||
      firstItem?.ProductTitle ||
      "محصول";

    const totalPrice =
      order.order_items.reduce((sum, item) => sum + item.Count * item.PerAmount, 0) +
      order.ShippingCost;

    let status = PersianOrderStatus.INPROGRESS;
    if (order.Status === "Done") {
      status = PersianOrderStatus.DELIVERED;
    } else if (order.Status === "Cancelled") {
      status = PersianOrderStatus.CANCELLED;
    }

    return {
      id: order.id.toString(),
      title: `سفارش شماره #${order.id}`,
      date: formatDate(order.createdAt),
      status,
      price: faNum(totalPrice),
      image,
      category,
      time: formatTime(order.createdAt),
      orderId: order.id,
      shippingBarcode: order.ShippingBarcode,
      rawOrder: order,
    };
  };

  const tabContent = ORDER_STATUS.map(({ value }) => {
    const statusOrders = ordersByStatus[value as keyof typeof ordersByStatus] || [];
    const mappedOrders = statusOrders.map(mapOrderToProps);

    return (
      <div key={value} className="w-full">
        {loading && mappedOrders.length === 0 ? (
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
        ) : mappedOrders.length === 0 ? (
          <div className="rounded-lg bg-gray-50 p-8 text-center">
            <p className="text-gray-600">سفارشی با این وضعیت یافت نشد.</p>
          </div>
        ) : (
          <>
            {mappedOrders.map(({ rawOrder, ...order }) => (
              <OrderCard key={order.id} {...order} onViewDetails={() => setSelectedOrder(rawOrder)} />
            ))}

            <div className="hidden overflow-x-auto lg:flex">
              <table className="w-full">
                <tbody className="divide-y divide-gray-100">
                  {mappedOrders.map(({ rawOrder, ...order }) => (
                    <OrderRow
                      key={order.id}
                      {...order}
                      onViewDetails={() => setSelectedOrder(rawOrder)}
                    />
                  ))}
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
            <SearchIcon className="h-4 w-4" />
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
              fetchOrders();
            }}
            className="flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-600 transition hover:border-pink-200 hover:text-pink-600"
          >
            <RefreshIcon className="h-4 w-4" />
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
