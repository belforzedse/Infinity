"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import type { Option } from "@/components/Kits/Form/Select";
import ShoppingCartBillInformationForm from "./InformationForm";
import ShoppingCartBillDeliveryForm from "./DeliveryForm";
import ShoppingCartBillDiscountCoupon from "./DiscountCoupon";
import ShoppingCartBillPaymentGateway from "./PaymentGateway";
import ReserveShipping from "./ReserveShipping";
import { CheckoutProgress } from "../CheckoutProgress";
import { orderIdAtom, orderNumberAtom, submitOrderStepAtom } from "@/atoms/Order";
import { useAtom, useAtomValue } from "jotai";
import { SubmitOrderStep } from "@/types/Order";
import { useRouter } from "next/navigation";
import type { ShippingMethod } from "@/services/shipping";
import { CartService, OrderService } from "@/services";
import {
  DEFAULT_CHECKOUT_GATEWAYS,
  type CheckoutGatewayCode,
} from "@/services/cart/types/cart";
import toast from "react-hot-toast";
import WalletService from "@/services/wallet";
import { useCart } from "@/contexts/CartContext";
import { currentUserAtom, userLoadingAtom } from "@/lib/atoms/auth";
import { ACCESS_TOKEN_STORAGE_KEY } from "@/utils/accessToken";
import { trackFunnelStep, trackMatomoEvent } from "@/lib/analytics/matomo";
import { getUserFacingErrorMessage } from "@/utils/userErrorMessage";
import { translateErrorMessage } from "@/lib/errorTranslations";

export type FormData = {
  fullName: string;
  phoneNumber: string;
  address: Option | null;
  province: Option | null;
  city: Option | null;
  postalCode: string;
  fullAddress: string;
  addressDescription?: string;
  saveAddress: boolean;
  shippingMethod: ShippingMethod | null;
  notes?: string;
};

type Props = Record<string, never>;

