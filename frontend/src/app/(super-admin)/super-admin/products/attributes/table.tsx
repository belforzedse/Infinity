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
          className="flex min-h-[76px] w-full items-center gap-2 rounded-lg bg-white p-3"
        >
          <div className="flex flex-1 flex-col gap-2">
            <div className="flex w-full items-center justify-between">
              <span className="text-sm text-neutral-800">{row.name}</span>
            </div>

            <div className="flex w-full items-center justify-between rounded-[4px] bg-stone-50 px-2 py-1">
              <span className="text-xs text-neutral-400">{row.slug || "-"}</span>
              <span className="text-xs text-neutral-400">
                {row.createdAt ? new Date(row.createdAt).toLocaleDateString("fa-IR") : "-"}
              </span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};
