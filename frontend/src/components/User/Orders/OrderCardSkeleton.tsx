"use client";

export default function OrderCardSkeleton() {
  return (
    <div className="mb-3 flex animate-pulse flex-col divide-y divide-slate-100 overflow-hidden rounded-2xl border border-slate-100 lg:hidden">
      <div className="grid grid-cols-4">
        <div className="flex items-center justify-start border-l border-slate-100 bg-stone-50 pr-3">
          <div className="h-4 w-20 rounded bg-slate-200" />
        </div>
        <div className="col-span-3 flex items-center gap-2 px-3 py-2">
          <div className="h-12 w-12 rounded-lg bg-slate-200" />
          <div className="h-4 w-40 rounded bg-slate-200" />
        </div>
      </div>
      <div className="grid grid-cols-4">
        <div className="flex items-center justify-start border-l border-slate-100 bg-stone-50 pr-3">
          <div className="h-4 w-20 rounded bg-slate-200" />
        </div>
        <div className="col-span-3 flex items-center gap-2 p-3">
          <div className="h-4 w-24 rounded bg-slate-200" />
        </div>
      </div>
      <div className="grid grid-cols-4">
        <div className="flex items-center justify-start border-l border-slate-100 bg-stone-50 pr-3">
          <div className="h-4 w-16 rounded bg-slate-200" />
        </div>
        <div className="col-span-3 flex items-center gap-2 p-3">
          <div className="h-4 w-36 rounded bg-slate-200" />
        </div>
      </div>
      <div className="grid grid-cols-4">
        <div className="flex items-center justify-start border-l border-slate-100 bg-stone-50 pr-3">
          <div className="h-4 w-12 rounded bg-slate-200" />
        </div>
        <div className="col-span-3 flex items-center justify-between gap-2 p-3 pl-0">
          <div className="flex items-center gap-2">
            <div className="h-6 w-6 rounded-full bg-slate-200" />
            <div className="h-4 w-28 rounded bg-slate-200" />
          </div>
          <div className="flex items-center gap-2">
            <div className="h-8 w-28 rounded-lg bg-slate-200" />
            <div className="h-8 w-24 rounded-lg bg-slate-200" />
          </div>
        </div>
      </div>
    </div>
  );
}

