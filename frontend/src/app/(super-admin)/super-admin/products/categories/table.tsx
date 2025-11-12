"use client";

import EditIcon from "@/components/SuperAdmin/Layout/Icons/EditIcon";
import SuperAdminTableCellActionButton from "@/components/SuperAdmin/Table/Cells/ActionButton";
import SuperAdminTableCellFullDate from "@/components/SuperAdmin/Table/Cells/FullDate";
import Link from "next/link";
import type { ColumnDef } from "@tanstack/react-table";

export type Category = {
  id: string;
  attributes: {
    Title?: string;
    Slug?: string;
    Parent?: string | null;
    parent?: {
      data: {
        id: number;
        attributes: {
          Title?: string;
        };
      } | null;
    };
    createdAt?: string;
  };
};

const getParentTitle = (category?: Category) => {
  if (!category) return "-";
  return (
    category.attributes?.Parent ??
    category.attributes?.parent?.data?.attributes?.Title ??
    "-"
  );
};

export const columns: ColumnDef<Category>[] = [
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
    accessorKey: "attributes.Slug",
    header: "نامک",
    cell: ({ row }) => (
      <span className="text-xs text-foreground-secondary md:text-base">
        {row.original?.attributes?.Slug || "-"}
      </span>
    ),
  },
  {
    accessorKey: "attributes.Parent",
    header: "دسته والد",
    cell: ({ row }) => (
      <span className="text-xs text-foreground-secondary md:text-base">
        {getParentTitle(row.original)}
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
    cell: ({ row }) => (
      <div className="flex flex-row-reverse items-center gap-3 p-1">
        <SuperAdminTableCellActionButton
          variant="secondary"
          icon={<EditIcon />}
          path={`/super-admin/products/categories/edit/${row.original.id}`}
        />
      </div>
    ),
  },
];

type Props = {
  data: Category[] | undefined;
};

export const MobileTable = ({ data }: Props) => {
  return (
    <div className="mt-2 flex flex-col gap-2">
      {data?.map((row) => (
        <div
          key={row.id}
          className="flex min-h-[76px] w-full flex-col gap-2 rounded-lg bg-white p-3"
        >
          <div className="flex w-full items-center justify-between">
            <span className="text-sm text-neutral-800">{row.attributes?.Title || "-"}</span>
            <Link
              href={`/super-admin/products/categories/edit/${row.id}`}
              className="text-xs rounded-md bg-slate-100 px-2 py-1 text-slate-600"
            >
              ویرایش
            </Link>
          </div>

          <div className="flex w-full items-center justify-between rounded-[4px] bg-stone-50 px-2 py-1">
            <span className="text-xs text-neutral-400">{row.attributes?.Slug || "-"}</span>
            <span className="text-xs text-neutral-400">
              {row.attributes?.createdAt
                ? new Date(row.attributes.createdAt).toLocaleDateString("fa-IR")
                : ""}
            </span>
          </div>

          <div className="flex w-full items-center justify-between text-xs text-neutral-500">
            <span className="text-neutral-400">والد:</span>
            <span className="text-neutral-600">{getParentTitle(row)}</span>
          </div>
        </div>
      ))}
    </div>
  );
};
