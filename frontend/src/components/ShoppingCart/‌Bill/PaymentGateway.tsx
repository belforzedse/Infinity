import React from "react";
import Image from "next/image";
import classNames from "classnames";

interface Props {
  selected: "mellat" | "snappay";
  onChange: (gw: "mellat" | "snappay") => void;
  snappEligible?: boolean;
  snappMessage?: string;
}

function ShoppingCartBillPaymentGateway({
  selected,
  onChange,
  snappEligible = true,
  snappMessage,
}: Props) {
  const paymentGateways: Array<{
    id: "mellat" | "snappay";
    name: string;
    img: string;
    disabled?: boolean;
    helper?: string;
  }> = [
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
      <span className="text-2xl text-neutral-800 lg:text-xl">
        درگاه پرداخت خود را انتخاب کنید
      </span>

      <div className="flex items-center gap-2">
        {paymentGateways.map((pg) => (
          <button
            key={pg.id}
            onClick={() => !pg.disabled && onChange(pg.id)}
            className={classNames(
              "flex w-full flex-col items-center gap-2 text-nowrap rounded-lg border border-stone-50 bg-stone-50 p-4",
              selected === pg.id && "!border-pink-600",
              pg.disabled && "cursor-not-allowed opacity-50",
            )}
            type="button"
          >
            <div className="relative h-16 w-16">
              <Image src={pg.img} alt={pg.name} fill className="object-cover" />
            </div>

            <span className="text-sm text-neutral-600 lg:text-xs">
              {pg.name} درگاه پرداخت
            </span>
            {pg.helper && (
              <span className="text-center text-[10px] leading-4 text-amber-700">
                {pg.helper}
              </span>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}

export default ShoppingCartBillPaymentGateway;
