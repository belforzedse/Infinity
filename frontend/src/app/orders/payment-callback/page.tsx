"use client";

import React, { Suspense, useEffect, useState, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { OrderService } from "@/services";
import {
  orderIdAtom,
  orderNumberAtom,
  submitOrderStepAtom,
  transactionIdAtom,
} from "@/atoms/Order";
import { useAtom } from "jotai";
import { SubmitOrderStep } from "@/types/Order";
import { useCart } from "@/contexts/CartContext";

function PaymentCallbackContent() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [_, setOrderId] = useAtom(orderIdAtom);
  const [__, setOrderNumber] = useAtom(orderNumberAtom);
  const [___, setSubmitOrderStep] = useAtom(submitOrderStepAtom);
  const [____, setTransactionId] = useAtom(transactionIdAtom);
  const { clearCart } = useCart();
  const searchParams = useSearchParams();
  const router = useRouter();

  const navigateToSuccess = useCallback(async () => {
    try {
      await clearCart();
    } catch (error) {
      console.error("[PaymentCallback] Failed to refresh cart after payment:", error);
    }
    setSubmitOrderStep(SubmitOrderStep.Success);
    router.push("/orders/success");
  }, [clearCart, router, setSubmitOrderStep]);

  useEffect(() => {
    const handlePaymentCallback = async () => {
      try {
        setLoading(true);
        setTransactionId(null);

        // Get parameters from URL
        const resNum = searchParams.get("ResNum"); // Order ID
        const refNum = searchParams.get("RefNum"); // Payment reference number

        // Check localStorage for backup data
        const pendingOrderId = localStorage.getItem("pendingOrderId");
        const pendingRefId = localStorage.getItem("pendingRefId");

        if (!resNum || !refNum) {
          // Try to use localStorage data as fallback
          if (!(pendingOrderId && pendingRefId)) {
            throw new Error("اطلاعات پرداخت ناقص است");
          }
        }

        const orderIdToVerify = resNum || pendingOrderId;
        const refIdToVerify = refNum || pendingRefId;

        if (!orderIdToVerify || !refIdToVerify) {
          throw new Error("اطلاعات پرداخت ناقص است");
        }

        // Verify payment with backend
        const verificationResult = await OrderService.verifyPayment(
          Number(orderIdToVerify),
          refIdToVerify,
        );

        // Store order information in atoms
        setOrderId(verificationResult.orderId);
        setOrderNumber(verificationResult.orderNumber);
        setTransactionId(
          verificationResult.transactionId
            ? String(verificationResult.transactionId)
            : null,
        );

        // Clear localStorage backup data on successful verification
        localStorage.removeItem("pendingOrderId");
        localStorage.removeItem("pendingRefId");

        // Double-check payment status
        try {
          const paymentStatus = await OrderService.getOrderPaymentStatus(verificationResult.orderId);

          if (paymentStatus.transactionId) {
            setTransactionId(String(paymentStatus.transactionId));
          }

          // Set step based on payment status from direct API check
          if (paymentStatus.isPaid) {
            await navigateToSuccess();
            return;
          }
        } catch {
          // If payment status cannot be confirmed, fall back to verification result
        }

        // If we couldn't check or payment is not verified, use the verification result
        if (verificationResult.success) {
          await navigateToSuccess();
        } else {
          setSubmitOrderStep(SubmitOrderStep.Failure);
          router.push("/orders/failure");
        }
      } catch (err: any) {
        setError(err.message || "خطا در بررسی وضعیت پرداخت");
        setSubmitOrderStep(SubmitOrderStep.Failure);
        setTransactionId(null);
        router.push("/orders/failure");
      } finally {
        setLoading(false);
      }
    };

    handlePaymentCallback();
  }, [
    searchParams,
    router,
    setOrderId,
    setOrderNumber,
    setSubmitOrderStep,
    setTransactionId,
    navigateToSuccess,
  ]);

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
