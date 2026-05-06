"use client";

import React, { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { OrderService } from "@/services";
import PaymentOrderInfo from "@/components/User/Orders/Payment/PaymentOrderInfo";
import PaymentActions from "@/components/User/Orders/Payment/PaymentActions";

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
    <div className="container mx-auto px-4 md:px-8 lg:px-16 py-10" dir="rtl">
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

          <PaymentOrderInfo
            orderIdParam={orderIdParam}
            code={code}
            statusLoading={statusLoading}
            orderStatus={orderStatus}
            isValidOrderId={isValidOrderId}
            parsedOrderId={parsedOrderId}
          />

          <PaymentActions
            handleBackToCart={handleBackToCart}
            handleContactSupport={handleContactSupport}
            handleContinueShopping={handleContinueShopping}
          />
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
