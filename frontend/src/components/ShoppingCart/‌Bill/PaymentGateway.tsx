import React from "react";
import Image from "next/image";
import classNames from "classnames";

interface Props {
  selected: "mellat" | "snappay";
  onChange: (gw: "mellat" | "snappay") => void;
  snappEligible?: boolean;
  snappMessage?: string;
}

function ShoppingCartBillPaymentGateway({ selected, onChange, snappEligible = true, snappMessage }: Props) {
  const paymentGateways: Array<{ id: "mellat" | "snappay"; name: string; img: string; disabled?: boolean; helper?: string }> = [
    {
      id: "mellat",
      name: "ملت",
      img: "/images/cart/melat.png",
    },
    {
      id: "snappay",
      name: "اسنپ پی (اقساطی)",
      img: "/images/cart/snappay.png",
      disabled: !snappEligible,
      helper: snappMessage,
    },
  ];

  return (
    <div className="flex flex-col gap-4">
      <span className="text-neutral-800 lg:text-xl text-2xl">درگاه پرداخت خود را انتخاب کنید</span>

      <div className="flex items-center gap-2">
        {paymentGateways.map((pg) => (
          <button
            key={pg.id}
            onClick={() => !pg.disabled && onChange(pg.id)}
            className={classNames(
              "bg-stone-50 p-4 rounded-lg text-nowrap w-full border border-stone-50 flex items-center flex-col gap-2",
              selected === pg.id && "!border-pink-600",
              pg.disabled && "opacity-50 cursor-not-allowed"
            )}
            type="button"
          >
            <div className="w-16 h-16 relative">
              <Image src={pg.img} alt={pg.name} fill className="object-cover" />
            </div>

            <span className="text-neutral-600 lg:text-xs text-sm">{pg.name} درگاه پرداخت</span>
            {pg.helper && (
              <span className="text-[10px] text-amber-700 text-center leading-4">{pg.helper}</span>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}

export default ShoppingCartBillPaymentGateway;
