import React from "react";
import Image from "next/image";
import classNames from "classnames";

interface Props {
  selected: "mellat" | "snappay" | "wallet";
  onChange: (gw: "mellat" | "snappay" | "wallet") => void;
  snappEligible?: boolean;
  snappMessage?: string;
  walletBalanceIrr?: number;
  requiredAmountIrr?: number;
}

function ShoppingCartBillPaymentGateway({
  selected,
  onChange,
  snappEligible = true,
  snappMessage,
  walletBalanceIrr = 0,
  requiredAmountIrr = 0,
}: Props) {
  const walletDisabled =
    walletBalanceIrr < requiredAmountIrr || requiredAmountIrr <= 0;
  const paymentGateways: Array<{
    id: "mellat" | "snappay" | "wallet";
    name: string;
    img: string;
    disabled?: boolean;
    helper?: string | React.JSX.Element;
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
    {
      id: "wallet",
      name: "کیف پول",
      img: "/images/cart/wallet.svg",
      disabled: walletDisabled,
      helper: walletDisabled ? (
        <span>
          موجودی کافی نیست.{" "}
          <a href="/wallet" className="underline">
            شارژ کیف پول
          </a>
        </span>
      ) : undefined,
    },
  ];

  return (
    <div className="flex flex-col gap-4">
      <span className="text-neutral-800 lg:text-xl text-2xl">
        درگاه پرداخت خود را انتخاب کنید
      </span>

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

            <span className="text-neutral-600 lg:text-xs text-sm">
              {pg.name} درگاه پرداخت
            </span>
            {pg.id === "wallet" && (
              <span className="text-[10px] text-neutral-600">
                موجودی: {(walletBalanceIrr / 10).toLocaleString()} تومان
              </span>
            )}
            {pg.helper && (
              <span className="text-[10px] text-amber-700 text-center leading-4">
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
