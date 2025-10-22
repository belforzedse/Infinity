import React, { useState } from "react";
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
  const [walletHovered, setWalletHovered] = useState(false);
  const walletDisabled = walletBalanceIrr < requiredAmountIrr || requiredAmountIrr <= 0;
  const showWalletDetails = walletHovered || selected === "wallet";

  // Build SnappPay helper content with title and description on two lines
  const snappHelper =
    snappTitle || snappDescription ? (
      <div className="flex flex-col gap-2 text-right">
        {snappTitle && <div className="text-md font-bold text-neutral-800">{snappTitle}</div>}
        {snappDescription && <div className="text-sm text-neutral-600">{snappDescription}</div>}
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
    helper: (
      <a
        href="/wallet"
        className="text-sm inline-block cursor-pointer rounded-md bg-pink-500 px-4 py-2 font-medium text-white transition-colors hover:bg-pink-600"
      >
        شارژ کیف پول
      </a>
    ),
  };

  const snappay = {
    id: "snappay" as const,
    name: "پرداخت اقساطی اسنپ‌پی",
    img: "/images/cart/snappay.svg",
    helper: snappHelper,
  };

  return (
    <div className="flex flex-col gap-4">
      <span className="text-2xl text-neutral-800 lg:text-xl">درگاه پرداخت خود را انتخاب کنید</span>
      {/* Top row: SnappPay spanning full width (only if eligible) */}
      {snappEligible && (
        <button
          onClick={() => onChange(snappay.id)}
          className={classNames(
            "flex w-full flex-row items-center justify-between gap-4 rounded-lg border border-stone-50 bg-stone-50 py-4 pr-4 lg:gap-6 lg:p-2",
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
              className="bg-stone-50 object-contain p-3"
              sizes="(min-width: 1024px) 144px, 96px"
            />
          </div>

          {/* Text content on the left (in RTL, second item appears on left) */}
          <div className="flex flex-1 flex-col items-start gap-2">
            <span className="text-md lg:text-lg">{snappay.helper}</span>
          </div>
        </button>
      )}
      <div className="flex w-full flex-col gap-2">
        {/* Bottom row: Mellat and Wallet side by side */}
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
            <div className="relative h-24 w-24 flex-shrink-0 lg:h-32 lg:w-32">
              <Image
                src={mellat.img}
                alt={mellat.name}
                fill
                className="bg-stone-50 object-contain p-3"
                sizes="(min-width: 1024px) 128px, 96px"
              />
            </div>
            <span className="text-sm lg:text-base">درگاه پرداخت {mellat.name}</span>
          </button>

          {/* Wallet Payment Gateway */}
          <button
            onClick={() => !wallet.disabled && onChange(wallet.id)}
            onMouseEnter={() => setWalletHovered(true)}
            onMouseLeave={() => setWalletHovered(false)}
            className={classNames(
              "relative flex w-full flex-col items-center gap-2 text-nowrap rounded-lg border border-stone-50 bg-stone-50 p-4 transition-opacity duration-300",
              selected === wallet.id && "!border-pink-600",
              wallet.disabled && !walletHovered && "cursor-not-allowed opacity-50",
              wallet.disabled && walletHovered && "cursor-pointer opacity-100",
            )}
            type="button"
          >
            {/* Default view: Logo and name */}
            <div
              className={classNames(
                "absolute inset-0 flex flex-col items-center justify-center gap-2 transition-opacity duration-300 ease-in-out",
                !showWalletDetails
                  ? "pointer-events-auto opacity-100"
                  : "pointer-events-none opacity-0",
              )}
            >
              <div className="relative h-24 w-24 flex-shrink-0 lg:h-32 lg:w-32">
                <Image
                  src={wallet.img}
                  alt={wallet.name}
                  fill
                  className="bg-stone-50 object-contain p-3"
                  sizes="(min-width: 1024px) 128px, 96px"
                />
              </div>
              <span className="text-sm lg:text-base">{wallet.name} درگاه پرداخت</span>
            </div>

            {/* Revealed view: Balance and charge button */}
            <div
              className={classNames(
                "absolute inset-0 flex w-full flex-col items-center justify-center gap-5 overflow-hidden px-3 py-4 transition-opacity duration-300 ease-in-out",
                showWalletDetails
                  ? "pointer-events-auto opacity-100"
                  : "pointer-events-none opacity-0",
              )}
            >
              <div className="flex w-full max-w-full flex-col items-center gap-5">
                <div className="flex flex-col items-center gap-2">
                  <span className="text-xs text-neutral-600">موجودی:</span>
                  <span className="text-xl font-bold text-pink-500">
                    {(walletBalanceIrr / 10).toLocaleString()} تومان
                  </span>
                </div>
                {wallet.helper && <div className="flex w-full justify-center">{wallet.helper}</div>}
              </div>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
}

export default ShoppingCartBillPaymentGateway;
