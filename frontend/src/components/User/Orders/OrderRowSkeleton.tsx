"use client";

export default function OrderRowSkeleton() {
  return (
    <tr className="animate-pulse">
      <td className="py-3 pl-4">
        <div className="flex items-center gap-2">
          <div className="h-12 w-12 rounded-lg bg-slate-200" />
          <div className="h-4 w-40 rounded bg-slate-200" />
        </div>
      </td>
      <td className="px-4 py-3">
        <div className="h-4 w-24 rounded bg-slate-200" />
      </td>
      <td className="px-4 py-3">
        <div className="h-4 w-28 rounded bg-slate-200" />
      </td>
      <td className="px-4 py-3">
        <div className="h-4 w-20 rounded bg-slate-200" />
      </td>
      <td className="min-w-44 px-4 py-3">
        <div className="flex items-center gap-2">
          <div className="h-6 w-6 rounded-full bg-slate-200" />
          <div className="h-4 w-24 rounded bg-slate-200" />
        </div>
      </td>
      <td className="w-fit py-3 text-left">
        <div className="flex items-center gap-2">
          <div className="h-8 w-36 rounded-lg bg-slate-200" />
          <div className="h-8 w-28 rounded-lg bg-slate-200" />
        </div>
      </td>
    </tr>
  );
}
