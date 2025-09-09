"use client";
import React, { useState } from "react";
import { priceFormatter } from "@/utils/price";
import { PREDEFINED_INCREASE_BALANCE_AMOUNTS } from "../Constnats";
import LeftUpArrowIcon from "../Icons/LeftUpArrowIcon";

const IncreaseBalance = () => {
  const [increaseAmount, setIncreaseAmount] = useState(50000);

  const handleAmountSelect = (amount: number) => {
    setIncreaseAmount(amount);
  };

  return (
    <div className="flex w-full flex-col items-end gap-4 lg:w-3/5">
      <div className="h-fit w-full rounded-xl bg-slate-100 p-5">
        <span className="text-2xl text-foreground-primary lg:text-4xl">
          شارژ سریع کیف پول
        </span>

        <div className="mb-2 mt-4 flex h-14 w-full items-center justify-center rounded-lg border border-slate-100 bg-white">
          <span className="text-lg text-slate-800 lg:text-3xl">
            {priceFormatter(Number(increaseAmount))} تومان
          </span>
        </div>

        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3 lg:gap-3">
          {PREDEFINED_INCREASE_BALANCE_AMOUNTS.map((amount) => (
            <button
              key={amount}
              onClick={() => handleAmountSelect(amount)}
              className={`rounded-lg border bg-white px-3 py-2 ${
                increaseAmount === amount
                  ? "text-lg border-blue-500 text-blue-500 lg:text-xl"
                  : "border border-slate-100 text-slate-400 hover:border-blue-500 hover:text-blue-500"
              } text-center transition-all duration-200`}
            >
              {priceFormatter(amount)} تومان
            </button>
          ))}
        </div>
      </div>

      <button className="flex w-full items-center justify-center gap-1 rounded-lg bg-pink-500 px-10 py-3 text-white lg:w-fit">
        <span>پرداخت آنلاین</span>
        <LeftUpArrowIcon />
      </button>
    </div>
  );
};

export default IncreaseBalance;
