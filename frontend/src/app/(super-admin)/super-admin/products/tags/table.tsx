"use client";

import SuperAdminTableCellFullDate from "@/components/SuperAdmin/Table/Cells/FullDate";
import RemoveActionButton from "@/components/SuperAdmin/Table/Cells/RemoveActionButton";
import { ColumnDef } from "@tanstack/react-table";

export type Tag = {
  id: string;
  attributes: {
    Title?: string;
    createdAt?: string;
    removedAt?: string | null;
  };
};

export const columns: ColumnDef<Tag>[] = [
  {
    accessorKey: "attributes.Title",
    header: "نام",
    cell: ({ row }) => (
      <span className="text-xs text-foreground-primary md:text-base">
        {row.original?.attributes?.Title || "-"}
      </span>
    ),
  },
  {
    accessorKey: "attributes.createdAt",
    header: "تاریخ ایجاد",
    cell: ({ row }) => {
      const date = row.original?.attributes?.createdAt as unknown as Date;
      return <SuperAdminTableCellFullDate date={date} />;
    },
  },
  {
    accessorKey: "actions",
    header: "عملیات",
    meta: {
      headerClassName: "text-left",
      cellClassName: "text-left",
    },
    cell: ({ row }) => {
      return (
        <div className="flex flex-row-reverse items-center gap-3 p-1">
          <RemoveActionButton
            isRemoved={!!row.original?.attributes?.removedAt}
            id={row.original?.id?.toString()}
            apiUrl={"/product-tags"}
          />
        </div>
      );
    },
  },
];

type Props = {
  data: Tag[] | undefined;
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
              <span className="text-sm text-neutral-800">
                {row.attributes?.Title || "-"}
              </span>
            </div>

            <div className="flex w-full items-center justify-between rounded-[4px] bg-stone-50 px-2 py-1">
              <span className="text-xs text-neutral-400">
                {row.attributes?.createdAt
                  ? new Date(row.attributes.createdAt).toLocaleDateString("fa-IR")
                  : ""}
              </span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

