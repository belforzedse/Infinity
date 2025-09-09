"use client";
import EditIcon from "@/components/SuperAdmin/Layout/Icons/EditIcon";
import RecycleIcon from "@/components/SuperAdmin/Layout/Icons/RecycleIcon";
import ShowMoreIcon from "@/components/SuperAdmin/Layout/Icons/ShowMoreIcon";
import SuperAdminTableCellActionButton from "@/components/SuperAdmin/Table/Cells/ActionButton";
import SuperAdminTableCellFullDate from "@/components/SuperAdmin/Table/Cells/FullDate";
import { ColumnDef } from "@tanstack/react-table";
import { useState } from "react";

// This is a sample data type. Modify according to your needs
export type Area = {
  id: string;
  title: string;
  createdAt: Date;
  updatedAt: Date;
  description: string;
};

export const columns: ColumnDef<Area>[] = [
  {
    accessorKey: "title",
    header: "منطقه",
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
    header: "تاریخ به روز رسانی",
    cell: ({ row }) => {
      const date = row.getValue("updatedAt") as Date;
      return <SuperAdminTableCellFullDate date={date} />;
    },
  },
  {
    accessorKey: "description",
    header: "توضیحات",
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
          <SuperAdminTableCellActionButton
            variant="primary"
            icon={<RecycleIcon />}
          />

          <SuperAdminTableCellActionButton
            variant="secondary"
            icon={<EditIcon />}
          />
        </div>
      );
    },
  },
];

type Props = {
  data: Area[];
};

export const MobileTable = ({ data }: Props) => {
  return (
    <div className="mt-2 flex flex-col gap-2">
      {data.map((row) => {
        const [isOpen, setIsOpen] = useState(false);

        return (
          <div
            key={row.id}
            className="flex min-h-[76px] w-full items-center gap-2 rounded-lg bg-white p-3"
          >
            <div className="flex flex-1 flex-col gap-2">
              <div className="flex w-full items-center justify-between">
                <div className="flex gap-2">
                  <input type="checkbox" className="h-5 w-5" />

                  <span className="text-sm text-neutral-800">{row.title}</span>
                </div>

                <button
                  className={`flex h-6 w-6 items-center justify-center rounded-full border border-neutral-600 ${
                    isOpen ? "rotate-180" : ""
                  }`}
                  onClick={() => setIsOpen(!isOpen)}
                >
                  <ShowMoreIcon />
                </button>
              </div>

              {!isOpen ? (
                <div className="flex w-full items-center justify-between rounded-[4px] bg-stone-50 px-2 py-1">
                  <div className="flex items-center gap-1">
                    <span className="text-xs text-neutral-400">
                      {row.description}
                    </span>
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
                      className="flex w-full items-center justify-between rounded-[4px] bg-stone-50 px-2 py-1"
                      key={index}
                    >
                      <span className="text-xs text-neutral-400">
                        {column.header?.toString()}
                      </span>

                      {column?.cell ? (
                        (column?.cell as any)?.({
                          row: {
                            getValue: (key: string) => {
                              return row[key as keyof Area];
                            },
                          },
                        })
                      ) : (
                        <span className="text-xs text-foreground-primary md:text-base">
                          {
                            row[
                              (column as any).accessorKey as keyof Area
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
