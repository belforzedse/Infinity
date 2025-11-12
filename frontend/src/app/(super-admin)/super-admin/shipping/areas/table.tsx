"use client";
import ShowMoreIcon from "@/components/SuperAdmin/Layout/Icons/ShowMoreIcon";
import SuperAdminTableCellActionButton from "@/components/SuperAdmin/Table/Cells/ActionButton";
import SuperAdminTableCellFullDate from "@/components/SuperAdmin/Table/Cells/FullDate";
import type { ColumnDef } from "@tanstack/react-table";
import { useState } from "react";

export type Area = {
  id: string;
  attributes: {
    Title: string;
    Description?: string | null;
    createdAt: string;
    updatedAt: string;
  };
};

export const columns: ColumnDef<Area>[] = [
  {
    accessorKey: "attributes.Title",
    header: "منطقه",
  },
  {
    accessorKey: "attributes.createdAt",
    header: "تاریخ ایجاد",
    cell: ({ row }) => {
      const date = new Date(row.original?.attributes?.createdAt);
      return <SuperAdminTableCellFullDate date={date} />;
    },
  },
  {
    accessorKey: "attributes.updatedAt",
    header: "تاریخ به روز رسانی",
    cell: ({ row }) => {
      const date = new Date(row.original?.attributes?.updatedAt);
      return <SuperAdminTableCellFullDate date={date} />;
    },
  },
  {
    accessorKey: "attributes.Description",
    header: "توضیحات",
    cell: ({ row }) => row.original?.attributes?.Description || "-",
  },
  {
    accessorKey: "id",
    header: "عملیات",
    meta: {
      headerClassName: "text-left",
      cellClassName: "text-left",
    },
    cell: () => {
      return (
        <div className="flex flex-row-reverse items-center gap-3 p-1">
          <SuperAdminTableCellActionButton variant="secondary" icon={<ShowMoreIcon />} />
        </div>
      );
    },
  },
];

type Props = {
  data: Area[] | undefined;
};

export const MobileTable = ({ data }: Props) => {
  if (!data) return null;
  return (
    <div className="mt-2 flex flex-col gap-2">
      {data.map((row) => (
        <AreaMobileRow key={row.id} row={row} />
      ))}
    </div>
  );
};

function AreaMobileRow({ row }: { row: Area }) {
  const [isOpen, setIsOpen] = useState(false);
  const { Title, Description, createdAt, updatedAt } = row.attributes || {};

  const resolveValue = (accessorKey?: string) => {
    if (!accessorKey) return undefined;
    return accessorKey.split(".").reduce<any>((acc, key) => acc?.[key], row);
  };

  return (
    <div className="flex min-h-[76px] w-full items-center gap-2 rounded-lg bg-white p-3">
      <div className="flex flex-1 flex-col gap-2">
        <div className="flex w-full items-center justify-between">
          <div className="flex gap-2">
            <input type="checkbox" className="h-5 w-5" />
            <span className="text-sm text-neutral-800">{Title || "-"}</span>
          </div>
          <button
            className={`flex h-6 w-6 items-center justify-center rounded-full border border-neutral-600 ${isOpen ? "rotate-180" : ""}`}
            onClick={() => setIsOpen((v) => !v)}
          >
            <ShowMoreIcon />
          </button>
        </div>
        {!isOpen ? (
          <div className="flex w-full items-center justify-between rounded-[4px] bg-stone-50 px-2 py-1">
            <div className="flex items-center gap-1">
              <span className="text-xs text-neutral-400">{Description || "-"}</span>
              <span className="text-xs text-neutral-400">|</span>
              <span className="text-sm text-neutral-400">
                ایجاد: {new Date(createdAt || "").toLocaleDateString("fa-IR")}
              </span>
              <span className="text-xs text-neutral-400">|</span>
              <span className="text-sm text-neutral-400">
                ویرایش: {new Date(updatedAt || "").toLocaleDateString("fa-IR")}
              </span>
            </div>
          </div>
        ) : (
          columns.slice(0, columns.length - 1).map((column, index) => (
            <div
              className="flex w-full items-center justify-between rounded-[4px] bg-stone-50 px-2 py-1"
              key={index}
            >
              <span className="text-xs text-neutral-400">{column.header?.toString()}</span>
              {column?.cell ? (
                (column?.cell as any)?.({
                  row: {
                    original: row,
                    getValue: (key: string) => resolveValue(key),
                  },
                })
              ) : (
                <span className="text-xs text-foreground-primary md:text-base">
                  {resolveValue(column.accessorKey as string) ?? "-"}
                </span>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
