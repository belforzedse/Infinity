"use client";

import React, { useState } from "react";
import { OrderService } from "@/services";

interface PaymentStatusButtonProps {
  orderId: number;
  className?: string;
}

export default function PaymentStatusButton({
  orderId,
  className = "",
}: PaymentStatusButtonProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [statusData, setStatusData] = useState<{
    isPaid: boolean;
    status: string;
  } | null>(null);
  const [isOpen, setIsOpen] = useState(false);

  const checkStatus = async () => {
    try {
      setLoading(true);
      setError(null);
      setIsOpen(true);

      const response = await OrderService.getOrderPaymentStatus(orderId);
      setStatusData({
        isPaid: response.isPaid,
        status: response.status,
      });
    } catch (err: any) {
      console.error("Error checking payment status:", err);
      setError(err.message || "خطا در بررسی وضعیت پرداخت");
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

  return (
    <div className="relative">
      <button
        onClick={checkStatus}
        disabled={loading}
        className={`text-sm px-3 py-1 bg-pink-50 text-pink-700 rounded-lg hover:bg-pink-100 transition-colors ${
          loading ? "opacity-70 cursor-wait" : ""
        } ${className}`}
      >
        {loading ? "در حال بررسی..." : "بررسی وضعیت پرداخت"}
      </button>

      {isOpen && (statusData || error) && (
        <div className="absolute left-0 top-full mt-2 bg-white shadow-lg rounded-md border border-gray-200 p-3 z-10 min-w-64">
          <div className="flex justify-between items-center mb-2 pb-2 border-b border-gray-100">
            <h3 className="font-semibold text-sm">وضعیت سفارش</h3>
            <button
              onClick={() => setIsOpen(false)}
              className="text-gray-400 hover:text-gray-600"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>

          {error ? (
            <div className="text-red-500 text-sm">{error}</div>
          ) : (
            statusData && (
              <div className="text-sm">
                <div className="mb-2">
                  <span className="text-gray-600 ml-1">وضعیت سفارش:</span>
                  <span>{getStatusTranslation(statusData.status)}</span>
                </div>
                <div className="flex items-center">
                  <span className="text-gray-600 ml-2">وضعیت پرداخت:</span>
                  {statusData.isPaid ? (
                    <span className="bg-green-100 text-green-700 text-xs px-2 py-1 rounded-full flex items-center">
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
                    </span>
                  ) : (
                    <span className="bg-orange-100 text-orange-700 text-xs px-2 py-1 rounded-full flex items-center">
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
                    </span>
                  )}
                </div>
              </div>
            )
          )}
        </div>
      )}
    </div>
  );
}
