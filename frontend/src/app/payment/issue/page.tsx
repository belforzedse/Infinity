"use client";

import React, { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import PaymentStatus from "@/components/User/Orders/PaymentStatus";
import { OrderService } from "@/services";
import { translateOrderStatus } from "@/utils/statusTranslations";

function PaymentIssueContent(): React.ReactElement {
  const router = useRouter();
  const searchParams = useSearchParams();
  const orderIdParam = searchParams.get("orderId");
  const code = searchParams.get("code");
  const [orderStatus, setOrderStatus] = useState<string | null>(null);
  const [statusLoading, setStatusLoading] = useState(false);

  // Parse and validate orderId
  const parsedOrderId = orderIdParam ? parseInt(orderIdParam, 10) : null;
  const isValidOrderId = parsedOrderId !== null && Number.isFinite(parsedOrderId);

  useEffect(() => {
    const controller = new AbortController();
    const fetchOrderStatus = async () => {
      if (!isValidOrderId || !parsedOrderId) return;

      try {
        setStatusLoading(true);
        const response = await OrderService.getOrderPaymentStatus(
          parsedOrderId,
          controller.signal
        );
        if (controller.signal.aborted) return;
        setOrderStatus(response.status);
      } catch (err) {
        if (controller.signal.aborted) return;
        console.error("Error fetching order status:", err);
        // Keep orderStatus as null to show fallback
      } finally {
        if (!controller.signal.aborted) {
          setStatusLoading(false);
        }
      }
    };

    fetchOrderStatus();
    return () => controller.abort();
  }, [orderIdParam]);

  const handleBackToCart = () => router.push("/cart");
  const handleContinueShopping = () => router.push("/");
  const handleContactSupport = () => router.push("/contact");

  const title = "مشکل در تکمیل سفارش";
  const message =
    code === "reservation_expired_reversed" || code === "reservation_invalid_reversed"
      ? "پرداخت شما به دلیل اتمام زمان رزرو کالا یا تغییر موجودی لغو شد."
      : "پرداخت شما با مشکل مواجه شد و سفارش تکمیل نشد.";

  const hint =
    "در صورت کسر وجه، مبلغ به صورت خودکار توسط درگاه پرداخت بازگشت داده می‌شود. در صورت عدم بازگشت وجه تا پایان روز، با پشتیبانی تماس بگیرید.";

  return (
    <div className="container mx-auto px-4 py-10" dir="rtl">
      <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-md p-8">
        <div className="flex flex-col items-center text-center">
          <div className="w-24 h-24 rounded-full bg-orange-100 flex items-center justify-center mb-6">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-12 w-12 text-orange-500"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              role="img"
              aria-labelledby="status-error-icon"
            >
              <title id="status-error-icon">Error status</title>
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v4m0 4h.01M12 2a10 10 0 1010 10A10 10 0 0012 2z"
              />
            </svg>
          </div>

          <h1 className="text-3xl font-bold text-orange-700 mb-4">{title}</h1>
          <p className="text-gray-700 mb-4 text-lg">{message}</p>
          <p className="text-gray-600 mb-6 text-sm">{hint}</p>

          {orderIdParam && (
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-6 mb-6 w-full">
              <h3 className="text-lg font-semibold text-orange-800 mb-3">
                اطلاعات سفارش
              </h3>
              <div className="space-y-2 text-right">
                <p className="text-gray-700">
                  <span className="font-medium">شماره سفارش:</span>
                  <span className="mr-2 font-semibold text-orange-700">
                    #{orderIdParam}
                  </span>
                </p>
                {code && (
                  <p className="text-gray-700">
                    <span className="font-medium">کد خطا:</span>
                    <span className="mr-2 font-semibold text-orange-700 break-all">
                      {code}
                    </span>
                  </p>
                )}
                <p className="text-gray-700">
                  <span className="font-medium">وضعیت:</span>
                  <span className="mr-2 text-orange-700">
                    {statusLoading
                      ? "در حال بارگذاری..."
                      : translateOrderStatus(orderStatus) || "نیاز به بررسی"}
                  </span>
                </p>
              </div>

              {isValidOrderId ? (
                <PaymentStatus orderId={parsedOrderId!} />
              ) : (
                <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm text-red-700 text-right">
                    شماره سفارش نامعتبر است. لطفاً با پشتیبانی تماس بگیرید.
                  </p>
                </div>
              )}
            </div>
          )}

          <div className="w-full max-w-md space-y-3">
            <button
              type="button"
              onClick={handleBackToCart}
              className="w-full bg-pink-500 text-white py-3 px-6 rounded-lg text-center hover:bg-pink-600 transition-colors"
            >
              بازگشت به سبد خرید
            </button>
            <button
              type="button"
              onClick={handleContactSupport}
              className="w-full bg-gray-100 text-gray-800 py-3 px-6 rounded-lg text-center hover:bg-gray-200 transition-colors"
            >
              تماس با پشتیبانی
            </button>
            <button
              type="button"
              onClick={handleContinueShopping}
              className="w-full text-gray-700 py-3 px-6 rounded-lg text-center hover:bg-gray-50 transition-colors"
            >
              ادامه خرید
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function PaymentIssue(): React.ReactElement {
  return (
    <Suspense
      fallback={
        <div className="container mx-auto px-4 py-10">
          <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-md p-8">
            <div className="flex justify-center items-center h-40">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-orange-500" />
            </div>
          </div>
        </div>
      }
    >
      <PaymentIssueContent />
    </Suspense>
  );
}
