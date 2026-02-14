import React from "react";
import CustomRadioGroup from "./CustomRadioGroup";
import type { ShippingMethod } from "@/services/shipping";
import type { Control, UseFormSetValue } from "react-hook-form";
import { Controller, useWatch } from "react-hook-form";
import type { FormData } from "./index";

interface Props {
  shippingMethods: ShippingMethod[];
  setValue: UseFormSetValue<FormData>;
  control: Control<FormData>;
}

const ShoppingCartBillDeliveryOptions: React.FC<Props> = ({ shippingMethods, control }) => {
  // Watch the selected address to get province and city info
  const selectedAddress = useWatch({ control, name: "address" });
  const inlineProvince = useWatch({ control, name: "province" });
  const inlineCity = useWatch({ control, name: "city" });

  // Check if address is selected (saved or inline) to determine if delivery options should be disabled
  const hasSavedAddress = selectedAddress && selectedAddress.id && selectedAddress.name;
  const hasInlineAddress = inlineProvince?.name && inlineCity?.name;
  const isAddressSelected = !!(hasSavedAddress || hasInlineAddress);
  // Filter shipping methods based on location
  const getFilteredShippingMethods = () => {
    const cityName = inlineCity?.name;
    const provinceName = inlineProvince?.name;

    // Prefer inline selections; fallback to saved-address name parsing
    let city = cityName;
    let province = provinceName;

    if ((!city || !province) && selectedAddress?.name) {
      const addressParts = selectedAddress.name.split(" - ");
      if (addressParts.length >= 2) {
        const locationPart = addressParts[addressParts.length - 1]; // "City, Province"
        const [parsedCity, parsedProvince] = locationPart.split(", ");
        city = city || parsedCity;
        province = province || parsedProvince;
      }
    }

    // Check if province is "گلستان" and city is "گرگان"
    if (province?.trim() === "گلستان" && city?.trim() === "گرگان") {
      // Show "پیک" delivery option and in-person pickup option
      return shippingMethods.filter(
        (method) =>
          method.attributes.Title.includes("پیک") || method.attributes.Title.includes("حضوری"),
      );
    }

    // Otherwise show common courier options
    return shippingMethods.filter(
      (method) =>
        method.attributes.Title.includes("تیپاکس") || method.attributes.Title.includes("پست"),
    );
  };

  const filteredShippingMethods = getFilteredShippingMethods();

  if (filteredShippingMethods.length === 0) {
    return (
      <div className="p-4 text-center text-gray-500">در حال حاضر هیچ روش ارسالی موجود نیست</div>
    );
  }

  // Sort shipping methods: "ارسال با پیک" should be at the top
  const sortedShippingMethods = [...filteredShippingMethods].sort((a, b) => {
    const aTitle = a.attributes.Title || "";
    const bTitle = b.attributes.Title || "";
    const aHasPik = aTitle.includes("پیک");
    const bHasPik = bTitle.includes("پیک");

    // If one has "پیک" and the other doesn't, prioritize the one with "پیک"
    if (aHasPik && !bHasPik) return -1;
    if (!aHasPik && bHasPik) return 1;
    // If both have or both don't have "پیک", maintain original order
    return 0;
  });

  // Map filtered shipping methods to radio options
  // Map filtered shipping methods to radio options
  const deliveryOptions = sortedShippingMethods.map((method) => ({
    id: method.id.toString(),
    value: method.id.toString(),
    method: method,
    content: (
      <div className="flex w-full items-center justify-between">
        <span className="text-sm text-neutral-800 lg:text-base">{method.attributes.Title}</span>
        <span className="text-sm text-black lg:text-base">
          {method.attributes.Price === 0
            ? "رایگان"
            : `${method.attributes.Price.toLocaleString()} تومان (تقریبی)`}
        </span>
      </div>
    ),
  }));

  return (
    <div dir="rtl">
      {!isAddressSelected && (
        <div className="text-sm mb-3 rounded-lg bg-amber-50 p-2 text-center text-amber-600">
          ابتدا آدرس تحویل را انتخاب کنید
        </div>
      )}
      <Controller
        control={control}
        name="shippingMethod"
        render={({ field }) => (
          <CustomRadioGroup
            options={deliveryOptions}
            value={field.value?.id.toString() || ""}
            name="delivery-method"
            disabled={!isAddressSelected}
            onChange={(selectedValue) => {
              const selected = sortedShippingMethods.find(
                (method) => method.id.toString() === selectedValue,
              );
              if (selected) {
                field.onChange(selected);
              }
            }}
          />
        )}
      />
    </div>
  );
};

export default ShoppingCartBillDeliveryOptions;
