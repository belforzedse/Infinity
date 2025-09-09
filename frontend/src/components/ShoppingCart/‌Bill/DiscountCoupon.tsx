import DisclosureItem from "@/components/Kits/Disclosure";
import Input from "@/components/Kits/Form/Input";
import GiftIcon from "@/components/ShoppingCart/Icons/GiftIcon";
import React from "react";

type Props = object;

function ShoppingCartBillDiscountCoupon({}: Props) {
  return (
    <DisclosureItem
      title={
        <div className="flex items-center gap-1">
          <GiftIcon className="h-6 w-6" />
          <span className="text-xl text-neutral-800">کد تخفیف</span>
        </div>
      }
      className="rounded-2xl bg-stone-50 p-5"
    >
      <div className="flex items-center gap-2">
        <button className="text-base h-9 text-nowrap rounded-lg bg-pink-500 px-6 text-white lg:h-[50px]">
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
