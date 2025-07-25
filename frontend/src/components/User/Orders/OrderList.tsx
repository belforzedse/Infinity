"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import OrderService, { Order, OrderItem } from "@/services/order";
import PaymentStatusButton from "./PaymentStatusButton";

interface OrderListProps {
  className?: string;
}

export default function OrderList({ className = "" }: OrderListProps) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [pageCount, setPageCount] = useState(1);
  const [total, setTotal] = useState(0);
  const pageSize = 10;

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
      setTotal(response.meta.pagination.total);
    } catch (err: any) {
      console.error("Error fetching orders:", err);
      setError(err.message || "خطا در دریافت سفارش‌ها");
    } finally {
      setLoading(false);
    }
  };

  const getStatusTranslation = (status: string): string => {
    const translations: Record<string, string> = {
      Started: "ثبت شده",
      Processing: "در حال پردازش",
      Shipment: "در حال ارسال",
      Done: "تکمیل شده",
      Cancelled: "لغو شده",
    };

    return translations[status] || status;
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat("fa-IR", {
      year: "numeric",
      month: "long",
      day: "numeric",
    }).format(date);
  };

  const renderOrderItems = (items: OrderItem[]) => {
    return items.map((item) => (
      <div
        key={item.id}
        className="flex items-center py-2 border-b border-gray-100 last:border-0"
      >
        <div className="relative w-16 h-16 overflow-hidden rounded-md">
          {item.product_variation.product.cover_image ? (
            <Image
              src={item.product_variation.product.cover_image.url}
              alt={item.ProductTitle}
              fill
              className="object-cover"
            />
          ) : (
            <div className="w-full h-full bg-gray-200 flex items-center justify-center">
              <span className="text-xs text-gray-500">بدون تصویر</span>
            </div>
          )}
        </div>
        <div className="mr-3 flex-grow">
          <h4 className="text-sm font-medium">{item.ProductTitle}</h4>
          <div className="flex flex-wrap gap-x-3 mt-1 text-xs text-gray-600">
            {item.product_variation.product_color && (
              <span>رنگ: {item.product_variation.product_color.Title}</span>
            )}
            {item.product_variation.product_size && (
              <span>سایز: {item.product_variation.product_size.Title}</span>
            )}
            {item.product_variation.product_variation_model && (
              <span>
                مدل: {item.product_variation.product_variation_model.Title}
              </span>
            )}
          </div>
        </div>
        <div className="text-left flex flex-col items-end">
          <span className="text-sm">
            {item.Count} × {item.PerAmount.toLocaleString()} تومان
          </span>
          <span className="text-sm font-semibold mt-1">
            {(item.Count * item.PerAmount).toLocaleString()} تومان
          </span>
        </div>
      </div>
    ));
  };

  const renderOrders = () => {
    if (orders.length === 0) {
      return (
        <div className="bg-gray-50 rounded-lg p-8 text-center">
          <p className="text-gray-600">شما هنوز سفارشی ثبت نکرده‌اید.</p>
          <Link
            href="/"
            className="mt-4 inline-block bg-pink-500 text-white px-4 py-2 rounded-lg"
          >
            مشاهده محصولات
          </Link>
        </div>
      );
    }

    return orders.map((order) => (
      <div
        key={order.id}
        className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden mb-6"
      >
        <div className="bg-gray-50 p-4 flex justify-between items-center border-b border-gray-200">
          <div>
            <h3 className="text-lg font-medium">سفارش #{order.id}</h3>
            <p className="text-sm text-gray-600">
              {formatDate(order.createdAt)}
            </p>
          </div>
          <div className="flex flex-col items-end">
            <span className="inline-flex items-center bg-blue-50 text-blue-700 text-xs px-2 py-1 rounded-full mb-2">
              {getStatusTranslation(order.Status)}
            </span>
            <PaymentStatusButton orderId={order.id} />
          </div>
        </div>

        <div className="p-4">
          <div className="mb-4">{renderOrderItems(order.order_items)}</div>

          <div className="border-t border-gray-200 pt-4 mt-4">
            <div className="flex justify-between text-sm mb-2">
              <span>روش ارسال:</span>
              <span>{order.shipping.Title}</span>
            </div>
            <div className="flex justify-between text-sm mb-2">
              <span>هزینه ارسال:</span>
              <span>{order.ShippingCost.toLocaleString()} تومان</span>
            </div>
            {order.Note && (
              <div className="flex justify-between text-sm mb-2">
                <span>یادداشت:</span>
                <span>{order.Note}</span>
              </div>
            )}
            <div className="flex justify-between font-semibold mt-3 pt-3 border-t border-gray-100">
              <span>مجموع:</span>
              <span className="text-pink-600">
                {(
                  order.order_items.reduce(
                    (sum, item) => sum + item.Count * item.PerAmount,
                    0
                  ) + order.ShippingCost
                ).toLocaleString()}{" "}
                تومان
              </span>
            </div>
          </div>
        </div>
      </div>
    ));
  };

  const renderPagination = () => {
    if (pageCount <= 1) return null;

    return (
      <div className="flex justify-center mt-6">
        <div className="flex items-center gap-2">
          {page > 1 && (
            <button
              onClick={() => setPage(page - 1)}
              className="px-3 py-1 border border-gray-300 rounded-md hover:bg-gray-50"
            >
              قبلی
            </button>
          )}

          {Array.from({ length: Math.min(5, pageCount) }, (_, i) => {
            // Show current page, two pages before and two pages after
            let pageNum;
            if (pageCount <= 5) {
              // If we have 5 or fewer pages, show all
              pageNum = i + 1;
            } else {
              // Otherwise, show a window centered on the current page
              const start = Math.max(1, Math.min(page - 2, pageCount - 4));
              pageNum = start + i;
            }

            return (
              <button
                key={pageNum}
                onClick={() => setPage(pageNum)}
                className={`w-8 h-8 flex items-center justify-center rounded-md ${
                  page === pageNum
                    ? "bg-pink-500 text-white"
                    : "border border-gray-300 hover:bg-gray-50"
                }`}
              >
                {pageNum}
              </button>
            );
          })}

          {page < pageCount && (
            <button
              onClick={() => setPage(page + 1)}
              className="px-3 py-1 border border-gray-300 rounded-md hover:bg-gray-50"
            >
              بعدی
            </button>
          )}
        </div>
      </div>
    );
  };

  if (loading && orders.length === 0) {
    return (
      <div className={`${className} flex justify-center p-8`}>
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-pink-500"></div>
      </div>
    );
  }

  if (error && orders.length === 0) {
    return (
      <div className={`${className} bg-red-50 p-4 rounded-lg text-red-600`}>
        <p>{error}</p>
        <button
          onClick={fetchOrders}
          className="mt-3 text-sm bg-red-100 px-3 py-1 rounded-lg hover:bg-red-200"
        >
          تلاش مجدد
        </button>
      </div>
    );
  }

  return (
    <div className={className}>
      <h2 className="text-xl font-semibold mb-6">سفارش‌های من</h2>

      {loading && (
        <div className="mb-4 flex items-center">
          <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-pink-500 ml-2"></div>
          <span className="text-sm text-gray-600">در حال بروزرسانی...</span>
        </div>
      )}

      {renderOrders()}
      {renderPagination()}
    </div>
  );
}
