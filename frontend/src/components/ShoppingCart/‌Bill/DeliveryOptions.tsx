import React from "react";
import CustomRadioGroup from "./CustomRadioGroup";
import { ShippingMethod } from "@/services/shipping";
import { Controller, Control, UseFormSetValue, useWatch } from "react-hook-form";
import { FormData } from "./index";

interface Props {
  shippingMethods: ShippingMethod[];
  setValue: UseFormSetValue<FormData>;
  control: Control<FormData>;
}

const ShoppingCartBillDeliveryOptions: React.FC<Props> = ({ shippingMethods, control }) => {
  // Watch the selected address to get province and city info
  const selectedAddress = useWatch({ control, name: "address" });

  // Check if address is selected to determine if delivery options should be disabled
  const isAddressSelected = selectedAddress && selectedAddress.id && selectedAddress.name;
  // Filter shipping methods based on location
  const getFilteredShippingMethods = () => {
    if (!selectedAddress?.name) {
      return shippingMethods;
    }

    // Extract province and city from address name
    // Format: "Address - City, Province"
    const addressParts = selectedAddress.name.split(" - ");
    if (addressParts.length < 2) {
      return shippingMethods;
    }

    const locationPart = addressParts[addressParts.length - 1]; // "City, Province"
    const [city, province] = locationPart.split(", ");

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

  // Map filtered shipping methods to radio options
  // Map filtered shipping methods to radio options
  const deliveryOptions = filteredShippingMethods.map((method) => ({
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
              const selected = filteredShippingMethods.find(
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
