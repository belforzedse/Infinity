"use client";

import { X } from "lucide-react";

type RecentQueriesRowProps = {
  queries: readonly string[];
  onSelect: (query: string) => void;
  onRemove: (query: string) => void;
};

export function RecentQueriesRow({ queries, onSelect, onRemove }: RecentQueriesRowProps) {
  if (queries.length === 0) return null;

  return (
    <div className="flex flex-row flex-wrap items-center justify-end gap-2" dir="rtl">
      {queries.map((query) => (
        <span
          key={query}
          className="inline-flex h-9 flex-row items-center gap-1 rounded-full bg-white px-3 font-peyda text-xs font-medium text-zinc-600 shadow-[0_0_14.7px_rgba(0,0,0,0.04)]"
        >
          <button type="button" className="pressable" onClick={() => onSelect(query)}>
            {query}
          </button>
          <button
            type="button"
            className="pressable inline-flex size-5 items-center justify-center rounded-full text-zinc-400 transition-colors hover:bg-zinc-50 hover:text-zinc-700"
            onClick={() => onRemove(query)}
            aria-label={`حذف ${query}`}
          >
            <X className="size-3" strokeWidth={1.8} aria-hidden />
          </button>
        </span>
      ))}
    </div>
  );
}
