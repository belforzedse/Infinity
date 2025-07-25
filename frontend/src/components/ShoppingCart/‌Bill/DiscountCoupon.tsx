import DisclosureItem from "@/components/Kits/Disclosure";
import Input from "@/components/Kits/Form/Input";
import GiftIcon from "@/components/ShoppingCart/Icons/GiftIcon";
import React from "react";

type Props = {};

function ShoppingCartBillDiscountCoupon({}: Props) {
  return (
    <DisclosureItem
      title={
        <div className="flex items-center gap-1">
          <GiftIcon className="w-6 h-6" />
          <span className="text-neutral-800 text-xl">کد تخفیف</span>
        </div>
      }
      className="bg-stone-50 rounded-2xl p-5"
    >
      <div className="flex items-center gap-2">
        <button className="text-white bg-pink-500 lg:h-[50px] h-9 px-6 rounded-lg text-nowrap text-base">
          اعمال کد
        </button>
        <Input
          className="rounded-full"
          name="discountCode"
          placeholder="کد تخفیف را وارد نمایید"
        />
      </div>
    </DisclosureItem>
  );
}

export default ShoppingCartBillDiscountCoupon;
