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
        <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-md p-8">
          <div className="flex justify-center items-center h-40">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-pink-500"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-10" dir="rtl">
      <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-md p-8">
        <div className="flex flex-col items-center text-center">
          {/* Success Icon */}
          <div className="relative w-24 h-24 mb-6">
            <div className="w-full h-full rounded-full bg-green-100 flex items-center justify-center">
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
          <h1 className="text-3xl font-bold text-green-600 mb-4">
            پرداخت با موفقیت انجام شد!
          </h1>

          <p className="text-gray-700 mb-6 text-lg">
            پرداخت شما با موفقیت پردازش شد و سفارش شما ثبت گردید.
          </p>

          {/* Order Information */}
          {orderId && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-6 mb-6 w-full">
              <h3 className="text-lg font-semibold text-green-800 mb-3">
                اطلاعات سفارش
              </h3>
              <div className="space-y-2 text-right">
                <p className="text-gray-700">
                  <span className="font-medium">شماره سفارش:</span>
                  <span className="mr-2 font-semibold text-green-700">
                    #{orderId}
                  </span>
                </p>
                {orderDetails && (
                  <>
                    <p className="text-gray-700">
                      <span className="font-medium">وضعیت:</span>
                      <span className="mr-2 text-green-600">پرداخت شده</span>
                    </p>
                    <p className="text-gray-700">
                      <span className="font-medium">تاریخ:</span>
                      <span className="mr-2">
                        {new Date().toLocaleDateString("fa-IR")}
                      </span>
                    </p>
                  </>
                )}
              </div>

              {orderId && <PaymentStatus orderId={parseInt(orderId)} />}
            </div>
          )}

          {/* Next Steps */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6 w-full">
            <h3 className="text-lg font-semibold text-blue-800 mb-3">
              مراحل بعدی
            </h3>
            <div className="text-right space-y-2 text-gray-700">
              <p>✅ سفارش شما در حال پردازش است</p>
              <p>✅ ایمیل تایید برای شما ارسال خواهد شد</p>
              <p>✅ می‌توانید وضعیت سفارش خود را پیگیری کنید</p>
              <p>✅ کالاها در کمترین زمان ممکن ارسال می‌شوند</p>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 w-full">
              <p className="text-red-600 text-center">{error}</p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 w-full max-w-md">
            <button
              onClick={handleViewOrder}
              className="bg-pink-500 text-white py-3 px-6 rounded-lg text-center hover:bg-pink-600 transition-colors flex-1"
            >
              مشاهده جزئیات سفارش
            </button>

            <button
              onClick={handleContinueShopping}
              className="bg-gray-100 text-gray-800 py-3 px-6 rounded-lg text-center hover:bg-gray-200 transition-colors flex-1"
            >
              ادامه خرید
            </button>
          </div>

          <div className="mt-4 w-full max-w-md">
            <button
              onClick={handleViewDashboard}
              className="w-full bg-blue-100 text-blue-800 py-3 px-6 rounded-lg text-center hover:bg-blue-200 transition-colors"
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
          <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-md p-8">
            <div className="flex justify-center items-center h-40">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-pink-500"></div>
            </div>
          </div>
        </div>
      }
    >
      <PaymentSuccessContent />
    </Suspense>
  );
}
