import React from "react";
import Image from "next/image";
import classNames from "classnames";

interface Props {
  selected: "mellat" | "snappay" | "wallet";
  onChange: (gw: "mellat" | "snappay" | "wallet") => void;
  snappEligible?: boolean;
  snappTitle?: string;
  snappDescription?: string;
  walletBalanceIrr?: number;
  requiredAmountIrr?: number;
}

function ShoppingCartBillPaymentGateway({
  selected,
  onChange,
  snappEligible = true,
  snappTitle,
  snappDescription,
  walletBalanceIrr = 0,
  requiredAmountIrr = 0,
}: Props) {
  const walletDisabled = walletBalanceIrr < requiredAmountIrr || requiredAmountIrr <= 0;

  // Build SnappPay helper content with title and description on two lines
  const snappHelper = snappTitle || snappDescription ? (
    <div className="flex flex-col gap-0.5">
      {snappTitle && <div>{snappTitle}</div>}
      {snappDescription && <div>{snappDescription}</div>}
    </div>
  ) : undefined;

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
    // Only include SnappPay if eligible (hide when false, not just disable)
    ...(snappEligible
      ? [
          {
            id: "snappay" as const,
            name: "اسنپ پی (اقساطی)",
            img: "/images/cart/snappay.png",
            helper: snappHelper,
          },
        ]
      : []),
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
      <span className="text-2xl text-neutral-800 lg:text-xl">درگاه پرداخت خود را انتخاب کنید</span>

      <div className="grid w-full grid-cols-2 gap-2">
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
              <Image src={pg.img} alt={pg.name} fill className="object-cover" sizes="64px" />
            </div>

            <span className="text-sm text-neutral-600 lg:text-xs">{pg.name} درگاه پرداخت</span>
            {pg.id === "wallet" && (
              <span className="text-[10px] text-neutral-600">
                موجودی: {(walletBalanceIrr / 10).toLocaleString()} تومان
              </span>
            )}
            {pg.helper && (
              <span className="text-center text-[10px] leading-4 text-amber-700">{pg.helper}</span>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}

export default ShoppingCartBillPaymentGateway;
