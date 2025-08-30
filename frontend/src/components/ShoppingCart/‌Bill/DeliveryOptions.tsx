import React from "react";
import CustomRadioGroup from "./CustomRadioGroup";
import { ShippingMethod } from "@/services/shipping";
import {
  Controller,
  Control,
  UseFormSetValue,
  useWatch,
} from "react-hook-form";
import { FormData } from "./index";

interface Props {
  shippingMethods: ShippingMethod[];
  selectedShipping: ShippingMethod | null;
  setValue: UseFormSetValue<FormData>;
  control: Control<FormData>;
}

const ShoppingCartBillDeliveryOptions: React.FC<Props> = ({
  shippingMethods,
  selectedShipping,
  control,
}) => {
  // Watch the selected address to get province and city info
  const selectedAddress = useWatch({ control, name: "address" });

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
      // Only show "پیک" delivery option
      return shippingMethods.filter((method) =>
        method.attributes.Title.includes("پیک")
      );
    }

    return shippingMethods;
  };

  const filteredShippingMethods = getFilteredShippingMethods();

  if (filteredShippingMethods.length === 0) {
    return (
      <div className="text-gray-500 p-4 text-center">
        در حال حاضر هیچ روش ارسالی موجود نیست
      </div>
    );
  }

  // Map filtered shipping methods to radio options
  const deliveryOptions = filteredShippingMethods.map((method) => ({
    id: method.id.toString(),
    value: method.id.toString(),
    method: method,
    content: (
      <div className="flex justify-between items-center w-full">
        <span className="text-neutral-800 lg:text-base text-sm">
          {method.attributes.Title}
        </span>
        <span className="text-black lg:text-base text-sm">
          {method.attributes.Price === 0
            ? "رایگان"
            : `${method.attributes.Price.toLocaleString()} تومان`}
        </span>
      </div>
    ),
  }));

  return (
    <div dir="rtl">
      <Controller
        control={control}
        name="shippingMethod"
        render={({ field }) => (
          <CustomRadioGroup
            options={deliveryOptions}
            value={field.value?.id.toString() || ""}
            name="delivery-method"
            onChange={(selectedValue) => {
              const selected = filteredShippingMethods.find(
                (method) => method.id.toString() === selectedValue
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
