"use client";

import EditIcon from "@/components/SuperAdmin/Layout/Icons/EditIcon";
import SuperAdminTableCellActionButton from "@/components/SuperAdmin/Table/Cells/ActionButton";
import SuperAdminTableCellFullDate from "@/components/SuperAdmin/Table/Cells/FullDate";
import RemoveActionButton from "@/components/SuperAdmin/Table/Cells/RemoveActionButton";
import SuperAdminTableCellSwitch from "@/components/SuperAdmin/Table/Cells/Switch";
import MobileTableRowBox from "@/components/SuperAdmin/Table/Mobile/Row/Box";
import { priceFormatter } from "@/utils/price";
import type { ColumnDef } from "@tanstack/react-table";

// This is a sample data type. Modify according to your needs
export type CouponRule = {
  id: string;
  attributes: {
    Type: string;
    Amount: number;
    LimitAmount: number;
    StartDate: string;
    EndDate: string;
    IsActive: boolean;
    createdAt: string;
    updatedAt: string;
    removedAt: string | null;
  };
};

export const columns: ColumnDef<CouponRule>[] = [
  {
    accessorKey: "id",
    header: "شناسه",
  },
  {
    accessorKey: "attributes.Type",
    header: "نوع قانون",
    cell: ({ row }) => {
      const type = row.original?.attributes?.Type as string;
      return (
        <span className="text-xs text-foreground-primary md:text-base">
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
    header: "میزان قانون",
    cell: ({ row }) => {
      const type = row.original?.attributes?.Type as string;
      const discount = row.original?.attributes?.Amount as number;

      return (
        <span className="text-xs text-foreground-primary md:text-base">
          {type === "Cash" ? priceFormatter(discount, " تومان") : `${discount}%`}
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
    header: "وضعیت قانون",
    cell: ({ row }) => {
      const status = row.original?.attributes?.IsActive as boolean;
      return (
        <SuperAdminTableCellSwitch
          status={status ? "active" : "inactive"}
          apiUrl={`/general-discounts/${row.original.id}`}
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
        <div className="flex flex-row-reverse items-center gap-3 p-1">
          <RemoveActionButton
            id={row.original.id}
            isRemoved={!!row.original?.attributes?.removedAt}
            apiUrl={`/general-discounts`}
          />

          <SuperAdminTableCellActionButton
            variant="secondary"
            path={`/super-admin/coupons/rules/edit/${row.original.id}`}
            icon={<EditIcon />}
          />
        </div>
      );
    },
  },
];

type Props = {
  data: CouponRule[] | undefined;
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
                    <span className="text-xs text-neutral-400">
                      {row?.attributes?.Type === "Cash"
                        ? priceFormatter(row?.attributes?.Amount, " تومان")
                        : `${row?.attributes?.Amount}%`}{" "}
                      تخفیف
                    </span>
                    <span className="text-xs text-neutral-400">|</span>
                    <span className="text-sm text-green-700">
                      {new Date(row?.attributes?.StartDate as string).toLocaleDateString("fa-IR")}
                    </span>
                  </div>

                  <SuperAdminTableCellSwitch
                    status={row?.attributes?.IsActive ? "active" : "inactive"}
                    apiUrl={`/general-discounts/${row.id}`}
                  />
                </div>
              </>
            }
            headTitle={row.id}
          />
        );
      })}
    </div>
  );
};
