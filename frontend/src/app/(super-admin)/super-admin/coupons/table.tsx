"use client";

import EditIcon from "@/components/SuperAdmin/Layout/Icons/EditIcon";
import SuperAdminTableCellActionButton from "@/components/SuperAdmin/Table/Cells/ActionButton";
import SuperAdminTableCellFullDate from "@/components/SuperAdmin/Table/Cells/FullDate";
import RemoveActionButton from "@/components/SuperAdmin/Table/Cells/RemoveActionButton";
import SuperAdminTableCellSwitch from "@/components/SuperAdmin/Table/Cells/Switch";
import MobileTableRowBox from "@/components/SuperAdmin/Table/Mobile/Row/Box";
import { priceFormatter } from "@/utils/price";
import { ColumnDef } from "@tanstack/react-table";

// This is a sample data type. Modify according to your needs
export type Coupon = {
  id: string;
  attributes: {
    Code: string;
    LimitUsage: number;
    Type: string;
    Amount: number;
    UsedTimes: number;
    LimitAmount: number;
    StartDate: string;
    EndDate: string;
    IsActive: boolean;
    createdAt: string;
    updatedAt: string;
    removedAt: string | null;
  };
};

export const columns: ColumnDef<Coupon>[] = [
  {
    accessorKey: "attributes.Code",
    header: "کد",
  },
  {
    accessorKey: "attributes.Type",
    header: "نوع کد تخفیفی",
    cell: ({ row }) => {
      const type = row.original?.attributes?.Type as string;
      return (
        <span className="text-foreground-primary text-xs md:text-base">
          {type === "Cash" ? "ثابت" : "درصدی"}
        </span>
      );
    },
    meta: {
      headerClassName: "text-center",
      cellClassName: "text-center",
    },
  },
  {
    accessorKey: "attributes.Amount",
    header: "میزان تخفیف",
    cell: ({ row }) => {
      const type = row.original?.attributes?.Type as string;
      const discount = row.original?.attributes?.Amount as number;

      return (
        <span className="text-foreground-primary text-xs md:text-base">
          {type === "Cash"
            ? priceFormatter(discount, " تومان")
            : `${discount}%`}
        </span>
      );
    },
    meta: {
      headerClassName: "text-center",
      cellClassName: "text-center",
    },
  },
  {
    accessorKey: "attributes.LimitUsage",
    header: "مصرف / محدودیت",
    cell: ({ row }) => {
      const usedTimes = row.original?.attributes?.UsedTimes as number;
      const maxUses = row.original?.attributes?.LimitUsage as number;

      return (
        <span className="text-foreground-primary text-xs md:text-base">
          {maxUses}/{usedTimes}
        </span>
      );
    },
    meta: {
      headerClassName: "text-center",
      cellClassName: "text-center",
    },
  },
  {
    accessorKey: "attributes.StartDate",
    header: "تاریخ شروع",
    cell: ({ row }) => {
      const date = new Date(row.original?.attributes?.StartDate as string);
      return <SuperAdminTableCellFullDate date={date} />;
    },
  },
  {
    accessorKey: "attributes.EndDate",
    header: "تاریخ انقضا",
    cell: ({ row }) => {
      const date = new Date(row.original?.attributes?.EndDate as string);
      return <SuperAdminTableCellFullDate date={date} />;
    },
  },
  {
    accessorKey: "status",
    header: "وضعیت کد",
    cell: ({ row }) => {
      const status = row.original?.attributes?.IsActive as boolean;
      return (
        <SuperAdminTableCellSwitch
          status={status ? "active" : "inactive"}
          apiUrl={`/discounts/${row.original.id}`}
        />
      );
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
        <div className="flex items-center gap-3 p-1 flex-row-reverse">
          <RemoveActionButton
            id={row.original.id}
            isRemoved={!!row.original?.attributes?.removedAt}
            apiUrl={`/discounts`}
          />

          <SuperAdminTableCellActionButton
            variant="secondary"
            path={`/super-admin/coupons/edit/${row.original.id}`}
            icon={<EditIcon />}
          />
        </div>
      );
    },
  },
];

type Props = {
  data: Coupon[] | undefined;
};

export const MobileTable = ({ data }: Props) => {
  if (!data) return null;

  return (
    <div className="flex flex-col gap-2 mt-2">
      {data.map((row) => {
        return (
          <MobileTableRowBox
            key={row.id}
            columns={columns}
            row={row}
            header={
              <>
                <div className="bg-stone-50 w-full flex justify-between items-center rounded-[4px] px-2 py-1">
                  <div className="flex gap-1 items-center">
                    <span className="text-xs text-neutral-400">
                      {row?.attributes?.Type === "Cash"
                        ? priceFormatter(row?.attributes?.Amount, " تومان")
                        : `${row?.attributes?.Amount}%`}{" "}
                      تخفیف
                    </span>
                    <span className="text-xs text-neutral-400">|</span>
                    <span className="text-xs text-neutral-400">
                      {row?.attributes?.LimitUsage}/{row?.attributes?.UsedTimes}
                    </span>
                    <span className="text-xs text-neutral-400">|</span>
                    <span className="text-sm text-green-700">
                      {new Date(
                        row?.attributes?.StartDate as string
                      ).toLocaleDateString("fa-IR")}
                    </span>
                  </div>

                  <SuperAdminTableCellSwitch
                    status={row?.attributes?.IsActive ? "active" : "inactive"}
                    apiUrl={`/discounts/${row.id}`}
                  />
                </div>
              </>
            }
            headTitle={row?.attributes?.Code}
          />
        );
      })}
    </div>
  );
};
