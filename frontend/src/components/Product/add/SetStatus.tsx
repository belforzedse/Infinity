"use client";

import React, { useState } from "react";
import ChevronDownIcon from "../Icons/ChevronDownIcon";
import ChevronUpIcon from "../Icons/ChevronUpIcon";
import Select, { Option } from "@/components/Kits/Form/Select";

const statusOptions: Option[] = [
  { id: "1", name: "فعال" },
  { id: "2", name: "غیرفعال" },
  { id: "3", name: "پیش‌نویس" },
];

const SetStatus: React.FC = () => {
  const [selectedStatus, setSelectedStatus] = useState<Option | null>(
    statusOptions[0]
  );
  const [count, setCount] = useState(120);

  const handleIncrement = () => {
    setCount(count + 1);
  };

  const handleDecrement = () => {
    if (count > 0) {
      setCount(count - 1);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value);
    if (!isNaN(value) && value >= 0) {
      setCount(value);
    } else if (e.target.value === "") {
      setCount(0);
    }
  };

  return (
    <div className="w-full bg-white p-5 rounded-xl flex flex-col gap-4">
      <div className="flex items-center justify-between w-full">
        <h2 className="text-base text-neutral-600">وضعیت</h2>
        <div className="h-3 w-3 rounded-full bg-green-400" />
      </div>

      <div className="flex flex-col gap-3 items-center justify-between w-full">
        <Select
          className="w-full"
          value={selectedStatus}
          onChange={setSelectedStatus}
          options={statusOptions}
          placeholder="انتخاب وضعیت"
        />

        <div className="border border-slate-100 w-full rounded-lg py-2 px-3 flex items-center justify-between">
          <span className="text-sm text-neutral-600">تعداد</span>

          <div className="flex items-center gap-1 max-w-14 border border-slate-100 p-1 rounded">
            <div className="flex flex-col gap-0.5">
              <button
                onClick={handleIncrement}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <ChevronUpIcon className="w-2 h-2" />
              </button>
              <button
                onClick={handleDecrement}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <ChevronDownIcon className="w-2 h-2" />
              </button>
            </div>

            <input
              type="text"
              value={count}
              onChange={handleInputChange}
              className="w-full text-xs text-black font-medium bg-transparent text-center focus:outline-none"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default SetStatus;
