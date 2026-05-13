"use client";

import { useEffect, useRef } from "react";
import { Search, X } from "lucide-react";

type SearchInputProps = {
  value: string;
  onValueChange: (value: string) => void;
  onDebouncedValueChange: (value: string) => void;
};

export function SearchInput({ value, onValueChange, onDebouncedValueChange }: SearchInputProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    const id = window.setTimeout(() => onDebouncedValueChange(value.trim()), 300);
    return () => window.clearTimeout(id);
  }, [value, onDebouncedValueChange]);

  return (
    <div className="relative w-full max-w-xl">
      <Search
        className="pointer-events-none absolute right-4 top-1/2 size-5 -translate-y-1/2 text-[#94A3B8]"
        strokeWidth={1.5}
        aria-hidden
      />
      <input
        ref={inputRef}
        value={value}
        onChange={(event) => {
          onValueChange(event.target.value);
        }}
        dir="rtl"
        className="h-12 w-full rounded-full bg-white py-2 pl-12 pr-12 text-right font-peyda text-sm text-zinc-800 shadow-[0_0_14.7px_rgba(0,0,0,0.04)] outline-none transition-shadow placeholder:text-[#A3A3A3] focus:shadow-[0_0_0_1px_#94A3B8]"
        placeholder="دنبال چی میگردی؟"
        aria-label="جستجوی پست‌ها"
      />
      {value ? (
        <button
          type="button"
          onClick={() => {
            onValueChange("");
            onDebouncedValueChange("");
          }}
          className="pressable absolute left-2 top-1/2 inline-flex size-8 -translate-y-1/2 items-center justify-center rounded-full text-zinc-400 transition-colors hover:bg-zinc-50 hover:text-zinc-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-400/70"
          aria-label="پاک کردن جستجو"
        >
          <X className="size-4" strokeWidth={1.7} aria-hidden />
        </button>
      ) : null}
    </div>
  );
}
