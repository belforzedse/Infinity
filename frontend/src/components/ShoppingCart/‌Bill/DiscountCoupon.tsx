import DisclosureItem from "@/components/Kits/Disclosure";
import Input from "@/components/Kits/Form/Input";
import GiftIcon from "@/components/ShoppingCart/Icons/GiftIcon";
import React, { useState } from "react";
import { CartService } from "@/services";
import toast from "react-hot-toast";

type DiscountSummary = {
  subtotal: number;
  eligibleSubtotal: number;
  tax: number;
  shipping: number;
  total: number;
  taxPercent: number;
};

type Props = {
  onApplied?: (code: string, preview: { discount: number; summary: DiscountSummary }) => void;
  shippingId?: number;
  shippingCost?: number;
  appliedCode?: string;
  onRemove?: () => void;
};

function ShoppingCartBillDiscountCoupon({
  onApplied,
  shippingId,
  shippingCost,
  appliedCode,
  onRemove,
}: Props) {
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);

  const handleApply = async () => {
    if (!code.trim()) {
      toast.error("لطفا کد تخفیف را وارد کنید");
      return;
    }
    try {
      setLoading(true);
      const res = await CartService.applyDiscount({
        code: code.trim(),
        shippingId,
        shippingCost,
      });
      if (res?.success) {
        toast.success("کد تخفیف اعمال شد");
        onApplied?.(code.trim(), {
          discount: res.discount,
          summary: res.summary,
        });
      } else {
        toast.error("کد تخفیف نامعتبر است");
      }
    } catch (e: any) {
      toast.error(e?.message || "کد تخفیف نامعتبر است");
    } finally {
      setLoading(false);
    }
  };

  const handleRemove = () => {
    try {
      onRemove?.();
      setCode("");
    } catch {}
  };

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
      {appliedCode ? (
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="text-sm text-neutral-600">کد فعال:</span>
            <span className="text-sm font-medium text-neutral-800">{appliedCode}</span>
          </div>
          <button
            type="button"
            onClick={handleRemove}
            className="text-sm rounded-lg bg-slate-100 px-4 py-2 text-neutral-700 hover:bg-slate-200"
          >
            حذف کد
          </button>
        </div>
      ) : (
        <div className="flex items-center gap-2">
          <button
            type="button"
            disabled={loading}
            onClick={handleApply}
            className={`text-base h-9 text-nowrap rounded-lg bg-pink-500 px-6 text-white lg:h-[50px] ${
              loading ? "cursor-not-allowed opacity-70" : ""
            }`}
          >
            {loading ? "در حال بررسی..." : "اعمال کد"}
          </button>
          <Input
            className="rounded-full"
            name="discountCode"
            placeholder="کد تخفیف را وارد نمایید"
            value={code}
            onChange={(e: any) => setCode(e.target.value)}
          />
        </div>
      )}
    </DisclosureItem>
  );
}

export default ShoppingCartBillDiscountCoupon;
