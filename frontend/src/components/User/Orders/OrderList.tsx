"use client";

import React, { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import imageLoader from "@/utils/imageLoader";
import Link from "next/link";
import type { Order, OrderItem } from "@/services/order";
import OrderService from "@/services/order";
import PaymentStatusButton from "./PaymentStatusButton";
import { faNum } from "@/utils/faNum";

interface OrderListProps {
  className?: string;
}

export default function OrderList({ className = "" }: OrderListProps) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [pageCount, setPageCount] = useState(1);
  // removed unused state: total
  const pageSize = 10;

  const fetchOrders = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await OrderService.getMyOrders(page, pageSize);
      setOrders(response.data);
      setPageCount(response.meta.pagination.pageCount);
      // removed unused: response.meta.pagination.total
    } catch (err: any) {
      console.error("Error fetching orders:", err);
      setError(err.message || "خطا در دریافت سفارش‌ها");
    } finally {
      setLoading(false);
    }
  }, [page, pageSize]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

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
      <div key={item.id} className="flex items-center border-b border-gray-100 py-2 last:border-0">
        <div className="relative h-16 w-16 overflow-hidden rounded-md">
          {item.product_variation.product.cover_image ? (
            <Image
              src={item.product_variation.product.cover_image.url}
              alt={item.ProductTitle}
              fill
              className="object-cover"
              sizes="64px"
              loader={imageLoader}
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-gray-200">
              <span className="text-xs text-gray-500">بدون تصویر</span>
            </div>
          )}
        </div>
        <div className="mr-3 flex-grow">
          <h4 className="text-sm font-medium">{item.ProductTitle}</h4>
          <div className="text-xs mt-1 flex flex-wrap gap-x-3 text-gray-600">
            {item.product_variation.product_color && (
              <span>رنگ: {item.product_variation.product_color.Title}</span>
            )}
            {item.product_variation.product_size && (
              <span>سایز: {item.product_variation.product_size.Title}</span>
            )}
            {item.product_variation.product_variation_model && (
              <span>مدل: {item.product_variation.product_variation_model.Title}</span>
            )}
          </div>
        </div>
        <div className="flex flex-col items-end text-left">
          <span className="text-sm">
            {item.Count} × {faNum(item.PerAmount)} تومان
          </span>
          <span className="text-sm mt-1 font-semibold">
            {faNum(item.Count * item.PerAmount)} تومان
          </span>
        </div>
      </div>
    ));
  };

  const renderOrders = () => {
    if (orders.length === 0) {
      return (
        <div className="rounded-lg bg-gray-50 p-8 text-center">
          <p className="text-gray-600">شما هنوز سفارشی ثبت نکرده‌اید.</p>
          <Link href="/" className="mt-4 inline-block rounded-lg bg-pink-500 px-4 py-2 text-white">
            مشاهده محصولات
          </Link>
        </div>
      );
    }

    return orders.map((order) => (
      <div
        key={order.id}
        className="mb-6 overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm"
      >
        <div className="flex items-center justify-between border-b border-gray-200 bg-gray-50 p-4">
          <div>
            <h3 className="text-lg font-medium">سفارش #{order.id}</h3>
            <p className="text-sm text-gray-600">{formatDate(order.createdAt)}</p>
          </div>
          <div className="flex flex-col items-end">
            <span className="text-xs mb-2 inline-flex items-center rounded-full bg-blue-50 px-2 py-1 text-blue-700">
              {getStatusTranslation(order.Status)}
            </span>
            <PaymentStatusButton orderId={order.id} />
          </div>
        </div>

        <div className="p-4">
          <div className="mb-4">{renderOrderItems(order.order_items)}</div>

          <div className="mt-4 border-t border-gray-200 pt-4">
            <div className="text-sm mb-2 flex justify-between">
              <span>روش ارسال:</span>
              <span>{order.shipping.Title}</span>
            </div>
            <div className="text-sm mb-2 flex justify-between">
              <span>هزینه ارسال:</span>
              <span>{faNum(order.ShippingCost)} تومان</span>
            </div>
            {order.Note && (
              <div className="text-sm mb-2 flex justify-between">
                <span>یادداشت:</span>
                <span>{order.Note}</span>
              </div>
            )}
            <div className="mt-3 flex justify-between border-t border-gray-100 pt-3 font-semibold">
              <span>مجموع:</span>
              <span className="text-pink-600">
                {order.order_items.reduce((sum, item) => sum + item.Count * item.PerAmount, 0) +
                  order.ShippingCost}{" "}
                {/* prices formatted above with faNum */}
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
      <div className="mt-6 flex justify-center">
        <div className="flex items-center gap-2">
          {page > 1 && (
            <button
              onClick={() => setPage(page - 1)}
              className="rounded-md border border-gray-300 px-3 py-1 hover:bg-gray-50"
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
                className={`flex h-8 w-8 items-center justify-center rounded-md ${
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
              className="rounded-md border border-gray-300 px-3 py-1 hover:bg-gray-50"
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
        <div className="h-10 w-10 animate-spin rounded-full border-b-2 border-t-2 border-pink-500"></div>
      </div>
    );
  }

  if (error && orders.length === 0) {
    return (
      <div className={`${className} rounded-lg bg-red-50 p-4 text-red-600`}>
        <p>{error}</p>
        <button
          onClick={fetchOrders}
          className="text-sm mt-3 rounded-lg bg-red-100 px-3 py-1 hover:bg-red-200"
        >
          تلاش مجدد
        </button>
      </div>
    );
  }

  return (
    <div className={className}>
      <h2 className="text-xl mb-6 font-semibold">سفارش‌های من</h2>

      {loading && (
        <div className="mb-4 flex items-center">
          <div className="ml-2 h-4 w-4 animate-spin rounded-full border-b-2 border-t-2 border-pink-500"></div>
          <span className="text-sm text-gray-600">در حال بروزرسانی...</span>
        </div>
      )}

      {renderOrders()}
      {renderPagination()}
    </div>
  );
}
