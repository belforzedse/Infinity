"use client";

import React, { useEffect, useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import PaymentStatus from "@/components/User/Orders/PaymentStatus";

function PaymentCancelledContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const orderId = searchParams.get("orderId");
  const reason = searchParams.get("reason");
  
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Add a small delay to show loading state
    const timer = setTimeout(() => {
      setLoading(false);
    }, 500);

    return () => clearTimeout(timer);
  }, []);

  const handleCompletePayment = () => {
    if (orderId) {
      // Redirect to retry payment for this order
      router.push(`/orders/${orderId}/retry-payment`);
    } else {
      // Redirect back to cart
      router.push("/cart");
    }
  };

  const handleContinueShopping = () => {
    router.push("/");
  };

  const handleViewCart = () => {
    router.push("/cart");
  };

  const handleViewOrders = () => {
    router.push("/orders");
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-10">
        <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-md p-8">
          <div className="flex justify-center items-center h-40">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-orange-500"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-10" dir="rtl">
      <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-md p-8">
        <div className="flex flex-col items-center text-center">
          {/* Cancelled Icon */}
          <div className="w-24 h-24 rounded-full bg-orange-100 flex items-center justify-center mb-6">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-12 w-12 text-orange-500"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>

          {/* Cancellation Message */}
          <h1 className="text-3xl font-bold text-orange-600 mb-4">
            پرداخت لغو شد
          </h1>

          <p className="text-gray-700 mb-6 text-lg">
            شما فرآیند پرداخت را لغو کردید.
          </p>

          {/* Reassurance Section */}
          <div className="bg-green-50 border border-green-200 rounded-lg p-6 mb-6 w-full">
            <h3 className="text-lg font-semibold text-green-800 mb-3">
              اطمینان خاطر
            </h3>
            <div className="space-y-2 text-right text-green-700">
              <div className="flex items-center gap-2">
                <span className="text-green-500">✅</span>
                <span>هیچ مبلغی از حساب شما کسر نشده است</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-green-500">✅</span>
                <span>کالاهای سبد خرید شما محفوظ باقی مانده‌اند</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-green-500">✅</span>
                <span>می‌توانید هر زمان که بخواهید پرداخت را تکمیل کنید</span>
              </div>
            </div>
          </div>

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
                  <span className="mr-2 text-orange-600">در انتظار پرداخت</span>
                </p>
                <p className="text-orange-700 text-sm mt-2">
                  سفارش شما تکمیل نشده است. می‌توانید هر زمان که بخواهید پرداخت را انجام دهید.
                </p>
              </div>
              
              {orderId && <PaymentStatus orderId={parseInt(orderId)} />}
            </div>
          )}

          {/* Cancellation Reason */}
          {reason && (
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 mb-6 w-full">
              <h3 className="text-lg font-semibold text-gray-800 mb-3">
                دلیل لغو
              </h3>
              <p className="text-gray-700 text-right">
                {reason === "user-cancelled" 
                  ? "لغو توسط کاربر" 
                  : decodeURIComponent(reason)
                }
              </p>
            </div>
          )}

          {/* Next Steps */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6 w-full">
            <h3 className="text-lg font-semibold text-blue-800 mb-3">
              گزینه‌های پیش رو
            </h3>
            <div className="text-right space-y-2 text-gray-700 text-sm">
              <div className="flex items-start gap-2">
                <span className="text-blue-500 mt-1">•</span>
                <span>می‌توانید مجدداً پرداخت را انجام دهید</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-blue-500 mt-1">•</span>
                <span>سبد خرید خود را بررسی و ویرایش کنید</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-blue-500 mt-1">•</span>
                <span>محصولات جدید را مشاهده کنید</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-blue-500 mt-1">•</span>
                <span>در صورت نیاز با پشتیبانی تماس بگیرید</span>
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

export default function PaymentCancelled() {
  return (
    <Suspense fallback={
      <div className="container mx-auto px-4 py-10">
        <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-md p-8">
          <div className="flex justify-center items-center h-40">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-orange-500"></div>
          </div>
        </div>
      </div>
    }>
      <PaymentCancelledContent />
    </Suspense>
  );
} 