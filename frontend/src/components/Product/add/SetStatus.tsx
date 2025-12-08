"use client";

import React, { useState } from "react";
import ChevronDownIcon from "../Icons/ChevronDownIcon";
import ChevronUpIcon from "../Icons/ChevronUpIcon";
import { Select, type Option } from "@/components/ui";

const statusOptions: Option[] = [
  { id: "1", name: "فعال" },
  { id: "2", name: "غیرفعال" },
  { id: "3", name: "پیش‌نویس" },
];

const SetStatus: React.FC = () => {
  const [selectedStatus, setSelectedStatus] = useState<Option | null>(statusOptions[0]);
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
    <div className="flex w-full flex-col gap-4 rounded-xl bg-white p-5">
      <div className="flex w-full items-center justify-between">
        <h2 className="text-base text-neutral-600">وضعیت</h2>
        <div className="h-3 w-3 rounded-full bg-green-400" />
      </div>

      <div className="flex w-full flex-col items-center justify-between gap-3">
        <Select
          className="w-full"
          value={selectedStatus}
          onChange={setSelectedStatus}
          options={statusOptions}
          placeholder="انتخاب وضعیت"
        />

        <div className="flex w-full items-center justify-between rounded-lg border border-slate-100 px-3 py-2">
          <span className="text-sm text-neutral-600">تعداد</span>

          <div className="flex max-w-14 items-center gap-1 rounded border border-slate-100 p-1">
            <div className="flex flex-col gap-0.5">
              <button
                onClick={handleIncrement}
                className="text-gray-400 transition-colors hover:text-gray-600"
              >
                <ChevronUpIcon className="h-2 w-2" />
              </button>
              <button
                onClick={handleDecrement}
                className="text-gray-400 transition-colors hover:text-gray-600"
              >
                <ChevronDownIcon className="h-2 w-2" />
              </button>
            </div>

            <input
              type="text"
              value={count}
              onChange={handleInputChange}
              className="text-xs w-full bg-transparent text-center font-medium text-black focus:outline-none"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default SetStatus;
