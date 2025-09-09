"use client";

import ChevronLeftIcon from "@/components/Product/Icons/ChevronLeftIcon";
import React, { useEffect, useState } from "react";
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
};

function ShoppingCartBillDeliveryForm({
  control,
  setValue,
  selectedShipping,
}: Props) {
  const { totalPrice } = useCart();
  const [shippingMethods, setShippingMethods] = useState<ShippingMethod[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Calculate total price including shipping
  const shippingCost = selectedShipping?.attributes.Price || 0;
  const finalTotal = totalPrice + shippingCost;

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
    <div className="flex flex-col gap-5 rounded-2xl bg-stone-50 p-5">
      <span className="text-3xl text-neutral-800 lg:text-2xl">
        جمع کل سبد خرید
      </span>

      <div className="flex flex-col items-end justify-between border-b border-slate-200 pb-4 lg:flex-row lg:items-center">
        <span className="text-xl w-full text-neutral-800">مجموع سبد خرید</span>

        <div className="flex items-center gap-2">
          <span className="text-base text-nowrap text-black lg:text-sm">
            {totalPrice.toLocaleString()} تومان
          </span>
          <button className="flex items-center">
            <span className="text-sm text-nowrap text-pink-600 lg:text-xs">
              مشاهده سبد خرید
            </span>
            <ChevronLeftIcon className="h-4 w-4 text-pink-600" />
          </button>
        </div>
      </div>

      <DisclosureItem
        title={<span className="text-xl text-neutral-800">حمل و نقل</span>}
        className="border-b border-slate-200 pb-5"
      >
        {loading ? (
          <div className="flex justify-center p-4">
            <div className="h-6 w-6 animate-spin rounded-full border-b-2 border-t-2 border-pink-500"></div>
          </div>
        ) : error ? (
          <div className="p-2 text-red-500">{error}</div>
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

      <div className="flex items-center justify-between">
        <span className="text-lg text-neutral-800 lg:text-xl">قابل پرداخت</span>
        <span className="text-2xl text-pink-600">
          {finalTotal.toLocaleString()} تومان
        </span>
      </div>

      {shippingCost > 0 && (
        <div className="text-xs text-left text-gray-500">
          * شامل {shippingCost.toLocaleString()} تومان هزینه ارسال
        </div>
      )}
    </div>
  );
}

export default ShoppingCartBillDeliveryForm;
