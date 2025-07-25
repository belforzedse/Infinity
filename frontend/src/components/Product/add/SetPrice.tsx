"use client";

import React, { useState } from "react";
import SettingIcon from "../Icons/SettingIcon";

const SetPrice: React.FC = () => {
  const [price, setPrice] = useState<string>("");

  return (
    <div className="bg-white rounded-xl p-5 w-full flex flex-col gap-4">
      <div className="flex items-center gap-3 w-full justify-between">
        <h2 className="text-base text-neutral-600">قیمت محصول</h2>
        <div className="bg-gray-50 h-9 w-9 rounded-lg flex items-center justify-center text-gray-600">
          <SettingIcon />
        </div>
      </div>

      <input
        id="price"
        type="text"
        value={price}
        onChange={(e) => setPrice(e.target.value)}
        className="px-4 py-2 border w-full border-slate-100 rounded-xl text-base outline-none transition-colors duration-200 ease-in-out focus:border-blue-500 text-right placeholder-slate-400"
        placeholder="قیمت"
        dir="rtl"
      />
    </div>
  );
};

export default SetPrice;
