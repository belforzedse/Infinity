import React from "react";
import { DatePicker } from "zaman";
import CalendarIcon from "../../Icons/CalendarIcon";

type Props = {
  value: Date;
  onChange: (value: Date) => void;
  readOnly?: boolean;
};

export default function DateField({ value, onChange, readOnly }: Props) {
  return (
    <div className="w-full border border-neutral-200 rounded-lg flex items-center gap-2 py-3 px-5">
      {readOnly ? (
        <span className="text-sm text-slate-500 flex-1 w-full">
          {value?.toLocaleString("fa-IR", {
            year: "numeric",
            month: "2-digit",
            day: "2-digit",
          })}
        </span>
      ) : (
        <DatePicker
          inputClass={`w-full flex-1 h-full text-sm`}
          defaultValue={value}
          onChange={(date: any) => onChange(date)}
        />
      )}

      <button
        className="w-5 h-5 flex items-center justify-center"
        disabled={readOnly}
      >
        <CalendarIcon />
      </button>
    </div>
  );
}
