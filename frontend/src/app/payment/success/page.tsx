"use client";

import React, { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import PaymentStatus from "@/components/User/Orders/PaymentStatus";

interface OrderDetails {
  id: number;
  Status: string;
  Date: string;
  Total: number;
  ShippingCost: number;
  order_items: Array<{
    id: number;
    Count: number;
    Sum: string | number;
    product_variation: {
      product: {
        Title: string;
      };
    };
  }>;
  shipping: {
    Title: string;
    Price: number;
  };
}

function PaymentSuccessContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const orderId = searchParams.get("orderId");

  const [orderDetails, setOrderDetails] = useState<OrderDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (orderId) {
      fetchOrderDetails(orderId);
    } else {
      setLoading(false);
      setError("شناسه سفارش یافت نشد");
    }
  }, [orderId]);

  const fetchOrderDetails = async (orderIdParam: string) => {
    try {
      setLoading(true);
      setError(null);

      // You may need to implement this method in OrderService
      // For now, we'll use a placeholder structure
      setOrderDetails({
        id: parseInt(orderIdParam),
        Status: "Paid",
        Date: new Date().toISOString(),
        Total: 0,
        ShippingCost: 0,
        order_items: [],
        shipping: {
          Title: "ارسال عادی",
          Price: 0,
        },
      });
    } catch (err: any) {
      console.error("Error fetching order details:", err);
      setError("خطا در دریافت جزئیات سفارش");
    } finally {
      setLoading(false);
    }
  };

  const handleViewOrder = () => {
    if (orderId) {
      router.push(`/orders/${orderId}`);
    } else {
      router.push("/orders");
    }
  };

  const handleContinueShopping = () => {
    router.push("/");
  };

  const handleViewDashboard = () => {
    router.push("/account");
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-10">
        <div className="mx-auto max-w-2xl rounded-lg bg-white p-8 shadow-md">
          <div className="flex h-40 items-center justify-center">
            <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-t-2 border-pink-500"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-10" dir="rtl">
      <div className="mx-auto max-w-2xl rounded-lg bg-white p-8 shadow-md">
        <div className="flex flex-col items-center text-center">
          {/* Success Icon */}
          <div className="relative mb-6 h-24 w-24">
            <div className="flex h-full w-full items-center justify-center rounded-full bg-green-100">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-12 w-12 text-green-500"
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
            </div>
          </div>

          {/* Success Message */}
          <h1 className="text-3xl mb-4 font-bold text-green-600">پرداخت با موفقیت انجام شد!</h1>

          <p className="text-lg mb-6 text-gray-700">
            پرداخت شما با موفقیت پردازش شد و سفارش شما ثبت گردید.
          </p>

          {/* Order Information */}
          {orderId && (
            <div className="mb-6 w-full rounded-lg border border-green-200 bg-green-50 p-6">
              <h3 className="text-lg mb-3 font-semibold text-green-800">اطلاعات سفارش</h3>
              <div className="space-y-2 text-right">
                <p className="text-gray-700">
                  <span className="font-medium">شماره سفارش:</span>
                  <span className="mr-2 font-semibold text-green-700">#{orderId}</span>
                </p>
                {orderDetails && (
                  <>
                    <p className="text-gray-700">
                      <span className="font-medium">وضعیت:</span>
                      <span className="mr-2 text-green-600">پرداخت شده</span>
                    </p>
                    <p className="text-gray-700">
                      <span className="font-medium">تاریخ:</span>
                      <span className="mr-2">{new Date().toLocaleDateString("fa-IR")}</span>
                    </p>
                  </>
                )}
              </div>

              {orderId && <PaymentStatus orderId={parseInt(orderId)} />}
            </div>
          )}

          {/* Next Steps */}
          <div className="mb-6 w-full rounded-lg border border-blue-200 bg-blue-50 p-6">
            <h3 className="text-lg mb-3 font-semibold text-blue-800">مراحل بعدی</h3>
            <div className="space-y-2 text-right text-gray-700">
              <p>✅ سفارش شما در حال پردازش است</p>
              <p>✅ ایمیل تایید برای شما ارسال خواهد شد</p>
              <p>✅ می‌توانید وضعیت سفارش خود را پیگیری کنید</p>
              <p>✅ کالاها در کمترین زمان ممکن ارسال می‌شوند</p>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-6 w-full rounded-lg border border-red-200 bg-red-50 p-4">
              <p className="text-center text-red-600">{error}</p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex w-full max-w-md flex-col gap-4 sm:flex-row">
            <button
              onClick={handleViewOrder}
              className="flex-1 rounded-lg bg-pink-500 px-6 py-3 text-center text-white transition-colors hover:bg-pink-600"
            >
              مشاهده جزئیات سفارش
            </button>

            <button
              onClick={handleContinueShopping}
              className="flex-1 rounded-lg bg-gray-100 px-6 py-3 text-center text-gray-800 transition-colors hover:bg-gray-200"
            >
              ادامه خرید
            </button>
          </div>

          <div className="mt-4 w-full max-w-md">
            <button
              onClick={handleViewDashboard}
              className="w-full rounded-lg bg-blue-100 px-6 py-3 text-center text-blue-800 transition-colors hover:bg-blue-200"
            >
              رفتن به داشبورد
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function PaymentSuccess() {
  return (
    <Suspense
      fallback={
        <div className="container mx-auto px-4 py-10">
          <div className="mx-auto max-w-2xl rounded-lg bg-white p-8 shadow-md">
            <div className="flex h-40 items-center justify-center">
              <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-t-2 border-pink-500"></div>
            </div>
          </div>
        </div>
      }
    >
      <PaymentSuccessContent />
    </Suspense>
  );
}
