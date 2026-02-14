import React, { useState } from "react";
import Image from "next/image";
import classNames from "classnames";
import {
  DEFAULT_CHECKOUT_GATEWAYS,
  type CheckoutGatewayCode,
} from "@/services/cart/types/cart";

interface Props {
  selected: CheckoutGatewayCode;
  onChange: (gw: CheckoutGatewayCode) => void;
  /** When omitted, falls back to DEFAULT_CHECKOUT_GATEWAYS. */
  availableGateways?: CheckoutGatewayCode[];
  snappEligible?: boolean;
  snappTitle?: string;
  snappDescription?: string;
  walletBalanceIrr?: number;
  requiredAmountIrr?: number;
}

function ShoppingCartBillPaymentGateway({
  selected,
  onChange,
  availableGateways = DEFAULT_CHECKOUT_GATEWAYS,
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
    ) : !snappEligible ? (
      <div className="text-md font-bold text-neutral-800">اسنپ پی</div>
    ) : undefined;

  const saman = {
    id: "samankish" as const,
    name: "سامان‌کیش",
    img: "/images/cart/samankish.png",
  };

  const mellat = {
    id: "mellat" as const,
    name: "بانک ملت",
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
    disabled: false,
  };

  const showSaman = availableGateways.includes("samankish");
  const showMellat = availableGateways.includes("mellat");
  const showSnappay = availableGateways.includes("snappay") && snappEligible;
  const showWallet = availableGateways.includes("wallet");

  return (
    <div className="flex flex-col gap-4">
      <span className="text-2xl text-neutral-800 lg:text-xl">درگاه پرداخت خود را انتخاب کنید</span>
      {showSnappay && (
        <button
          onClick={() => onChange(snappay.id)}
          className={classNames(
            "flex w-full flex-row items-center justify-between gap-4 rounded-lg border border-stone-50 bg-stone-50 py-4 pr-4 transition-opacity duration-300 lg:gap-6 lg:p-2",
            selected === snappay.id && "!border-pink-600",
          )}
          type="button"
        >
          <div className="relative h-24 w-24 flex-shrink-0 lg:h-36 lg:w-36">
            <Image
              src={snappay.img}
              alt={snappay.name}
              fill
              className="bg-stone-50 object-contain p-3"
              sizes="(min-width: 1024px) 144px, 96px"
            />
          </div>

          <div className="flex flex-1 flex-col items-start gap-2">
            <span className="text-md lg:text-lg">
              {snappay.helper || <span className="font-bold text-neutral-800">{snappay.name}</span>}
            </span>
          </div>
        </button>
      )}

      <div className="flex w-full flex-col gap-2">
        <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
          {showSaman && (
            <button
              onClick={() => onChange(saman.id)}
              className={classNames(
                "flex w-full flex-col items-center gap-2 text-nowrap rounded-lg border border-stone-50 bg-stone-50 p-4",
                selected === saman.id && "!border-pink-600",
              )}
              type="button"
            >
              <div className="relative h-24 w-24 flex-shrink-0 lg:h-32 lg:w-32">
                <Image
                  src={saman.img}
                  alt={saman.name}
                  fill
                  className="bg-stone-50 object-contain p-3"
                  sizes="(min-width: 1024px) 128px, 96px"
                />
              </div>
              <span className="text-sm lg:text-base">درگاه پرداخت {saman.name}</span>
            </button>
          )}

          {showMellat && (
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
          )}

          {showWallet && (
            <button
              onClick={() => !wallet.disabled && onChange(wallet.id)}
              onMouseEnter={() => setWalletHovered(true)}
              onMouseLeave={() => setWalletHovered(false)}
              className={classNames(
                "flex w-full flex-col items-center gap-2 text-nowrap rounded-lg border border-stone-50 bg-stone-50 p-4 transition-opacity duration-300",
                selected === wallet.id && "!border-pink-600",
                wallet.disabled && !walletHovered && "cursor-not-allowed opacity-50",
                wallet.disabled && walletHovered && "cursor-pointer opacity-100",
              )}
              type="button"
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
              <span className="text-sm lg:text-base"> درگاه پرداخت {wallet.name}</span>
              {showWalletDetails && (
                <div className="flex w-full flex-col items-center gap-3 pt-3 text-center">
                  <div className="flex flex-col items-center gap-2">
                    <span className="text-xs text-neutral-600">موجودی:</span>
                    <span className="text-xl font-bold text-pink-500">
                      {(walletBalanceIrr / 10).toLocaleString()} تومان
                    </span>
                  </div>
                  {wallet.helper && <div className="flex w-full justify-center">{wallet.helper}</div>}
                </div>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default ShoppingCartBillPaymentGateway;
