import { Search } from "lucide-react";

export function SearchEmptySkeleton() {
  return (
    <div className="flex flex-col items-end gap-4" dir="rtl" aria-busy="true">
      {/* Page title */}
      <div className="skeleton-shimmer h-7 w-16 self-end rounded-lg" aria-hidden />

      {/* Search input shell */}
      <div className="relative w-full max-w-xl self-end">
        <div
          className="flex h-12 w-full items-center justify-end gap-2 rounded-full bg-white px-4 shadow-[0_0_14.7px_rgba(0,0,0,0.04)]"
          aria-hidden
        >
          <div className="skeleton-shimmer-light h-4 w-36 rounded-full" />
          <Search className="size-5 shrink-0 text-zinc-200" strokeWidth={1.5} aria-hidden />
        </div>
      </div>

      {/* Recent-queries chip placeholders */}
      <div className="flex flex-wrap justify-end gap-2" aria-hidden>
        {[20, 28, 16, 24, 18].map((w, i) => (
          <div
            key={i}
            className="skeleton-shimmer-light h-8 rounded-full"
            style={{ width: `${w * 4}px` }}
          />
        ))}
      </div>
    </div>
  );
}
