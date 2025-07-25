"use client";

import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { Option } from "@/components/Kits/Form/Select";
import ShoppingCartBillInformationForm from "./InformationForm";
import ShoppingCartBillDeliveryForm from "./DeliveryForm";
import ShoppingCartBillDiscountCoupon from "./DiscountCoupon";
import ShoppingCartBillPaymentGateway from "./PaymentGateway";
import {
  orderIdAtom,
  orderNumberAtom,
  submitOrderStepAtom,
} from "@/atoms/Order";
import { useAtom } from "jotai";
import { SubmitOrderStep } from "@/types/Order";
import { useRouter } from "next/navigation";
import { ShippingMethod } from "@/services/shipping";
import { CartService } from "@/services";
import { useCart } from "@/contexts/CartContext";
import toast from "react-hot-toast";

export type FormData = {
  fullName: string;
  phoneNumber: string;
  address: Option | null;
  shippingMethod: ShippingMethod | null;
  notes?: string;
};

type Props = {};

function ShoppingCartBillForm({}: Props) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitOrderStep, setSubmitOrderStep] = useAtom(submitOrderStepAtom);
  const [_, setOrderId] = useAtom(orderIdAtom);
  const [__, setOrderNumber] = useAtom(orderNumberAtom);
  const router = useRouter();

  const {
    register,
    handleSubmit,
    control,
    setValue,
    watch,
    formState: { errors },
  } = useForm<FormData>();

  const watchShippingMethod = watch("shippingMethod");

  const onSubmit = async (data: FormData) => {
    if (!data.address) {
      setError("لطفا یک آدرس انتخاب کنید");
      return;
    }

    if (!data.shippingMethod) {
      setError("لطفا روش ارسال را انتخاب کنید");
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);

      // First, check cart stock to make sure all items are available
      const stockValid = await CartService.checkCartStock();

      if (!stockValid.valid) {
        if (stockValid.cartIsEmpty) {
          setError("سبد خرید شما خالی است");
          return;
        }

        // Display a message about modified items if any
        if (
          stockValid.itemsAdjusted?.length ||
          stockValid.itemsRemoved?.length
        ) {
          toast.error(
            "برخی از کالاهای سبد خرید شما به دلیل موجودی تغییر کرده‌اند"
          );
        }
      }

      // Prepare the data for finalizing cart
      const finalizeData = {
        shipping: Number(data.shippingMethod.id),
        shippingCost: Number(data.shippingMethod.attributes.Price),
        note: data.notes || undefined,
        callbackURL: "/orders/payment-callback",
      };

      // Make a single call to finalize cart
      const cartResponse = await CartService.finalizeCart(finalizeData);

      console.log("=== FINALIZE CART RESPONSE DEBUG ===");
      console.log("Raw cartResponse:", cartResponse);
      console.log("cartResponse type:", typeof cartResponse);
      console.log("cartResponse.success:", cartResponse.success);
      console.log("cartResponse.redirectUrl:", cartResponse.redirectUrl);
      console.log("cartResponse.redirectUrl type:", typeof cartResponse.redirectUrl);
      console.log("Is redirectUrl truthy?", !!cartResponse.redirectUrl);

      if (!cartResponse.success) {
        console.error("❌ Cart finalization failed:", cartResponse);
        setError("خطا در ثبت سفارش. لطفا مجددا تلاش کنید.");
        return;
      }

      // Store the order ID and other response data
      setOrderId(cartResponse.orderId);
      setOrderNumber(cartResponse.orderId.toString()); // Use orderId as orderNumber

      // Log the response for debugging
      console.log("=== FINALIZE CART RESPONSE ===");
      console.log("Success:", cartResponse.success);
      console.log("Order ID:", cartResponse.orderId);
      console.log("Contract ID:", cartResponse.contractId);
      console.log("Redirect URL:", cartResponse.redirectUrl);
      console.log("Ref ID:", cartResponse.refId);
      console.log("Financial Summary:", cartResponse.financialSummary);

      try {
        // Check if we have a payment gateway redirect URL
        if (cartResponse.redirectUrl && cartResponse.redirectUrl.trim() !== "") {
          console.log("✅ Redirecting to payment gateway:", cartResponse.redirectUrl);
          console.log("RefId to send:", cartResponse.refId);
          
          // Show user feedback before redirect
          toast.success("در حال انتقال به درگاه پرداخت...");
          
          // Store essential order info in localStorage as backup
          localStorage.setItem("pendingOrderId", cartResponse.orderId.toString());
          localStorage.setItem("pendingRefId", cartResponse.refId || "");
          
          // Create a form to POST the RefId to the payment gateway
          const createPaymentForm = () => {
            const form = document.createElement("form");
            form.method = "POST";
            form.action = cartResponse.redirectUrl!;
            form.style.display = "none";
            
            // Add RefId as form data
            if (cartResponse.refId) {
              const refIdInput = document.createElement("input");
              refIdInput.type = "hidden";
              refIdInput.name = "RefId";
              refIdInput.value = cartResponse.refId;
              form.appendChild(refIdInput);
              
              console.log("📤 Adding RefId to form:", cartResponse.refId);
            }
            
            document.body.appendChild(form);
            return form;
          };
          
          // Submit the form after a small delay
          setTimeout(() => {
            console.log("🚀 Submitting payment form with RefId");
            const form = createPaymentForm();
            form.submit();
          }, 1000);
          
          // Fallback: If redirect doesn't happen within 5 seconds, show error
          setTimeout(() => {
            console.error("❌ Payment gateway redirect timeout");
            toast.error("خطا در اتصال به درگاه پرداخت. لطفا مجددا تلاش کنید.");
            setIsSubmitting(false);
          }, 5000);
          
        } else {
          console.log("⚠️ No redirect URL provided - going to success page");
          console.log("Redirect URL value:", cartResponse.redirectUrl);
          console.log("Redirect URL empty check:", cartResponse.redirectUrl === "");
          console.log("Redirect URL undefined check:", cartResponse.redirectUrl === undefined);
          console.log("Redirect URL null check:", cartResponse.redirectUrl === null);
          
          // No payment gateway redirect URL, go straight to success page
          setSubmitOrderStep(SubmitOrderStep.Success);
          router.push("/orders/success");
        }
      } catch (redirectError) {
        console.error("❌ Error during redirect preparation:", redirectError);
        toast.error("خطا در آماده‌سازی پرداخت. لطفا مجددا تلاش کنید.");
        setIsSubmitting(false);
      }
    } catch (err: any) {
      console.error("Error creating order:", err);
      setError(err.message || "خطا در ثبت سفارش. لطفا مجددا تلاش کنید.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <span className="lg:text-3xl text-lg text-neutral-800">
        اطلاعات صورت حساب
      </span>

      {error && (
        <div className="bg-red-50 text-red-600 p-3 rounded-lg">{error}</div>
      )}

      <div className="grid lg:grid-cols-3 grid-cols-1 gap-4">
        <ShoppingCartBillInformationForm
          register={register}
          errors={errors}
          control={control}
          setValue={setValue}
        />

        <div className="flex flex-col gap-6 mb-20">
          <ShoppingCartBillDeliveryForm
            control={control}
            setValue={setValue}
            selectedShipping={watchShippingMethod}
          />
          <ShoppingCartBillDiscountCoupon />
          <ShoppingCartBillPaymentGateway />
          <button
            type="submit"
            disabled={isSubmitting}
            className={`text-white bg-pink-500 lg:py-4 py-3 rounded-lg text-nowrap w-full lg:text-base text-xl ${
              isSubmitting ? "opacity-70 cursor-not-allowed" : ""
            }`}
          >
            {isSubmitting ? "در حال پردازش..." : "پرداخت"}
          </button>
        </div>
      </div>
    </form>
  );
}

export default ShoppingCartBillForm;
