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
    <div className="w-full lg:w-3/5 flex flex-col items-end gap-4">
      <div className="w-full p-5 bg-slate-100 rounded-xl h-fit">
        <span className="text-2xl lg:text-4xl text-foreground-primary">
          شارژ سریع کیف پول
        </span>

        <div className="mb-2 mt-4 w-full bg-white border border-slate-100 rounded-lg h-14 flex justify-center items-center">
          <span className="text-slate-800 text-lg lg:text-3xl">
            {priceFormatter(Number(increaseAmount))} تومان
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 lg:gap-3 gap-2">
          {PREDEFINED_INCREASE_BALANCE_AMOUNTS.map((amount) => (
            <button
              key={amount}
              onClick={() => handleAmountSelect(amount)}
              className={`py-2 px-3 rounded-lg border bg-white ${
                increaseAmount === amount
                  ? "border-blue-500 text-blue-500 lg:text-xl text-lg"
                  : "border border-slate-100 text-slate-400 hover:border-blue-500 hover:text-blue-500"
              } transition-all duration-200 text-center`}
            >
              {priceFormatter(amount)} تومان
            </button>
          ))}
        </div>
      </div>

      <button className="bg-pink-500 text-white px-10 py-3 rounded-lg flex items-center gap-1 lg:w-fit w-full justify-center">
        <span>پرداخت آنلاین</span>
        <LeftUpArrowIcon />
      </button>
    </div>
  );
};

export default IncreaseBalance;
