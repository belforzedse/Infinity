import React from "react";
import CustomRadioGroup from "./CustomRadioGroup";
import { ShippingMethod } from "@/services/shipping";
import { Controller, Control, UseFormSetValue } from "react-hook-form";
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
  if (shippingMethods.length === 0) {
    return (
      <div className="text-gray-500 p-4 text-center">
        در حال حاضر هیچ روش ارسالی موجود نیست
      </div>
    );
  }

  // Map shipping methods to radio options
  const deliveryOptions = shippingMethods.map((method) => ({
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
              const selected = shippingMethods.find(
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
