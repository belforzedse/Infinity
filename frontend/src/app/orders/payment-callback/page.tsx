"use client";

import React, { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { OrderService } from "@/services";
import {
  orderIdAtom,
  orderNumberAtom,
  submitOrderStepAtom,
} from "@/atoms/Order";
import { useAtom } from "jotai";
import { SubmitOrderStep } from "@/types/Order";
import logger from "@/utils/logger";

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

        logger.info("PAYMENT CALLBACK DEBUG", { resNum, refNum });

        // Check localStorage for backup data
        const pendingOrderId = localStorage.getItem("pendingOrderId");
        const pendingRefId = localStorage.getItem("pendingRefId");
        logger.info("Pending data from localStorage", {
          pendingOrderId,
          pendingRefId,
        });

        if (!resNum || !refNum) {
          // Try to use localStorage data as fallback
          if (pendingOrderId && pendingRefId) {
            logger.warn("Using localStorage fallback data");
          } else {
            throw new Error("اطلاعات پرداخت ناقص است");
          }
        }

        const orderIdToVerify = resNum || pendingOrderId;
        const refIdToVerify = refNum || pendingRefId;

        if (!orderIdToVerify || !refIdToVerify) {
          throw new Error("اطلاعات پرداخت ناقص است");
        }

        logger.info("Verifying payment", {
          orderId: orderIdToVerify,
          refId: refIdToVerify,
        });

        // Verify payment with backend
        const verificationResult = await OrderService.verifyPayment(
          Number(orderIdToVerify),
          refIdToVerify,
        );

        logger.info("Payment verification result", verificationResult);

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

          logger.info("Payment status check", paymentStatus);

          // Set step based on payment status from direct API check
          if (paymentStatus.isPaid) {
            logger.info("Payment confirmed - redirecting to success");
            setSubmitOrderStep(SubmitOrderStep.Success);
            router.push("/orders/success");
            return;
          }
        } catch (statusError) {
          logger.warn(
            "Could not verify payment status via API, using verification result only",
            { error: statusError },
          );
        }

        // If we couldn't check or payment is not verified, use the verification result
        if (verificationResult.success) {
          logger.info(
            "Payment verified via verification API - redirecting to success",
          );
          setSubmitOrderStep(SubmitOrderStep.Success);
          router.push("/orders/success");
        } else {
          logger.info(
            "Payment verification failed - redirecting to failure",
          );
          setSubmitOrderStep(SubmitOrderStep.Failure);
          router.push("/orders/failure");
        }
      } catch (err: any) {
        logger.error("Payment verification error", { error: err });
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
