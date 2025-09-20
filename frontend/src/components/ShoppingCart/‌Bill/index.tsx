"use client";

import React, { useEffect, useState } from "react";
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
import toast from "react-hot-toast";
import WalletService from "@/services/wallet";
import { useCart } from "@/contexts/CartContext";

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
  const watchAddress = watch("address");
  const shippingId = watchShippingMethod
    ? Number(watchShippingMethod.id)
    : undefined;
  const shippingCost = watchShippingMethod
    ? Number(watchShippingMethod.attributes?.Price || 0)
    : undefined;
  const addressId = watchAddress
    ? Number((watchAddress as any)?.id)
    : undefined;

  // Gateway selection state
  const [gateway, setGateway] = useState<"mellat" | "snappay" | "wallet">(
    "mellat"
  );
  const [snappEligible, setSnappEligible] = useState<boolean>(true);
  const [snappMessage, setSnappMessage] = useState<string | undefined>(
    undefined
  );
  const [discountCode, setDiscountCode] = useState<string | undefined>(
    undefined
  );
  const [discountPreview, setDiscountPreview] = useState<
    | {
        discount: number;
        summary: {
          subtotal: number;
          eligibleSubtotal: number;
          tax: number;
          shipping: number;
          total: number;
          taxPercent: number;
        };
      }
    | undefined
  >(undefined);
  const [shippingPreview, setShippingPreview] = useState<
    { shipping: number; weight?: number } | undefined
  >(undefined);
  const [walletBalanceIrr, setWalletBalanceIrr] = useState<number>(0);
  const { totalPrice } = useCart();

  // Persist/restore discount code
  useEffect(() => {
    try {
      const saved = localStorage.getItem("discountCode");
      if (saved) setDiscountCode(saved);
    } catch {}
  }, []);

  useEffect(() => {
    try {
      if (discountCode) localStorage.setItem("discountCode", discountCode);
      else localStorage.removeItem("discountCode");
    } catch {}
  }, [discountCode]);

  // Refresh discount preview when code or shipping changes (stable deps)
  useEffect(() => {
    const run = async () => {
      if (!discountCode) {
        setDiscountPreview(undefined);
        return;
      }
      try {
        const res = await CartService.applyDiscount({
          code: discountCode,
          shippingId,
          shippingCost,
        });
        if (res?.success) {
          setDiscountPreview({ discount: res.discount, summary: res.summary });
        }
      } catch (e) {
        console.error("applyDiscount failed:", e);
      }
    };
    run();
  }, [discountCode, shippingId, shippingCost]);

  // Fetch shipping preview on address or shipping change
  useEffect(() => {
    const run = async () => {
      try {
        if (!addressId || !shippingId) return;
        const preview = await CartService.getShippingPreview({
          addressId,
          shippingId,
        });
        if (preview?.success) {
          setShippingPreview({
            shipping: preview.shipping,
            weight: preview.weight,
          });
          // Merge with discount preview totals if exists
          setDiscountPreview((prev) => {
            if (!prev) return prev;
            const { subtotal, eligibleSubtotal, taxPercent } = prev.summary;
            const tax = prev.summary.tax;
            const shipping = preview.shipping || 0;
            const total = subtotal - prev.discount + tax + shipping;
            return {
              discount: prev.discount,
              summary: {
                subtotal,
                eligibleSubtotal,
                tax,
                shipping,
                total,
                taxPercent,
              },
            };
          });
        }
      } catch (e) {
        console.error("getShippingPreview failed:", e);
      }
    };
    run();
  }, [addressId, shippingId]);

  // Re-check SnappPay eligibility when shipping or discount changes (stable deps)
  useEffect(() => {
    const run = async () => {
      try {
        if (!shippingId) {
          setSnappEligible(true);
          setSnappMessage(undefined);
          return;
        }
        const res = await CartService.getSnappEligible({
          shippingId,
          shippingCost,
          discountCode,
        });
        setSnappEligible(!!res.eligible);
        const msg = res.title || res.description;
        setSnappMessage(msg);
      } catch (e) {
        // Keep previous eligibility/message on error to avoid incorrect enablement
        console.error("getSnappEligible failed:", e);
      }
    };
    run();
  }, [shippingId, shippingCost, discountCode]);

  // Load wallet balance once
  useEffect(() => {
    const run = async () => {
      try {
        const res = await WalletService.getMyWallet();
        if (res?.success && res.data)
          setWalletBalanceIrr(Number(res.data.balance || 0));
      } catch {}
    };
    run();
  }, []);

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

      const stockValid = await CartService.checkCartStock();

      if (!stockValid.valid) {
        if (stockValid.cartIsEmpty) {
          setError("سبد خرید شما خالی است");
          return;
        }

        if (
          stockValid.itemsAdjusted?.length ||
          stockValid.itemsRemoved?.length
        ) {
          toast.error(
            "برخی از کالاهای سبد خرید شما به دلیل موجودی تغییر کرده‌اند"
          );
        }
      }

      const finalizeData = {
        shipping: Number(data.shippingMethod.id),
        shippingCost: Number(data.shippingMethod.attributes.Price),
        note: data.notes || undefined,
        callbackURL: "/orders/payment-callback",
        addressId: Number((data.address as any)?.id),
        gateway: gateway,
        mobile: data.phoneNumber?.replace(/\D/g, ""),
        discountCode: discountCode || undefined,
      } as any;

      const cartResponse = await CartService.finalizeCart(finalizeData);

      if (!cartResponse.success) {
        console.error("❌ Cart finalization failed:", cartResponse);
        setError("خطا در ثبت سفارش. لطفا مجددا تلاش کنید.");
        return;
      }

      setOrderId(cartResponse.orderId);
      setOrderNumber(cartResponse.orderId.toString());

      if (cartResponse.redirectUrl && cartResponse.redirectUrl.trim() !== "") {
        toast.success("در حال انتقال به درگاه پرداخت...");
        localStorage.setItem("pendingOrderId", cartResponse.orderId.toString());
        localStorage.setItem("pendingRefId", cartResponse.refId || "");

        // If SnappPay, just redirect with GET; if Mellat, keep current POST with RefId
        if (gateway === "snappay") {
          window.location.href = cartResponse.redirectUrl!;
        } else if (gateway === "mellat") {
          const createPaymentForm = () => {
            const form = document.createElement("form");
            form.method = "POST";
            form.action = cartResponse.redirectUrl!;
            form.style.display = "none";
            if (cartResponse.refId) {
              const refIdInput = document.createElement("input");
              refIdInput.type = "hidden";
              refIdInput.name = "RefId";
              refIdInput.value = cartResponse.refId;
              form.appendChild(refIdInput);
            }
            document.body.appendChild(form);
            return form;
          };
          setTimeout(() => {
            const form = createPaymentForm();
            form.submit();
          }, 500);
        } else if (gateway === "wallet") {
          // Wallet flow returns no redirect; just move to success
          setSubmitOrderStep(SubmitOrderStep.Success);
          router.push("/orders/success");
        }
      } else {
        setSubmitOrderStep(SubmitOrderStep.Success);
        router.push("/orders/success");
      }
    } catch (err: any) {
      console.error("Error creating order:", err);
      setError(err.message || "خطا در ثبت سفارش. لطفا مجددا تلاش کنید.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Compute required amount (toman -> IRR) for wallet enablement, independent of discountPreview presence
  // Fallbacks: subtotal + tax + shipping when no discount is applied
  const shippingToman = shippingPreview?.shipping ?? shippingCost ?? 0;
  const discountToman = discountPreview?.discount ?? 0;
  const subtotalToman = totalPrice;
  const taxToman = Math.round(((subtotalToman - discountToman) * 10) / 100);
  const totalToman = Math.max(
    0,
    Math.round(subtotalToman - discountToman + taxToman + shippingToman)
  );
  const requiredAmountIrr = totalToman * 10;

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
            discountPreview={discountPreview}
            shippingPreviewShipping={shippingPreview?.shipping}
          />
          <ShoppingCartBillDiscountCoupon
            shippingId={
              watchShippingMethod ? Number(watchShippingMethod.id) : undefined
            }
            shippingCost={
              watchShippingMethod
                ? Number(watchShippingMethod.attributes?.Price || 0)
                : undefined
            }
            onApplied={(code, preview) => {
              setDiscountCode(code);
              setDiscountPreview(preview);
            }}
            appliedCode={discountCode}
            onRemove={() => {
              setDiscountCode(undefined);
              setDiscountPreview(undefined);
              try {
                localStorage.removeItem("discountCode");
              } catch {}
            }}
          />
          <ShoppingCartBillPaymentGateway
            selected={gateway}
            onChange={setGateway}
            snappEligible={snappEligible}
            snappMessage={snappMessage}
            walletBalanceIrr={walletBalanceIrr}
            requiredAmountIrr={requiredAmountIrr}
          />
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
