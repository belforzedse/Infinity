"use client";

import React, { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { OrderService } from "@/services";
import { orderIdAtom, orderNumberAtom, submitOrderStepAtom } from "@/atoms/Order";
import { useAtom } from "jotai";
import { SubmitOrderStep } from "@/types/Order";

function PaymentCallbackContent() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [_, setOrderId] = useAtom(orderIdAtom);
  const [__, setOrderNumber] = useAtom(orderNumberAtom);
  const [___, setSubmitOrderStep] = useAtom(submitOrderStepAtom);
  const searchParams = useSearchParams();
  const router = useRouter();

  useEffect(() => {
    const handlePaymentCallback = async () => {
      try {
        setLoading(true);

        // Get parameters from URL
        const resNum = searchParams.get("ResNum"); // Order ID
        const refNum = searchParams.get("RefNum"); // Payment reference number

        console.log("=== PAYMENT CALLBACK DEBUG ===");
        console.log("ResNum (Order ID):", resNum);
        console.log("RefNum (Payment Ref):", refNum);

        // Check localStorage for backup data
        const pendingOrderId = localStorage.getItem("pendingOrderId");
        const pendingRefId = localStorage.getItem("pendingRefId");
        console.log("Pending Order ID from localStorage:", pendingOrderId);
        console.log("Pending Ref ID from localStorage:", pendingRefId);

        if (!resNum || !refNum) {
          // Try to use localStorage data as fallback
          if (pendingOrderId && pendingRefId) {
            console.log("⚠️ Using localStorage fallback data");
          } else {
            throw new Error("اطلاعات پرداخت ناقص است");
          }
        }

        const orderIdToVerify = resNum || pendingOrderId;
        const refIdToVerify = refNum || pendingRefId;

        if (!orderIdToVerify || !refIdToVerify) {
          throw new Error("اطلاعات پرداخت ناقص است");
        }

        console.log(
          "✅ Verifying payment with Order ID:",
          orderIdToVerify,
          "Ref ID:",
          refIdToVerify,
        );

        // Verify payment with backend
        const verificationResult = await OrderService.verifyPayment(
          Number(orderIdToVerify),
          refIdToVerify,
        );

        console.log("Payment verification result:", verificationResult);

        // Store order information in atoms
        setOrderId(verificationResult.orderId);
        setOrderNumber(verificationResult.orderNumber);

        // Clear localStorage backup data on successful verification
        localStorage.removeItem("pendingOrderId");
        localStorage.removeItem("pendingRefId");

        // Double-check payment status
        try {
          const paymentStatus = await OrderService.getOrderPaymentStatus(
            verificationResult.orderId,
          );

          console.log("Payment status check:", paymentStatus);

          // Set step based on payment status from direct API check
          if (paymentStatus.isPaid) {
            console.log("✅ Payment confirmed - redirecting to success");
            setSubmitOrderStep(SubmitOrderStep.Success);
            router.push("/orders/success");
            return;
          }
        } catch (statusError) {
          console.warn(
            "Could not verify payment status via API, using verification result only:",
            statusError,
          );
        }

        // If we couldn't check or payment is not verified, use the verification result
        if (verificationResult.success) {
          console.log("✅ Payment verified via verification API - redirecting to success");
          setSubmitOrderStep(SubmitOrderStep.Success);
          router.push("/orders/success");
        } else {
          console.log("❌ Payment verification failed - redirecting to failure");
          setSubmitOrderStep(SubmitOrderStep.Failure);
          router.push("/orders/failure");
        }
      } catch (err: any) {
        console.error("❌ Payment verification error:", err);
        setError(err.message || "خطا در بررسی وضعیت پرداخت");
        setSubmitOrderStep(SubmitOrderStep.Failure);
        router.push("/orders/failure");
      } finally {
        setLoading(false);
      }
    };

    handlePaymentCallback();
  }, [searchParams, router, setOrderId, setOrderNumber, setSubmitOrderStep]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center">
      {loading ? (
        <div className="p-10 text-center">
          <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-b-2 border-t-2 border-pink-500"></div>
          <p className="text-lg">در حال بررسی وضعیت پرداخت...</p>
          <p className="text-sm mt-2 text-gray-500">لطفا صفحه را نبندید</p>
        </div>
      ) : error ? (
        <div className="p-10 text-center">
          <div className="text-xl mb-4 text-red-500">خطا در پردازش پرداخت</div>
          <p className="text-gray-700">{error}</p>
        </div>
      ) : null}
    </div>
  );
}

export default function PaymentCallback() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen flex-col items-center justify-center">
          <div className="p-10 text-center">
            <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-b-2 border-t-2 border-pink-500"></div>
            <p className="text-lg">در حال بارگذاری...</p>
          </div>
        </div>
      }
    >
      <PaymentCallbackContent />
    </Suspense>
  );
}
