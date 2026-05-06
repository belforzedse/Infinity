"use client";

import React, { useState } from "react";
import SettingIcon from "../Icons/SettingIcon";

const SetPrice: React.FC = () => {
  const [price, setPrice] = useState<string>("");

  return (
    <div className="flex w-full flex-col gap-4 rounded-xl bg-white p-5">
      <div className="flex w-full items-center justify-between gap-3">
        <h2 className="text-base text-neutral-600">قیمت محصول</h2>
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gray-50 text-gray-600">
          <SettingIcon />
        </div>
      </div>

      <input
        id="price"
        type="text"
        value={price}
        onChange={(e) => setPrice(e.target.value)}
        className="text-base w-full rounded-xl border border-slate-100 px-4 py-2 text-right placeholder-slate-400 outline-none transition-colors duration-200 ease-in-out focus:border-blue-500"
        placeholder="قیمت"
        dir="rtl"
      />
    </div>
  );
};

export default SetPrice;
