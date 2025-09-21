"use client";

import EditIcon from "@/components/SuperAdmin/Layout/Icons/EditIcon";
import RecycleIcon from "@/components/SuperAdmin/Layout/Icons/RecycleIcon";
import ShowMoreIcon from "@/components/SuperAdmin/Layout/Icons/ShowMoreIcon";
import SuperAdminTableCellActionButton from "@/components/SuperAdmin/Table/Cells/ActionButton";
import SuperAdminTableCellFullDate from "@/components/SuperAdmin/Table/Cells/FullDate";
import type { ColumnDef } from "@tanstack/react-table";
import { useState } from "react";

// This is a sample data type. Modify according to your needs
export type Notification = {
  id: string;
  title: string;
  type: string;
  createdAt: Date;
  updatedAt: Date;
};

export const columns: ColumnDef<Notification>[] = [
  {
    accessorKey: "title",
    header: "عنوان اعلان",
  },
  {
    accessorKey: "type",
    header: "نوع",
    meta: {
      headerClassName: "text-center",
      cellClassName: "text-center",
    },
  },
  {
    accessorKey: "createdAt",
    header: "تاریخ ایجاد",
    cell: ({ row }) => {
      const date = row.getValue("createdAt") as Date;

      return <SuperAdminTableCellFullDate date={date} />;
    },
  },
  {
    accessorKey: "updatedAt",
    header: "تاریخ آخرین ویرایش",
    cell: ({ row }) => {
      const date = row.getValue("updatedAt") as Date;

      return <SuperAdminTableCellFullDate date={date} />;
    },
  },
  {
    accessorKey: "id",
    header: "عملیات",
    meta: {
      headerClassName: "text-left",
      cellClassName: "text-left",
    },
    cell: ({ row }) => {
      return (
        <div className="flex flex-row-reverse items-center gap-3 p-1">
          <SuperAdminTableCellActionButton variant="primary" icon={<RecycleIcon />} />

          <SuperAdminTableCellActionButton
            variant="secondary"
            icon={<EditIcon />}
            path={`/super-admin/notifications/edit/${row.original.id}`}
          />
        </div>
      );
    },
  },
];

type Props = {
  data: Notification[];
};

export const MobileTable = ({ data }: Props) => {
  return (
    <div className="mt-2 flex flex-col gap-2">
      {data.map((row) => (
        <NotificationMobileRow key={row.id} row={row} />
      ))}
    </div>
  );
};

function NotificationMobileRow({ row }: { row: Notification }) {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <div className="flex min-h-[76px] w-full items-center gap-2 rounded-lg bg-white p-3">
      <div className="flex flex-1 flex-col gap-2">
        <div className="flex w-full items-center justify-between">
          <div className="flex items-center gap-2">
            <input type="checkbox" className="h-5 w-5" />
            <span className="text-sm text-neutral-800">{row.title}</span>
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
              <span className="text-xs text-neutral-400">{row.type}</span>
              <span className="text-xs text-neutral-400">|</span>
              <span className="text-sm text-neutral-400">
                ایجاد: {row.createdAt.toLocaleDateString("fa-IR")}
              </span>
              <span className="text-xs text-neutral-400">|</span>
              <span className="text-sm text-neutral-400">
                ویرایش: {row.updatedAt.toLocaleDateString("fa-IR")}
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
                    getValue: (key: string) => row[key as keyof Notification],
                  },
                })
              ) : (
                <span className="text-xs text-foreground-primary md:text-base">
                  {row[(column as any).accessorKey as keyof Notification] as string}
                </span>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
