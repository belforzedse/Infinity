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
    MinCartTotal?: number | null;
    MaxCartTotal?: number | null;
    products?: {
      data?: Array<{
        id: number;
        attributes?: { Title?: string; SKU?: string };
      }>;
    };
    delivery_methods?: {
      data?: Array<{
        id: number;
        attributes?: { Title?: string };
      }>;
    };
  };
};

const RuleBadges = ({ attrs }: { attrs: Coupon["attributes"] }) => {
  const chips: string[] = [];
  if (attrs.MinCartTotal && Number(attrs.MinCartTotal) > 0) {
    chips.push(`حداقل ${priceFormatter(attrs.MinCartTotal, " تومان")}`);
  }
  if (attrs.MaxCartTotal && Number(attrs.MaxCartTotal) > 0) {
    chips.push(`حداکثر ${priceFormatter(attrs.MaxCartTotal, " تومان")}`);
  }
  const productCount = attrs.products?.data?.length ?? 0;
  if (productCount > 0) {
    chips.push(`${productCount} محصول`);
  }
  const deliveryNames =
    attrs.delivery_methods?.data
      ?.map((method) => method.attributes?.Title)
      .filter(Boolean) ?? [];
  if (deliveryNames.length > 0) {
    chips.push(`ارسال: ${deliveryNames.join("، ")}`);
  }

  if (chips.length === 0) {
    return <span className="text-xs text-neutral-400">بدون محدودیت</span>;
  }

  return (
    <div className="flex flex-wrap gap-1">
      {chips.map((chip, idx) => (
        <span
          key={`${chip}-${idx}`}
          className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] text-slate-600"
        >
          {chip}
        </span>
      ))}
    </div>
  );
};

export const createColumns = (canManageDiscounts: boolean): ColumnDef<Coupon>[] => [
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
    header: "میزان تخفیف",
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
    accessorKey: "attributes.LimitUsage",
    header: "مصرف / محدودیت",
    cell: ({ row }) => {
      const usedTimes = row.original?.attributes?.UsedTimes as number;
      const maxUses = row.original?.attributes?.LimitUsage as number;

      return (
        <span className="text-xs text-foreground-primary md:text-base">
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
    accessorKey: "attributes.rules",
    header: "شرایط",
    cell: ({ row }) => {
      return <RuleBadges attrs={row.original?.attributes} />;
    },
  },
  {
    accessorKey: "status",
    header: "وضعیت کد",
    cell: ({ row }) => {
      const status = row.original?.attributes?.IsActive as boolean;
      if (!canManageDiscounts) {
        return (
          <span className="text-xs text-neutral-500 md:text-sm">
            {status ? "فعال" : "غیرفعال"}
          </span>
        );
      }
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
      if (!canManageDiscounts) {
        return (
          <span className="text-xs text-neutral-400 md:text-sm">
            فقط قابل مشاهده برای مدیر فروشگاه
          </span>
        );
      }
      return (
        <div className="flex flex-row-reverse items-center gap-3 p-1">
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
  canManageDiscounts: boolean;
  columns: ColumnDef<Coupon>[];
};

export const MobileTable = ({ data, canManageDiscounts, columns }: Props) => {
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
                    <span className="text-xs text-neutral-400">
                      {row?.attributes?.LimitUsage}/{row?.attributes?.UsedTimes}
                    </span>
                    <span className="text-xs text-neutral-400">|</span>
                    <span className="text-sm text-green-700">
                      {new Date(row?.attributes?.StartDate as string).toLocaleDateString("fa-IR")}
                    </span>
                  </div>

                  {canManageDiscounts ? (
                    <SuperAdminTableCellSwitch
                      status={row?.attributes?.IsActive ? "active" : "inactive"}
                      apiUrl={`/discounts/${row.id}`}
                    />
                  ) : (
                    <span className="text-xs text-neutral-500">
                      {row?.attributes?.IsActive ? "فعال" : "غیرفعال"}
                    </span>
                  )}
                </div>
                <div className="mt-2">
                  <RuleBadges attrs={row.attributes} />
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
