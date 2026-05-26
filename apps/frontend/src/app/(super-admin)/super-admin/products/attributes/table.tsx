"use client";

import type { ColumnDef } from "@tanstack/react-table";

export type Attribute = {
  id: string;
  name: string;
  slug?: string;
  createdAt?: string;
};

export const columns: ColumnDef<Attribute>[] = [
  {
    accessorKey: "name",
    header: "نام ویژگی",
  },
  {
    accessorKey: "slug",
    header: "نامک",
    cell: ({ row }) => row.original.slug || "-",
  },
  {
    accessorKey: "createdAt",
    header: "تاریخ ایجاد",
    cell: ({ row }) =>
      row.original.createdAt ? new Date(row.original.createdAt).toLocaleDateString("fa-IR") : "-",
  },
];

type Props = {
  data: Attribute[] | undefined;
};

export const MobileTable = ({ data }: Props) => {
  return (
    <div className="mt-2 flex flex-col gap-2">
      {data?.map((row) => (
        <div
          key={row.id}
          className="flex min-h-[76px] w-full items-center gap-2 overflow-hidden rounded-2xl bg-white p-3 shadow-sm"
        >
          <div className="flex min-w-0 flex-1 flex-col gap-2">
            <div className="flex w-full min-w-0 items-center justify-between">
              <span className="min-w-0 break-words text-sm text-neutral-800">{row.name}</span>
            </div>

            <div className="flex w-full min-w-0 flex-wrap items-center justify-between gap-2 rounded-lg bg-stone-50 px-2 py-2">
              <span className="min-w-0 break-words text-xs text-neutral-400">{row.slug || "-"}</span>
              <span className="shrink-0 text-xs text-neutral-400">
                {row.createdAt ? new Date(row.createdAt).toLocaleDateString("fa-IR") : "-"}
              </span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};
