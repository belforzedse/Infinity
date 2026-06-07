"use client";

import React, { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import PaymentStatus from "@/components/User/Orders/PaymentStatus";
import { StorefrontContainer } from "@/components/storefront";

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

  const handleContinueShopping = () => {
    router.push("/");
  };

  if (loading) {
    return (
      <StorefrontContainer className="py-10">
        <div className="mx-auto max-w-2xl rounded-lg bg-white p-8 shadow-md">
          <div className="flex h-40 items-center justify-center">
            <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-t-2 border-orange-500"></div>
          </div>
        </div>
      </StorefrontContainer>
    );
  }

  return (
    <StorefrontContainer className="py-10" dir="rtl">
      <div className="mx-auto max-w-2xl rounded-lg bg-white p-8 shadow-md">
        <div className="flex flex-col items-center text-center">
          {/* Cancelled Icon */}
          <div className="mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-orange-100">
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
          <h1 className="text-3xl mb-4 font-bold text-orange-600">پرداخت لغو شد</h1>

          <p className="text-lg mb-6 text-gray-700">شما فرآیند پرداخت را لغو کردید.</p>

          {/* Reassurance Section */}
          <div className="mb-6 w-full rounded-lg border border-green-200 bg-green-50 p-6">
            <h3 className="text-lg mb-3 font-semibold text-green-800">اطمینان خاطر</h3>
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
            <div className="mb-6 w-full rounded-lg border border-orange-200 bg-orange-50 p-6">
              <h3 className="text-lg mb-3 font-semibold text-orange-800">اطلاعات سفارش</h3>
              <div className="space-y-2 text-right">
                <p className="text-gray-700">
                  <span className="font-medium">شماره سفارش:</span>
                  <span className="mr-2 font-semibold text-orange-700">#{orderId}</span>
                </p>
                <p className="text-gray-700">
                  <span className="font-medium">وضعیت:</span>
                  <span className="mr-2 text-orange-600">در انتظار پرداخت</span>
                </p>
                <p className="text-sm mt-2 text-orange-700">
                  سفارش شما تکمیل نشده است. می‌توانید هر زمان که بخواهید پرداخت را انجام دهید.
                </p>
              </div>

              {orderId && <PaymentStatus orderId={parseInt(orderId)} />}
            </div>
          )}

          {/* Cancellation Reason */}
          {reason && (
            <div className="mb-6 w-full rounded-lg border border-gray-200 bg-gray-50 p-6">
              <h3 className="text-lg mb-3 font-semibold text-gray-800">دلیل لغو</h3>
              <p className="text-right text-gray-700">
                {reason === "user-cancelled" ? "لغو توسط کاربر" : decodeURIComponent(reason)}
              </p>
            </div>
          )}

          {/* Next Steps */}
          <div className="mb-6 w-full rounded-lg border border-blue-200 bg-blue-50 p-6">
            <h3 className="text-lg mb-3 font-semibold text-blue-800">گزینه‌های پیش رو</h3>
            <div className="text-sm space-y-2 text-right text-gray-700">
              <div className="flex items-start gap-2">
                <span className="mt-1 text-blue-500">•</span>
                <span>می‌توانید مجدداً پرداخت را انجام دهید</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="mt-1 text-blue-500">•</span>
                <span>سبد خرید خود را بررسی و ویرایش کنید</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="mt-1 text-blue-500">•</span>
                <span>محصولات جدید را مشاهده کنید</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="mt-1 text-blue-500">•</span>
                <span>در صورت نیاز با پشتیبانی تماس بگیرید</span>
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
              className="w-full rounded-lg bg-infinity-primary px-6 py-3 text-center text-white transition-colors hover:bg-infinity-primary"
            >
              بازگشت به صفحه اصلی
            </button>
          </div>
        </div>
      </div>
    </StorefrontContainer>
  );
}

export default function PaymentCancelled() {
  return (
    <Suspense
      fallback={
        <StorefrontContainer className="py-10">
          <div className="mx-auto max-w-2xl rounded-lg bg-white p-8 shadow-md">
            <div className="flex h-40 items-center justify-center">
              <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-t-2 border-orange-500"></div>
            </div>
          </div>
        </StorefrontContainer>
      }
    >
      <PaymentCancelledContent />
    </Suspense>
  );
}
