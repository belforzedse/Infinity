"use client";

import SuperAdminTableCellFullDate from "@/components/SuperAdmin/Table/Cells/FullDate";
import MobileTableRowBox from "@/components/SuperAdmin/Table/Mobile/Row/Box";
import { ColumnDef } from "@tanstack/react-table";

// This is a sample data type. Modify according to your needs
export type Province = {
  id: string;
  attributes: {
    Code: string;
    Title: string;
    createdAt: Date;
    updatedAt: Date;
  };
};

export const columns: ColumnDef<Province>[] = [
  {
    accessorKey: "attributes.Code",
    header: "کد استان",
  },
  {
    accessorKey: "attributes.Title",
    header: "نام",
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
    accessorKey: "id",
    header: "عملیات",
    meta: {
      headerClassName: "text-left",
      cellClassName: "text-left",
    },
    cell: () => {
      return (
        <div className="flex flex-row-reverse items-center gap-3 p-1">
          {/* <SuperAdminTableCellActionButton
            variant="secondary"
            icon={<EditIcon />}
          /> */}
        </div>
      );
    },
  },
];

type Props = {
  data: Province[] | undefined;
};

export const MobileTable = ({ data }: Props) => {
  if (!data) return null;

  return (
    <div className="mt-2 flex flex-col gap-2">
      {data.map((row) => {
        return (
          <MobileTableRowBox
            key={row.id}
            columns={columns}
            row={row}
            header={
              <>
                <div className="flex w-full items-center justify-between rounded-[4px] bg-stone-50 px-2 py-1">
                  <div className="flex items-center gap-1">
                    <span className="text-xs text-neutral-400">{row.attributes?.Title}</span>
                    <span className="text-xs text-neutral-400">|</span>
                    <span className="text-xs text-neutral-400">کد {row.attributes?.Code}</span>
                    <span className="text-xs text-neutral-400">|</span>
                    <span className="text-sm text-neutral-400">
                      ایجاد: {new Date(row.attributes?.createdAt).toLocaleDateString("fa-IR")}
                    </span>
                    <span className="text-xs text-neutral-400">|</span>
                    <span className="text-sm text-neutral-400">
                      ویرایش: {new Date(row.attributes?.updatedAt).toLocaleDateString("fa-IR")}
                    </span>
                  </div>
                </div>
              </>
            }
            headTitle={row.attributes?.Title}
          />
        );
      })}
    </div>
  );
};
