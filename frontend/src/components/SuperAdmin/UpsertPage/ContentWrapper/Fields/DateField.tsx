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
    <div className="flex w-full items-center gap-2 rounded-lg border border-neutral-200 px-5 py-3">
      {readOnly ? (
        <span className="text-sm w-full flex-1 text-slate-500">
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
        className="flex h-5 w-5 items-center justify-center"
        disabled={readOnly}
      >
        <CalendarIcon />
      </button>
    </div>
  );
}
