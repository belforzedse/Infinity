"use client";

import { useEffect, useState } from "react";
import Tabs from "@/components/Kits/Tabs";
import { PersianOrderStatus } from "@/constants/enums";
import OrderRow from "./OrderRow";
import OrderCard from "./OrderCard";
import { ORDER_STATUS } from "../Constnats";
import OrderService, { Order } from "@/services/order";
import PaymentStatusButton from "./PaymentStatusButton";

export default function OrdersTabs() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [pageCount, setPageCount] = useState(1);
  const pageSize = 20; // Fetch more orders for tabs

  useEffect(() => {
    fetchOrders();
  }, [page]);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await OrderService.getMyOrders(page, pageSize);
      setOrders(response.data);
      setPageCount(response.meta.pagination.pageCount);
    } catch (err: any) {
      console.error("Error fetching orders:", err);
      setError(err.message || "خطا در دریافت سفارش‌ها");
    } finally {
      setLoading(false);
    }
  };

  // Group orders by status
  const ordersByStatus = {
    "همه سفارش‌ها": orders, // All orders
    [PersianOrderStatus.INPROGRESS]: orders.filter(
      (order) =>
        order.Status === "Started" ||
        order.Status === "Processing" ||
        order.Status === "Shipment"
    ),
    [PersianOrderStatus.DELIVERED]: orders.filter(
      (order) => order.Status === "Done"
    ),
    [PersianOrderStatus.CANCELLED]: orders.filter(
      (order) => order.Status === "Cancelled"
    ),
  };

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
    // Get the first item's image or use default
    const firstItem = order.order_items[0];
    const image =
      firstItem?.product_variation?.product?.cover_image?.url ||
      "/images/placeholders/product-placeholder.png";
    const category = firstItem?.product_variation?.product?.Title || "محصول";

    // Calculate total price
    const totalPrice =
      order.order_items.reduce(
        (sum, item) => sum + item.Count * item.PerAmount,
        0
      ) + order.ShippingCost;

    // Map status
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
      price: totalPrice.toLocaleString(),
      image,
      category,
      time: formatTime(order.createdAt),
      orderId: order.id,
      shippingBarcode: (order as any).ShippingBarcode,
    };
  };

  const tabContent = ORDER_STATUS.map(({ value }) => {
    const statusOrders =
      ordersByStatus[value as keyof typeof ordersByStatus] || [];
    const mappedOrders = statusOrders.map(mapOrderToProps);

    return (
      <div key={value} className="w-full">
        {loading && mappedOrders.length === 0 ? (
          <div className="flex justify-center p-8">
            <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-pink-500"></div>
          </div>
        ) : mappedOrders.length === 0 ? (
          <div className="bg-gray-50 rounded-lg p-8 text-center">
            <p className="text-gray-600">سفارشی با این وضعیت یافت نشد.</p>
          </div>
        ) : (
          <>
            {mappedOrders.map((order) => (
              <OrderCard key={order.id} {...order} />
            ))}

            <div className="overflow-x-auto lg:flex hidden">
              <table className="w-full">
                <tbody className="divide-y divide-gray-100">
                  {mappedOrders.map((order) => (
                    <OrderRow key={order.id} {...order} />
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}

        {pageCount > 1 && (
          <div className="flex justify-center mt-4">
            <div className="flex items-center gap-2">
              {page > 1 && (
                <button
                  onClick={() => setPage(page - 1)}
                  className="px-3 py-1 border border-gray-300 rounded-md hover:bg-gray-50 text-sm"
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
                  className="px-3 py-1 border border-gray-300 rounded-md hover:bg-gray-50 text-sm"
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

  return <Tabs tabs={ORDER_STATUS} children={tabContent} />;
}
