"use client";

import React from "react";
import { Clock } from "lucide-react";

interface Props {
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
}

function ReserveShipping({ checked, onChange, disabled }: Props) {
  return (
    <div className="flex flex-col gap-2 rounded-lg border border-slate-200 bg-stone-50/50 p-4">
      <label className="flex cursor-pointer items-start gap-3">
        <input
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          disabled={disabled}
          className="mt-1 h-4 w-4 rounded border-slate-300 text-pink-600 focus:ring-pink-500"
        />
        <div className="flex flex-col gap-1">
          <span className="flex items-center gap-2 font-medium text-neutral-800">
            <Clock className="h-4 w-4 text-pink-500" />
            ارسال رزروی
          </span>
          <span className="text-sm text-neutral-600">
            ارسال سفارش شما ۴۸ ساعت به تعویق می‌افتد. در این مدت می‌توانید سفارش‌های جدید بدهید و
            همه در یک بسته ارسال شوند.
          </span>
        </div>
      </label>
    </div>
  );
}

export default ReserveShipping;
