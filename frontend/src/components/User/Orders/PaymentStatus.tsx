"use client";

import React, { useEffect, useState } from "react";
import { OrderService } from "@/services";

interface PaymentStatusProps {
  orderId: number;
}

export default function PaymentStatus({ orderId }: PaymentStatusProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isPaid, setIsPaid] = useState<boolean | null>(null);
  const [orderStatus, setOrderStatus] = useState<string | null>(null);

  useEffect(() => {
    const checkPaymentStatus = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await OrderService.getOrderPaymentStatus(orderId);

        setIsPaid(response.isPaid);
        setOrderStatus(response.status);
      } catch (err: any) {
        console.error("Error checking payment status:", err);
        setError(err.message || "خطا در بررسی وضعیت پرداخت");
      } finally {
        setLoading(false);
      }
    };

    if (orderId) {
      checkPaymentStatus();
    }
  }, [orderId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-2">
        <div className="animate-spin w-5 h-5 border-2 border-pink-500 rounded-full border-t-transparent"></div>
        <span className="mr-2 text-sm text-gray-500">
          در حال بررسی وضعیت پرداخت...
        </span>
      </div>
    );
  }

  if (error) {
    return <div className="text-red-500 text-sm">{error}</div>;
  }

  return (
    <div className="mt-2">
      <div className="flex items-center">
        <span className="text-sm ml-2">وضعیت پرداخت:</span>
        {isPaid ? (
          <div className="flex items-center">
            <div className="bg-green-100 text-green-700 text-xs px-2 py-1 rounded-full flex items-center">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-3 w-3 ml-1"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
              پرداخت شده
            </div>
          </div>
        ) : (
          <div className="flex items-center">
            <div className="bg-orange-100 text-orange-700 text-xs px-2 py-1 rounded-full flex items-center">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-3 w-3 ml-1"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              در انتظار پرداخت
            </div>
          </div>
        )}
      </div>
      {orderStatus && (
        <div className="text-sm text-gray-600 mt-1">
          <span className="ml-1">وضعیت سفارش:</span>
          <span className="text-gray-800">
            {getStatusTranslation(orderStatus)}
          </span>
        </div>
      )}
    </div>
  );
}

// Helper function to translate status to Persian
function getStatusTranslation(status: string): string {
  const translations: Record<string, string> = {
    Started: "ثبت شده",
    Processing: "در حال پردازش",
    Shipment: "در حال ارسال",
    Done: "تکمیل شده",
    Cancelled: "لغو شده",
  };

  return translations[status] || status;
}
