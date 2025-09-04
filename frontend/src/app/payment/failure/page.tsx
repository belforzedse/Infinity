"use client";

import React, { useEffect, useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import PaymentStatus from "@/components/User/Orders/PaymentStatus";

function PaymentFailureContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const orderId = searchParams.get("orderId");
  const error = searchParams.get("error");

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Add a small delay to show loading state
    const timer = setTimeout(() => {
      setLoading(false);
    }, 500);

    return () => clearTimeout(timer);
  }, []);

  const handleRetryPayment = () => {
    if (orderId) {
      // Redirect to retry payment for this order
      router.push(`/orders/${orderId}/retry-payment`);
    } else {
      // Redirect back to cart
      router.push("/cart");
    }
  };

  const handleBackToCart = () => {
    router.push("/cart");
  };

  const handleContactSupport = () => {
    // You can implement a support page or contact modal
    router.push("/contact");
  };

  const handleContinueShopping = () => {
    router.push("/");
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-10">
        <div className="mx-auto max-w-2xl rounded-lg bg-white p-8 shadow-md">
          <div className="flex h-40 items-center justify-center">
            <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-t-2 border-red-500"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-10" dir="rtl">
      <div className="mx-auto max-w-2xl rounded-lg bg-white p-8 shadow-md">
        <div className="flex flex-col items-center text-center">
          {/* Error Icon */}
          <div className="mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-red-100">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-12 w-12 text-red-500"
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
          </div>

          {/* Error Message */}
          <h1 className="text-3xl mb-4 font-bold text-red-600">
            پرداخت ناموفق
          </h1>

          <p className="text-lg mb-6 text-gray-700">
            متاسفانه، پرداخت شما با مشکل مواجه شد و تکمیل نشده است.
          </p>

          {/* Error Details */}
          {error && (
            <div className="mb-6 w-full rounded-lg border border-red-200 bg-red-50 p-6">
              <h3 className="text-lg mb-3 font-semibold text-red-800">
                جزئیات خطا
              </h3>
              <p className="rounded bg-red-100 p-3 text-right text-red-700">
                {decodeURIComponent(error)}
              </p>
            </div>
          )}

          {/* Order Information */}
          {orderId && (
            <div className="mb-6 w-full rounded-lg border border-orange-200 bg-orange-50 p-6">
              <h3 className="text-lg mb-3 font-semibold text-orange-800">
                اطلاعات سفارش
              </h3>
              <div className="space-y-2 text-right">
                <p className="text-gray-700">
                  <span className="font-medium">شماره سفارش:</span>
                  <span className="mr-2 font-semibold text-orange-700">
                    #{orderId}
                  </span>
                </p>
                <p className="text-gray-700">
                  <span className="font-medium">وضعیت:</span>
                  <span className="mr-2 text-red-600">پرداخت ناموفق</span>
                </p>
                <p className="text-sm mt-2 text-orange-700">
                  سفارش شما تکمیل نشده است و می‌توانید مجدداً تلاش کنید.
                </p>
              </div>

              {orderId && <PaymentStatus orderId={parseInt(orderId)} />}
            </div>
          )}

          {/* Suggestions */}
          <div className="mb-6 w-full rounded-lg border border-blue-200 bg-blue-50 p-6">
            <h3 className="text-lg mb-3 font-semibold text-blue-800">
              راه‌حل‌های پیشنهادی
            </h3>
            <div className="text-sm space-y-2 text-right text-gray-700">
              <div className="flex items-start gap-2">
                <span className="mt-1 text-blue-500">•</span>
                <span>اطلاعات کارت خود را بررسی کرده و مجدداً تلاش کنید</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="mt-1 text-blue-500">•</span>
                <span>از وجود موجودی کافی در حساب خود اطمینان حاصل کنید</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="mt-1 text-blue-500">•</span>
                <span>در صورت تداوم مشکل، با بانک خود تماس بگیرید</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="mt-1 text-blue-500">•</span>
                <span>از کارت یا روش پرداخت دیگری استفاده کنید</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="mt-1 text-blue-500">•</span>
                <span>برای راهنمایی با پشتیبانی ما تماس بگیرید</span>
              </div>
            </div>
          </div>

          {/* Additional Info */}
          <div className="mb-6 w-full rounded-lg border border-gray-200 bg-gray-50 p-4">
            <div className="text-sm space-y-1 text-center text-gray-600">
              <p>🔒 اطلاعات شما کاملاً محفوظ است</p>
              <p>💳 هیچ مبلغی از حساب شما کسر نشده است</p>
              <p>🛍️ کالاهای سبد خرید شما محفوظ مانده‌اند</p>
              <p>📞 در صورت نیاز با پشتیبانی تماس بگیرید</p>
            </div>
          </div>

          {/* Action Button */}
          <div className="w-full max-w-md">
            <button
              onClick={handleContinueShopping}
              className="w-full rounded-lg bg-pink-500 px-6 py-3 text-center text-white transition-colors hover:bg-pink-600"
            >
              بازگشت به صفحه اصلی
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function PaymentFailure() {
  return (
    <Suspense
      fallback={
        <div className="container mx-auto px-4 py-10">
          <div className="mx-auto max-w-2xl rounded-lg bg-white p-8 shadow-md">
            <div className="flex h-40 items-center justify-center">
              <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-t-2 border-red-500"></div>
            </div>
          </div>
        </div>
      }
    >
      <PaymentFailureContent />
    </Suspense>
  );
}
