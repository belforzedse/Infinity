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
  const snappHelper =
    snappTitle || snappDescription ? (
      <div className="flex flex-col gap-0.5 text-right leading-5">
        {snappTitle && <div>{snappTitle}</div>}
        {snappDescription && <div>{snappDescription}</div>}
      </div>
    ) : undefined;

  // Payment gateway configurations
  const mellat = {
    id: "mellat" as const,
    name: "ملت",
    img: "/images/cart/melat.png",
  };

  const wallet = {
    id: "wallet" as const,
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
  };

  const snappay = {
    id: "snappay" as const,
    name: "اسنپ پی (اقساطی)",
    img: "/images/cart/snappay.svg",
    helper: snappHelper,
  };

  return (
    <div className="flex flex-col gap-4">
      <span className="text-2xl text-neutral-800 lg:text-xl">درگاه پرداخت خود را انتخاب کنید</span>

      <div className="flex w-full flex-col gap-2">
        {/* Top row: Mellat and Wallet side by side */}
        <div className="grid grid-cols-2 gap-2">
          {/* Mellat Payment Gateway */}
          <button
            onClick={() => onChange(mellat.id)}
            className={classNames(
              "flex w-full flex-col items-center gap-2 text-nowrap rounded-lg border border-stone-50 bg-stone-50 p-4",
              selected === mellat.id && "!border-pink-600",
            )}
            type="button"
          >
            <div className="relative h-16 w-16">
              <Image
                src={mellat.img}
                alt={mellat.name}
                fill
                className="object-cover"
                sizes="64px"
              />
            </div>
            <span className="text-sm text-neutral-600 lg:text-xs">{mellat.name} درگاه پرداخت</span>
          </button>

          {/* Wallet Payment Gateway */}
          <button
            onClick={() => !wallet.disabled && onChange(wallet.id)}
            className={classNames(
              "flex w-full flex-col items-center gap-2 text-nowrap rounded-lg border border-stone-50 bg-stone-50 p-4",
              selected === wallet.id && "!border-pink-600",
              wallet.disabled && "cursor-not-allowed opacity-50",
            )}
            type="button"
          >
            <div className="relative h-16 w-16">
              <Image
                src={wallet.img}
                alt={wallet.name}
                fill
                className="object-cover"
                sizes="64px"
              />
            </div>
            <span className="text-sm text-neutral-600 lg:text-xs">{wallet.name} درگاه پرداخت</span>
            <span className="text-[10px] text-neutral-600">
              موجودی: {(walletBalanceIrr / 10).toLocaleString()} تومان
            </span>
            {wallet.helper && (
              <span className="text-center text-[10px] leading-4 text-amber-700">
                {wallet.helper}
              </span>
            )}
          </button>
        </div>

        {/* Bottom row: SnappPay spanning full width (only if eligible) */}
        {snappEligible && (
          <button
            onClick={() => onChange(snappay.id)}
            className={classNames(
              "flex w-full flex-row items-center justify-between gap-4 rounded-lg border border-stone-50 bg-stone-50 p-6 lg:gap-6 lg:p-2",
              selected === snappay.id && "!border-pink-600",
            )}
            type="button"
          >
            {/* Logo on the right (in RTL, first item appears on right) */}
            <div className="relative h-24 w-24 flex-shrink-0 lg:h-36 lg:w-36">
              <Image
                src={snappay.img}
                alt={snappay.name}
                fill
                className="bg-stone-50 object-contain"
                sizes="(min-width: 1024px) 144px, 96px"
              />
            </div>

            {/* Text content on the left (in RTL, second item appears on left) */}
            <div className="flex flex-1 flex-col items-start gap-2">
              <span className="text-base text-neutral-800 lg:text-lg">{snappay.name}</span>
              {snappay.helper && (
                <div className="text-xs text-right leading-5 text-amber-700 lg:text-sm">
                  {snappay.helper}
                </div>
              )}
            </div>
          </button>
        )}
      </div>
    </div>
  );
}

export default ShoppingCartBillPaymentGateway;
