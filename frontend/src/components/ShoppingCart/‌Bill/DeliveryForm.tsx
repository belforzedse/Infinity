"use client";

import ChevronLeftIcon from "@/components/Product/Icons/ChevronLeftIcon";
import React, { useEffect, useState } from "react";
import { useAtom } from "jotai";
import { submitOrderStepAtom } from "@/atoms/Order";
import { SubmitOrderStep } from "@/types/Order";
import DisclosureItem from "@/components/Kits/Disclosure";
import ShoppingCartBillDeliveryOptions from "./DeliveryOptions";
import { useCart } from "@/contexts/CartContext";
import { getShippingMethods, ShippingMethod } from "@/services/shipping";
import { Control, UseFormSetValue } from "react-hook-form";
import { FormData } from "./index";

type Props = {
  control: Control<FormData>;
  setValue: UseFormSetValue<FormData>;
  selectedShipping: ShippingMethod | null;
  discountPreview?: {
    discount: number;
    summary: {
      subtotal: number;
      eligibleSubtotal: number;
      tax: number;
      shipping: number;
      total: number;
      taxPercent: number;
    };
  };
};

function ShoppingCartBillDeliveryForm({
  control,
  setValue,
  selectedShipping,
  discountPreview,
}: Props) {
  const { totalPrice } = useCart();
  const [_, setSubmitOrderStep] = useAtom(submitOrderStepAtom);
  const [shippingMethods, setShippingMethods] = useState<ShippingMethod[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Calculate totals (prefer backend preview when available)
  const shippingCost = selectedShipping?.attributes.Price || 0;
  const subtotal = discountPreview?.summary?.subtotal ?? totalPrice;
  const discountAmount = discountPreview?.discount ?? 0;
  const taxAmount = discountPreview?.summary?.tax ?? 0;
  const effectiveShipping = discountPreview?.summary?.shipping ?? shippingCost;
  const finalTotal = discountPreview?.summary?.total ?? subtotal - discountAmount + taxAmount + effectiveShipping;

  useEffect(() => {
    const fetchShippingMethods = async () => {
      try {
        setLoading(true);
        setError(null);
        const methods = await getShippingMethods({
          isActive: true,
          sort: "Price:asc",
        });
        setShippingMethods(methods);

        // Set the first shipping method as default if there are any methods and none is selected
        if (methods.length > 0 && !selectedShipping) {
          setValue("shippingMethod", methods[0]);
        }
      } catch (err) {
        console.error("Failed to fetch shipping methods:", err);
        setError("خطا در دریافت روش‌های ارسال");
      } finally {
        setLoading(false);
      }
    };

    fetchShippingMethods();
  }, [setValue, selectedShipping]);

  return (
    <div className="bg-stone-50 rounded-2xl p-5 flex flex-col gap-5">
      <span className="text-neutral-800 lg:text-2xl text-3xl">
        جمع کل سبد خرید
      </span>

      <div className="flex lg:flex-row flex-col justify-between lg:items-center items-end border-b border-slate-200 pb-4">
        <span className="text-neutral-800 text-xl w-full">مجموع سبد خرید</span>

        <div className="flex items-center gap-2">
          <span className="lg:text-sm text-base text-black text-nowrap">
            {totalPrice.toLocaleString()} تومان
          </span>
          <button
            type="button"
            className="flex items-center"
            onClick={() => setSubmitOrderStep(SubmitOrderStep.Table)}
          >
            <span className="text-pink-600 lg:text-xs text-sm text-nowrap">
              مشاهده سبد خرید
            </span>
            <ChevronLeftIcon className="w-4 h-4 text-pink-600" />
          </button>
        </div>
      </div>

      <DisclosureItem
        title={<span className="text-neutral-800 text-xl">حمل و نقل</span>}
        className="border-b border-slate-200 pb-5"
      >
        {loading ? (
          <div className="flex justify-center p-4">
            <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-pink-500"></div>
          </div>
        ) : error ? (
          <div className="text-red-500 p-2">{error}</div>
        ) : (
          <ShoppingCartBillDeliveryOptions
            shippingMethods={shippingMethods}
            selectedShipping={selectedShipping}
            setValue={setValue}
            control={control}
          />
        )}
      </DisclosureItem>

      {/* <DisclosureItem
        title={
          <span className="text-neutral-800 text-xl">انتخاب زمان ارسال</span>
        }
        className="border-b border-slate-200 pb-5"
      >
        <ShoppingCartBillDeliveryTime />
      </DisclosureItem> */}

      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <span className="text-neutral-600 lg:text-base text-sm">جمع جزء</span>
          <span className="text-neutral-800 lg:text-base text-sm">
            {subtotal.toLocaleString()} تومان
          </span>
        </div>

        {discountAmount > 0 && (
          <div className="flex justify-between items-center">
            <span className="text-neutral-600 lg:text-base text-sm">تخفیف</span>
            <span className="text-green-600 lg:text-base text-sm">
              {`-${discountAmount.toLocaleString()} تومان`}
            </span>
          </div>
        )}

        <div className="flex justify-between items-center">
          <span className="text-neutral-600 lg:text-base text-sm">مالیات</span>
          <span className="text-neutral-800 lg:text-base text-sm">
            {taxAmount.toLocaleString()} تومان
          </span>
        </div>

        <div className="flex justify-between items-center">
          <span className="text-neutral-600 lg:text-base text-sm">هزینه ارسال</span>
          <span className="text-neutral-800 lg:text-base text-sm">
            {effectiveShipping.toLocaleString()} تومان
          </span>
        </div>

        <div className="flex justify-between items-center pt-2">
          <span className="text-neutral-800 lg:text-xl text-lg">قابل پرداخت</span>
          <span className="text-pink-600 text-2xl">
            {finalTotal.toLocaleString()} تومان
          </span>
        </div>

        {effectiveShipping > 0 && (
          <div className="text-gray-500 text-xs text-left">
            * شامل {effectiveShipping.toLocaleString()} تومان هزینه ارسال
          </div>
        )}
      </div>
    </div>
  );
}

export default ShoppingCartBillDeliveryForm;
