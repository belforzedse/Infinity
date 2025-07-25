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
        <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-md p-8">
          <div className="flex justify-center items-center h-40">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-red-500"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-10" dir="rtl">
      <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-md p-8">
        <div className="flex flex-col items-center text-center">
          {/* Error Icon */}
          <div className="w-24 h-24 rounded-full bg-red-100 flex items-center justify-center mb-6">
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
          <h1 className="text-3xl font-bold text-red-600 mb-4">
            پرداخت ناموفق
          </h1>

          <p className="text-gray-700 mb-6 text-lg">
            متاسفانه، پرداخت شما با مشکل مواجه شد و تکمیل نشده است.
          </p>

          {/* Error Details */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-6 mb-6 w-full">
              <h3 className="text-lg font-semibold text-red-800 mb-3">
                جزئیات خطا
              </h3>
              <p className="text-red-700 text-right bg-red-100 p-3 rounded">
                {decodeURIComponent(error)}
              </p>
            </div>
          )}

          {/* Order Information */}
          {orderId && (
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-6 mb-6 w-full">
              <h3 className="text-lg font-semibold text-orange-800 mb-3">
                اطلاعات سفارش
              </h3>
              <div className="space-y-2 text-right">
                <p className="text-gray-700">
                  <span className="font-medium">شماره سفارش:</span>
                  <span className="mr-2 font-semibold text-orange-700">#{orderId}</span>
                </p>
                <p className="text-gray-700">
                  <span className="font-medium">وضعیت:</span>
                  <span className="mr-2 text-red-600">پرداخت ناموفق</span>
                </p>
                <p className="text-orange-700 text-sm mt-2">
                  سفارش شما تکمیل نشده است و می‌توانید مجدداً تلاش کنید.
                </p>
              </div>
              
              {orderId && <PaymentStatus orderId={parseInt(orderId)} />}
            </div>
          )}

          {/* Suggestions */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6 w-full">
            <h3 className="text-lg font-semibold text-blue-800 mb-3">
              راه‌حل‌های پیشنهادی
            </h3>
            <div className="text-right space-y-2 text-gray-700 text-sm">
              <div className="flex items-start gap-2">
                <span className="text-blue-500 mt-1">•</span>
                <span>اطلاعات کارت خود را بررسی کرده و مجدداً تلاش کنید</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-blue-500 mt-1">•</span>
                <span>از وجود موجودی کافی در حساب خود اطمینان حاصل کنید</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-blue-500 mt-1">•</span>
                <span>در صورت تداوم مشکل، با بانک خود تماس بگیرید</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-blue-500 mt-1">•</span>
                <span>از کارت یا روش پرداخت دیگری استفاده کنید</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-blue-500 mt-1">•</span>
                <span>برای راهنمایی با پشتیبانی ما تماس بگیرید</span>
              </div>
            </div>
          </div>

          {/* Additional Info */}
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-6 w-full">
            <div className="text-center space-y-1 text-gray-600 text-sm">
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
              className="w-full bg-pink-500 text-white py-3 px-6 rounded-lg text-center hover:bg-pink-600 transition-colors"
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
    <Suspense fallback={
      <div className="container mx-auto px-4 py-10">
        <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-md p-8">
          <div className="flex justify-center items-center h-40">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-red-500"></div>
          </div>
        </div>
      </div>
    }>
      <PaymentFailureContent />
    </Suspense>
  );
} 