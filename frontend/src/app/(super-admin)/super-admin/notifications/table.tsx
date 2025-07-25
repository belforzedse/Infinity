"use client";

import EditIcon from "@/components/SuperAdmin/Layout/Icons/EditIcon";
import RecycleIcon from "@/components/SuperAdmin/Layout/Icons/RecycleIcon";
import ShowMoreIcon from "@/components/SuperAdmin/Layout/Icons/ShowMoreIcon";
import SuperAdminTableCellActionButton from "@/components/SuperAdmin/Table/Cells/ActionButton";
import SuperAdminTableCellFullDate from "@/components/SuperAdmin/Table/Cells/FullDate";
import { ColumnDef } from "@tanstack/react-table";
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
        <div className="flex items-center gap-3 p-1 flex-row-reverse">
          <SuperAdminTableCellActionButton
            variant="primary"
            icon={<RecycleIcon />}
          />

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
    <div className="flex flex-col gap-2 mt-2">
      {data.map((row) => {
        const [isOpen, setIsOpen] = useState(false);

        return (
          <div
            key={row.id}
            className="p-3 bg-white rounded-lg w-full min-h-[76px] flex items-center gap-2"
          >
            <div className="flex flex-col gap-2 flex-1">
              <div className="flex justify-between items-center w-full">
                <div className="flex items-center gap-2">
                  <input type="checkbox" className="w-5 h-5" />

                  <span className="text-sm text-neutral-800">{row.title}</span>
                </div>

                <button
                  className={`flex items-center justify-center rounded-full border border-neutral-600 w-6 h-6 ${
                    isOpen ? "rotate-180" : ""
                  }`}
                  onClick={() => setIsOpen(!isOpen)}
                >
                  <ShowMoreIcon />
                </button>
              </div>

              {!isOpen ? (
                <div className="bg-stone-50 w-full flex justify-between items-center rounded-[4px] px-2 py-1">
                  <div className="flex gap-1 items-center">
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
                columns.slice(0, columns.length - 1).map((column, index) => {
                  return (
                    <div
                      className="bg-stone-50 w-full flex justify-between items-center rounded-[4px] px-2 py-1"
                      key={index}
                    >
                      <span className="text-xs text-neutral-400">
                        {column.header?.toString()}
                      </span>

                      {column?.cell ? (
                        (column?.cell as any)?.({
                          row: {
                            getValue: (key: string) => {
                              return row[key as keyof Notification];
                            },
                          },
                        })
                      ) : (
                        <span className="text-foreground-primary text-xs md:text-base">
                          {
                            row[
                              (column as any).accessorKey as keyof Notification
                            ] as string
                          }
                        </span>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};