function ShoppingCartBillForm({}: Props) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const submitInProgressRef = React.useRef(false);
  const [_submitOrderStep, setSubmitOrderStep] = useAtom(submitOrderStepAtom);
  const [_, setOrderId] = useAtom(orderIdAtom);
  const [__, setOrderNumber] = useAtom(orderNumberAtom);
  const router = useRouter();
  const currentUser = useAtomValue(currentUserAtom);
  const userLoading = useAtomValue(userLoadingAtom);
  const [hasRedirected, setHasRedirected] = useState(false);

  // Check authentication on mount - redirect to login if not authenticated.
  // Wait for global auth loading to finish so we don't redirect while user is still being fetched
  // (avoids loop when returning from auth with valid token).
  useEffect(() => {
    if (typeof window === "undefined") return;

    const currentPath = window.location.pathname;
    if (!currentPath.includes("/checkout")) {
      setHasRedirected(false);
      return;
    }

    // Don't redirect while user is still loading (AuthInitializer may be populating currentUser)
    if (userLoading) return;
    // Don't redirect if we already have a user
    if (currentUser) return;
    // Don't redirect if we've already sent the user to auth this "session"
    if (hasRedirected) return;
    // Belt-and-suspenders: if token exists, give the app a moment to hydrate user
    const token = localStorage.getItem(ACCESS_TOKEN_STORAGE_KEY);
    if (token) return;

    setHasRedirected(true);
    const authUrl = "/auth?redirect=/checkout";
    window.location.href = authUrl;
  }, [currentUser, userLoading, hasRedirected]);

  const {
    register,
    handleSubmit,
    control,
    setValue,
    watch,
    formState: { errors },
  } = useForm<FormData>({
    defaultValues: {
      saveAddress: true,
    },
  });

  const watchShippingMethod = watch("shippingMethod");
  const watchAddress = watch("address");
  const watchCity = watch("city");
  const watchProvince = watch("province");
  const watchPostalCode = watch("postalCode");
  const watchFullAddress = watch("fullAddress");
  const watchSaveAddress = watch("saveAddress");
  const shippingId = watchShippingMethod ? Number(watchShippingMethod.id) : undefined;
  const shippingCost = watchShippingMethod
    ? Number(watchShippingMethod.attributes?.Price || 0)
    : undefined;
  const addressId = watchAddress ? Number(watchAddress?.id) : undefined;

  // Gateway selection state
  const [gateway, setGateway] = useState<CheckoutGatewayCode>("samankish");
  const [availableGateways, setAvailableGateways] = useState<CheckoutGatewayCode[]>([
    ...DEFAULT_CHECKOUT_GATEWAYS,
  ]);
  const [snappEligible, setSnappEligible] = useState<boolean>(false); // Start as not eligible
  const [snappTitle, setSnappTitle] = useState<string | undefined>(undefined);
  const [snappDescription, setSnappDescription] = useState<string | undefined>(undefined);
  const [discountCode, setDiscountCode] = useState<string | undefined>(undefined);
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
  const [walletBalanceIrr, setWalletBalanceIrr] = useState<number>(0);
  const [reserveShipping, setReserveShipping] = useState(false);
  const [activeReserve, setActiveReserve] = useState<{
    reserveGroupId: string;
    reserveExpiresAt: string;
    orderCount: number;
  } | null>(null);
  const [mergeChoice, setMergeChoice] = useState<"merge" | "new" | null>(null);
  const { totalPrice, totalItems, clearCart } = useCart();
  const selectableGateways = useMemo(() => availableGateways.filter((gw) => gw !== "snappay" || snappEligible), [availableGateways, snappEligible]);

  const shippingToman = shippingCost ?? 0;
  const discountToman = discountPreview?.discount ?? 0;
  const subtotalToman = totalPrice;
  const totalToman = Math.max(0, Math.round(subtotalToman - discountToman + shippingToman));

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

  useEffect(() => {
    const loadActiveReserve = async () => {
      if (!currentUser) return;
      try {
        const res = await OrderService.getActiveReserve();
        const d = (res as { data?: { reserveGroupId: string; reserveExpiresAt: string; orderCount: number } | null }).data;
        if (d?.reserveGroupId) {
          setActiveReserve({ reserveGroupId: d.reserveGroupId, reserveExpiresAt: d.reserveExpiresAt, orderCount: d.orderCount });
          setMergeChoice(null);
        } else {
          setActiveReserve(null);
          setMergeChoice(null);
        }
      } catch {
        setActiveReserve(null);
      }
    };
    loadActiveReserve();
  }, [currentUser]);

  useEffect(() => {
    const loadAvailableGateways = async () => {
      try {
        const gateways = await CartService.getAvailableGateways();
        setAvailableGateways(gateways);
      } catch {
        setAvailableGateways([...DEFAULT_CHECKOUT_GATEWAYS]);
      }
    };

    loadAvailableGateways();
  }, []);

  useEffect(() => {
    setError((prev) =>
      selectableGateways.length === 0
        ? EMPTY_GATEWAYS_ERROR
        : prev === EMPTY_GATEWAYS_ERROR
          ? null
          : prev,
    );
    setGateway((prev) =>
      selectableGateways.length > 0 && !selectableGateways.includes(prev)
        ? selectableGateways[0]
        : prev,
    );
  }, [selectableGateways]);

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
        const errorMsg = getUserFacingErrorMessage(e, "خطا در اعمال کد تخفیف. دوباره تلاش کنید.");
        console.error("applyDiscount failed:", errorMsg, e);
      }
    };
    run();
  }, [discountCode, shippingId, shippingCost]);

  // Re-check SnappPay eligibility when shipping, discount, or merge choice changes
  // In merge mode we don't have shippingId (shipping comes from parent order), so allow eligibility check by amount only
  useEffect(() => {
    const run = async () => {
      try {
        const isMergeMode = mergeChoice === "merge";
        if (!isMergeMode && !shippingId) {
          setSnappEligible(false);
          setSnappTitle(undefined);
          setSnappDescription(undefined);
          return;
        }
        if (totalToman <= 0) {
          setSnappEligible(false);
          setSnappTitle(undefined);
          setSnappDescription(undefined);
          return;
        }

        const res = await CartService.getSnappEligible({
          amount: totalToman,
        });
        setSnappEligible(!!res.eligible);
        setSnappTitle(res.title);
        setSnappDescription(res.description);
      } catch {
        setSnappEligible(false);
        setSnappTitle(undefined);
        setSnappDescription(undefined);
      }
    };
    run();
  }, [shippingId, totalToman, mergeChoice]);

  // Load wallet balance once
  useEffect(() => {
    const run = async () => {
      try {
        const res = await WalletService.getMyWallet();
        if (res?.success && res.data) setWalletBalanceIrr(Number(res.data.balance || 0));
      } catch {}
    };
    run();
  }, []);

  // Validate cart has items and total price on mount
  const EMPTY_GATEWAYS_ERROR = "در حال حاضر هیچ درگاه پرداختی فعال نیست";
  const EMPTY_CART_ERROR = "سبد خرید شما خالی است یا مبلغ نامعتبر است";
  useEffect(() => {
    if (!currentUser) {
      return;
    }

    if (totalPrice > 0 || totalItems > 0) {
      setError((prev) => (prev === EMPTY_CART_ERROR ? null : prev));
      return;
    }

    if (totalPrice <= 0 && totalItems === 0) {
      setError(EMPTY_CART_ERROR);
    }
  }, [totalPrice, totalItems, currentUser]);

  const clearCartSafely = async () => {
    try {
      await clearCart();
    } catch (clearError) {
      console.error("[ShoppingCart] Failed to refresh cart after successful checkout:", clearError);
    }
  };

  const trackCheckoutError = (errorCode?: string) => {
    trackMatomoEvent({
      category: "checkout",
      action: "error",
      name: (errorCode || "UNKNOWN_ERROR").slice(0, 64),
    });
  };

  const onSubmit = async (data: FormData) => {
    setError(null);

    const selectedAddressId = data.address?.id ? Number(data.address.id) : undefined;
    const inlineAddressFieldsFilled =
      !!watchProvince && !!watchCity && !!watchPostalCode && !!watchFullAddress;
    const isMergeMode = mergeChoice === "merge";

    if (!isMergeMode) {
      if (!selectedAddressId && !inlineAddressFieldsFilled) {
        setError("لطفا یک آدرس ذخیره شده را انتخاب یا آدرس جدید وارد کنید");
        return;
      }
      if (!data.shippingMethod) {
        setError("لطفا روش ارسال را انتخاب کنید");
        return;
      }
    }

    if (!data.phoneNumber || data.phoneNumber.trim() === "") {
      setError("لطفا شماره تماس خود را وارد کنید");
      return;
    }

    // Validate phone number format (basic check)
    const cleanPhone = data.phoneNumber.replace(/\D/g, "");
    if (cleanPhone.length < 10) {
      setError("شماره تماس وارد شده معتبر نیست");
      return;
    }

    if (!isMergeMode && !selectedAddressId) {
      if (!watchProvince || !watchCity) {
        setError("لطفا استان و شهر را انتخاب کنید");
        return;
      }
      const postal = (watchPostalCode || "").replace(/\D/g, "");
      if (postal.length !== 10) {
        setError("کد پستی باید ۱۰ رقم باشد");
        return;
      }
      if (!watchFullAddress || watchFullAddress.trim().length < 5) {
        setError("لطفا آدرس دقیق را وارد کنید");
        return;
      }
    }

    // Validate total price is positive
    if (totalPrice <= 0) {
      setError("مبلغ سفارش باید بیشتر از صفر باشد");
      return;
    }

    if (selectableGateways.length === 0 || !selectableGateways.includes(gateway)) {
      setError("درگاه پرداخت انتخاب شده در دسترس نیست");
      return;
    }

    // Prevent duplicate submissions while one is in flight
    if (submitInProgressRef.current) {
      console.warn("Submit already in progress, ignoring duplicate submission");
      return;
    }

    try {
      submitInProgressRef.current = true;
      setIsSubmitting(true);
      trackMatomoEvent({
        category: "checkout",
        action: "place_order_attempt",
        name: gateway,
        value: totalPrice,
      });

      const stockValid = await CartService.checkCartStock();

      if (!stockValid.valid) {
        if (stockValid.cartIsEmpty) {
          setError("سبد خرید شما خالی است");
          return;
        }

        if (stockValid.itemsAdjusted?.length || stockValid.itemsRemoved?.length) {
          toast.error("برخی از کالاهای سبد خرید شما به دلیل موجودی تغییر کرده‌اند");
        }
      }

      const addressPayload =
        isMergeMode || selectedAddressId
          ? undefined
          : {
              shipping_city: Number(watchCity?.id),
              PostalCode: (watchPostalCode || "").replace(/\D/g, ""),
              FullAddress: (watchFullAddress || "").trim(),
              Description: data.addressDescription?.trim() || undefined,
              save: watchSaveAddress,
            };

      const finalizeData: Record<string, unknown> = isMergeMode
        ? {
            reserveGroupId: activeReserve?.reserveGroupId,
            callbackURL: "/orders/payment-callback",
            gateway,
            mobile: data.phoneNumber?.replace(/\D/g, ""),
            discountCode: discountCode || localStorage.getItem("discountCode") || undefined,
            note: data.notes || undefined,
          }
        : {
            shipping: Number(data.shippingMethod!.id),
            shippingCost: Number(data.shippingMethod!.attributes.Price),
            note: data.notes || undefined,
            callbackURL: "/orders/payment-callback",
            addressId: selectedAddressId,
            addressPayload,
            gateway,
            mobile: data.phoneNumber?.replace(/\D/g, ""),
            discountCode: discountCode || localStorage.getItem("discountCode") || undefined,
            reserveShipping: reserveShipping || undefined,
          };

      const cartResponse = await CartService.finalizeCart(finalizeData as any);

      if (!cartResponse.success) {
        console.error("❌ Cart finalization failed:", cartResponse);

        // Extract detailed error information from response
        const errorCode = (cartResponse as any).errorCode;
        const errorMessage = (cartResponse as any).message || cartResponse.message;
        const errorDetails = (cartResponse as any).details;

        // Map error codes to user-friendly messages
        let displayError = "خطا در ثبت سفارش. لطفا مجددا تلاش کنید.";

        if (errorCode) {
          trackCheckoutError(String(errorCode));
          switch (errorCode) {
            case "CART_EMPTY":
              displayError = "سبد خرید شما خالی است";
              break;
            case "INVALID_ITEM":
              displayError =
                "برخی از کالاهای سبد خرید معتبر نیستند. لطفاً سبد خرید خود را بررسی کنید";
              break;
            case "MISSING_PRODUCT_TITLE":
            case "MISSING_PRODUCT_SKU":
              displayError = "اطلاعات برخی از کالاها ناقص است. لطفاً با پشتیبانی تماس بگیرید";
              break;
            case "INVALID_PRICE":
              displayError =
                "قیمت برخی از کالاها نامعتبر است. لطفاً سبد خرید خود را بروزرسانی کنید";
              break;
            case "ORDER_ITEM_CREATION_FAILED":
              displayError = "خطا در ثبت اقلام سفارش. لطفاً مجدداً تلاش کنید";
              break;
            case "CONTRACT_CREATION_FAILED":
              displayError = "خطا در ایجاد قرارداد. لطفاً مجدداً تلاش کنید";
              break;
            case "INVALID_AMOUNT":
              displayError = "مبلغ سفارش نامعتبر است";
              break;
            case "SHIPPING_REQUIRED":
              displayError = "لطفاً روش ارسال را انتخاب کنید";
              break;
            case "ADDRESS_REQUIRED":
              displayError = "لطفاً آدرس تحویل را انتخاب کنید";
              break;
            case "INVALID_SHIPPING":
              displayError = "روش ارسال انتخاب شده معتبر نیست";
              break;
            case "ADDRESS_NOT_FOUND":
              displayError = "آدرس انتخاب شده یافت نشد. لطفاً آدرس دیگری انتخاب کنید";
              break;
            case "RESERVE_NOT_FOUND":
              displayError = "سفارش رزروی معتبر یافت نشد یا منقضی شده است. لطفاً سفارش جدید ثبت کنید.";
              break;
            default:
              // Use backend message translated to Persian (never show raw)
              if (errorMessage && typeof errorMessage === "string") {
                displayError = translateErrorMessage(
                  errorMessage,
                  "خطا در ثبت سفارش. لطفا مجددا تلاش کنید.",
                );
              }
          }
        } else if (errorMessage && typeof errorMessage === "string") {
          trackCheckoutError("BACKEND_MESSAGE");
          displayError = translateErrorMessage(
            errorMessage,
            "خطا در ثبت سفارش. لطفا مجددا تلاش کنید.",
          );
        } else {
          trackCheckoutError("FINALIZE_FAILED");
        }

        // Log error details for debugging
        if (process.env.NODE_ENV === "development" && errorDetails) {
          console.error("Error details:", errorDetails);
        }

        setError(displayError);
        return;
      }

      setOrderId(cartResponse.orderId);
      setOrderNumber(cartResponse.orderId.toString());

      if (cartResponse.redirectUrl && cartResponse.redirectUrl.trim() !== "") {
        trackMatomoEvent({
          category: "checkout",
          action: "payment_redirect",
          name: gateway,
          value: totalPrice,
        });
        toast.success("در حال انتقال به درگاه پرداخت...");
        localStorage.setItem("pendingOrderId", cartResponse.orderId.toString());
        localStorage.setItem("pendingRefId", cartResponse.refId || "");

        // Handle different gateway redirect methods
        if (gateway === "mellat" && cartResponse.refId) {
          // Mellat requires POST with RefId (similar to wallet topup flow)
          const form = document.createElement("form");
          form.method = "POST";
          form.action = cartResponse.redirectUrl;
          form.style.display = "none";
          const input = document.createElement("input");
          input.type = "hidden";
          input.name = "RefId";
          input.value = String(cartResponse.refId);
          form.appendChild(input);
          document.body.appendChild(form);
          form.submit();
        } else if (gateway === "snappay" || gateway === "samankish") {
          // SnappPay and Samankish use GET redirect with token in URL
          window.location.href = cartResponse.redirectUrl!;
        } else if (gateway === "wallet") {
          trackMatomoEvent({
            category: "checkout",
            action: "payment_completed",
            name: "wallet",
            value: totalPrice,
          });
          // Wallet flow returns no redirect; just move to success
          await clearCartSafely();
          setSubmitOrderStep(SubmitOrderStep.Success);
          router.push("/orders/success");
        }
      } else {
        trackMatomoEvent({
          category: "checkout",
          action: "payment_completed",
          name: "direct",
          value: totalPrice,
        });
        await clearCartSafely();
        setSubmitOrderStep(SubmitOrderStep.Success);
        router.push("/orders/success");
      }
    } catch (err: any) {
      const errorMsg = err instanceof Error ? err.message : JSON.stringify(err);
      console.error("Error creating order:", errorMsg, err);

      // Extract error information from the error object
      let displayError = "خطا در ثبت سفارش. لطفا مجددا تلاش کنید.";

      // Check if error response has structured data
      if (err.response?.data) {
        const responseData = err.response.data;
        const errorCode = responseData.errorCode;
        const errorMessage = responseData.message;

        if (errorCode) {
          trackCheckoutError(String(errorCode));
          switch (errorCode) {
            case "CART_EMPTY":
              displayError = "سبد خرید شما خالی است";
              break;
            case "SHIPPING_REQUIRED":
              displayError = "لطفاً روش ارسال را انتخاب کنید";
              break;
            case "ADDRESS_REQUIRED":
              displayError = "لطفاً آدرس تحویل را انتخاب کنید";
              break;
            case "INVALID_SHIPPING":
              displayError = "روش ارسال انتخاب شده معتبر نیست";
              break;
            case "ADDRESS_NOT_FOUND":
              displayError = "آدرس انتخاب شده یافت نشد";
              break;
            case "SHIPPING_VALIDATION_FAILED":
              displayError = "خطا در بررسی روش ارسال";
              break;
            case "ADDRESS_VALIDATION_FAILED":
              displayError = "خطا در بررسی آدرس";
              break;
            default:
              if (errorMessage && typeof errorMessage === "string") {
                displayError = translateErrorMessage(
                  errorMessage,
                  "خطا در ثبت سفارش. لطفا مجددا تلاش کنید.",
                );
              }
          }
        } else if (errorMessage && typeof errorMessage === "string") {
          trackCheckoutError("BACKEND_MESSAGE");
          displayError = translateErrorMessage(
            errorMessage,
            "خطا در ثبت سفارش. لطفا مجددا تلاش کنید.",
          );
        }
      } else {
        const normalizedError = err?.message ? String(err.message).toLowerCase() : "";
        trackCheckoutError(normalizedError.includes("network") ? "NETWORK_ERROR" : "UNKNOWN_ERROR");
        displayError = getUserFacingErrorMessage(
          err,
          "خطا در ثبت سفارش. لطفا مجددا تلاش کنید.",
        );
      }

      setError(displayError);
    } finally {
      submitInProgressRef.current = false;
      setIsSubmitting(false);
    }
  };

  const requiredAmountIrr = totalToman * 10;
  const submitOrderStep = useAtomValue(submitOrderStepAtom);

  useEffect(() => {
    if (!currentUser || totalItems <= 0 || totalPrice <= 0) return;
    trackFunnelStep("begin_checkout", {
      value: totalPrice,
      onceKey: `begin-checkout:${Math.round(totalPrice)}:${totalItems}`,
    });
  }, [currentUser, totalItems, totalPrice]);

  useEffect(() => {
    if (!shippingId) return;
    trackMatomoEvent({
      category: "checkout",
      action: "add_shipping_info",
      name: String(shippingId),
      value: shippingCost || 0,
      onceKey: `shipping-info:${shippingId}:${addressId || "new"}`,
    });
  }, [shippingId, shippingCost, addressId]);

  useEffect(() => {
    if (!gateway) return;
    trackMatomoEvent({
      category: "checkout",
      action: "add_payment_info",
      name: gateway,
      onceKey: `payment-info:${gateway}:${shippingId || "none"}`,
    });
  }, [gateway, shippingId]);

  const isMergeMode = mergeChoice === "merge";

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <span className="text-lg text-neutral-800 lg:text-3xl">اطلاعات صورت حساب</span>
      {/* <CheckoutProgress
        currentStep={submitOrderStep}
        steps={["Information", "Delivery", "Payment"]}
      /> */}
      {error && <div className="rounded-lg bg-red-50 p-3 text-red-600">{error}</div>}

      {activeReserve && mergeChoice === null && (
        <div className="rounded-lg border border-infinity-primary-lighter/60 bg-infinity-primary-lighter/50 p-4">
          <p className="mb-3 text-sm font-medium text-neutral-800">
            شما یک سفارش رزروی فعال دارید ({activeReserve.orderCount} سفارش). آیا می‌خواهید به آن
            اضافه کنید؟
          </p>
          <div className="flex gap-2">
            <button
              type="button"
              disabled={isSubmitting}
              onClick={() => {
                if (isSubmitting) return;
                setMergeChoice("merge");
              }}
              className="rounded-lg bg-infinity-primary px-4 py-2 text-sm font-medium text-white transition hover:bg-infinity-primary-dark disabled:cursor-not-allowed disabled:opacity-50"
            >
              اضافه به سفارش رزروی (بدون هزینه ارسال)
            </button>
            <button
              type="button"
              disabled={isSubmitting}
              onClick={() => {
                if (isSubmitting) return;
                setMergeChoice("new");
              }}
              className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              ثبت سفارش جدید
            </button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <ShoppingCartBillInformationForm
          register={register}
          errors={errors}
          control={control}
          setValue={setValue}
        />

        <div className="mb-20 flex flex-col gap-6">
          {isMergeMode ? (
            <div className="rounded-2xl bg-stone-50 p-5">
              <p className="text-neutral-800">
                اقلام فعلی به سفارش رزروی شما اضافه می‌شوند. هزینه ارسال از قبل پرداخت شده است.
              </p>
              <p className="mt-2 text-lg font-medium text-infinity-primary">
                قابل پرداخت:{" "}
                {Math.max(0, totalPrice - (discountPreview?.discount ?? 0)).toLocaleString()} تومان
              </p>
            </div>
          ) : (
            <>
              <ShoppingCartBillDeliveryForm
                control={control}
                setValue={setValue}
                selectedShipping={watchShippingMethod}
                discountPreview={discountPreview}
              />
              {(mergeChoice === "new" || !activeReserve) && (
                <ReserveShipping checked={reserveShipping} onChange={setReserveShipping} />
              )}
            </>
          )}
          <ShoppingCartBillDiscountCoupon
            shippingId={watchShippingMethod ? Number(watchShippingMethod.id) : undefined}
            shippingCost={
              watchShippingMethod ? Number(watchShippingMethod.attributes?.Price || 0) : undefined
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
            availableGateways={availableGateways}
            snappEligible={snappEligible}
            snappTitle={snappTitle}
            snappDescription={snappDescription}
            walletBalanceIrr={walletBalanceIrr}
            requiredAmountIrr={requiredAmountIrr}
          />
          <button
            type="submit"
            disabled={isSubmitting}
            className={
              "text-xl w-full text-nowrap rounded-lg bg-infinity-primary py-3 text-white lg:text-base lg:py-4 " +
              (isSubmitting ? "cursor-not-allowed opacity-70" : "")
            }
          >
            {isSubmitting ? "در حال پردازش..." : "پرداخت"}
          </button>
        </div>
      </div>
    </form>
  );
}

export default ShoppingCartBillForm;
