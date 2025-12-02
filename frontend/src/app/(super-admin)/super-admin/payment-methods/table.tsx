"use client";

import EditIcon from "@/components/SuperAdmin/Layout/Icons/EditIcon";
import RecycleIcon from "@/components/SuperAdmin/Layout/Icons/RecycleIcon";
import ShowMoreIcon from "@/components/SuperAdmin/Layout/Icons/ShowMoreIcon";
import SuperAdminTableCellActionButton from "@/components/SuperAdmin/Table/Cells/ActionButton";
import SuperAdminTableCellFullDate from "@/components/SuperAdmin/Table/Cells/FullDate";
import SuperAdminTableCellSwitch from "@/components/SuperAdmin/Table/Cells/Switch";
import type { ColumnDef } from "@tanstack/react-table";
import { useState } from "react";

// This is a sample data type. Modify according to your needs
export type PaymentMethods = {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  roleLevel: string;
  apiKey: string;
  status: "active" | "inactive";
};

export const columns: ColumnDef<PaymentMethods>[] = [
  {
    accessorKey: "title",
    header: "نام",
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
    accessorKey: "roleLevel",
    header: "سطح دسترسی",
  },
  {
    accessorKey: "apiKey",
    header: "کلید API",
  },
  {
    accessorKey: "status",
    header: "وضعیت",
    cell: ({ row }) => {
      const status = row.getValue("status") as string;
      return <SuperAdminTableCellSwitch status={status as "active" | "inactive"} />;
    },
  },
  {
    accessorKey: "createdAt",
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
            path={`/super-admin/payment-methods/edit/${row.original.id}`}
            icon={<EditIcon />}
          />
        </div>
      );
    },
  },
];

type Props = {
  data: PaymentMethods[];
};

export const MobileTable = ({ data }: Props) => {
  return (
    <div className="mt-2 flex flex-col gap-2">
      {data.map((row) => (
        <PaymentMethodMobileRow key={row.id} row={row} />
      ))}
    </div>
  );
};

function PaymentMethodMobileRow({ row }: { row: PaymentMethods }) {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <div className="flex min-h-[76px] w-full items-center gap-2 rounded-lg bg-white p-3">
      <div className="flex flex-1 flex-col gap-2">
        <div className="flex w-full items-center justify-between">
          <div className="flex gap-2">
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
              <span className="text-xs text-neutral-400">{row.roleLevel}</span>
              <span className="text-xs text-neutral-400">|</span>
              <span className="text-sm text-neutral-400">ایجاد: {row.createdAt}</span>
              <span className="text-xs text-neutral-400">|</span>
              <span className="text-sm text-neutral-400">ویرایش: {row.updatedAt}</span>
            </div>
            <SuperAdminTableCellSwitch status={row.status as "active" | "inactive"} />
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
                    getValue: (key: string) => row[key as keyof PaymentMethods],
                  },
                })
              ) : (
                <span className="text-xs text-foreground-primary md:text-base">
                  {row[(column as any).accessorKey as keyof PaymentMethods] as string}
                </span>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
