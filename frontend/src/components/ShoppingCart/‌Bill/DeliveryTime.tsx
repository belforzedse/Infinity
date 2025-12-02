import React, { useState } from "react";
import CustomRadioGroup from "./CustomRadioGroup";

const ShoppingCartBillDeliveryTime: React.FC = () => {
  const [selectedDeliveryTimeOption, setSelectedDeliveryTimeOption] = useState("pishtaz");

  const deliveryOptions = [
    {
      id: "1",
      value: "2022-12-12",
      content: (
        <div className="flex w-full items-center justify-between">
          <span className="text-sm text-neutral-800 lg:text-base">
            24 دی ماه - شنبه ساعت 12 الی 18
          </span>
        </div>
      ),
    },
    {
      id: "2",
      value: "2023-02-14",
      content: (
        <div className="flex w-full items-center justify-between">
          <span className="text-sm text-neutral-800 lg:text-base">
            25 دی ماه - یکشنبه ساعت 12 الی 18
          </span>
        </div>
      ),
    },
  ];

  return (
    <div dir="rtl">
      <CustomRadioGroup
        options={deliveryOptions}
        value={selectedDeliveryTimeOption}
        name="delivery-time"
        onChange={setSelectedDeliveryTimeOption}
      />
    </div>
  );
};

export default ShoppingCartBillDeliveryTime;
