"use client";

import ChevronDownIcon from "@/components/SuperAdmin/Layout/Icons/ChevronDownIcon";
import ChevronRightIcon from "@/components/SuperAdmin/Layout/Icons/ChevronRightIcon";
import EditIcon from "@/components/SuperAdmin/Layout/Icons/EditIcon";
import SuperAdminTableCellActionButton from "@/components/SuperAdmin/Table/Cells/ActionButton";
import Link from "next/link";
import type { ColumnDef } from "@tanstack/react-table";

type CategoryChild = {
  id: number;
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
    children?: {
      data?: CategoryChild[];
    };
    createdAt?: string;
  };
};

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
    children?: {
      data?: CategoryChild[];
    };
    createdAt?: string;
  };
};

type CategoryColumnsConfig = {
  expandedParentIds: Set<string>;
  toggleParentExpansion: (id: string) => void;
};

const getChildCategories = (category?: Category) =>
  category?.attributes?.children?.data ?? [];

// Child categories list with improved layout
const ChildCategoriesList = ({
  categories,
}: {
  categories?: CategoryChild[];
}) => {
  const childCategories = categories ?? [];
  if (!childCategories.length) return null;

  return (
    <div className="flex flex-col gap-2 mt-3 pl-4 border-l-2 border-blue-300">
      {childCategories.map((child) => (
        <Link
          key={child.id}
          href={`/super-admin/products/categories/edit/${child.id}`}
          className="flex items-center gap-3 rounded-lg px-3 py-2 bg-blue-50/50 hover:bg-blue-100/70 transition-colors duration-150 border border-blue-200/40"
        >
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-slate-900 truncate">
              {child.attributes?.Title || "Unnamed"}
            </p>
            {child.attributes?.Slug && (
              <p className="text-xs text-slate-500 font-mono truncate">
                {child.attributes.Slug}
              </p>
            )}
          </div>
          <EditIcon className="h-4 w-4 text-slate-400 flex-shrink-0" />
        </Link>
      ))}
    </div>
  );
};

export const getCategoryColumns = ({
  expandedParentIds,
  toggleParentExpansion,
}: CategoryColumnsConfig): ColumnDef<Category>[] => [
  {
    accessorKey: "attributes.Title",
    header: "نام",
    cell: ({ row }) => {
      const childCategories = getChildCategories(row.original);
      const isExpanded = expandedParentIds.has(row.original.id);

      return (
        <div className="flex flex-col gap-0">
          <div className="flex items-start gap-3">
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-slate-900 truncate">
                {row.original?.attributes?.Title || "Unnamed"}
              </h3>
              {row.original?.attributes?.Slug && (
                <p className="text-xs text-slate-500 font-mono mt-0.5 truncate">
                  {row.original.attributes.Slug}
                </p>
              )}
            </div>
          </div>

          {/* Child categories - shown when expanded */}
          {childCategories.length > 0 && isExpanded && (
            <ChildCategoriesList categories={childCategories} />
          )}
        </div>
      );
    },
  },
  {
    accessorKey: "childCount",
    header: "فرزندان",
    cell: ({ row }) => {
      const childCategories = getChildCategories(row.original);
      if (!childCategories.length) return null;

      return (
        <div className="flex items-center justify-center">
          <span className="inline-flex items-center justify-center px-2.5 py-1.5 bg-blue-100/70 text-blue-700 text-xs font-bold rounded-full">
            {childCategories.length}
          </span>
        </div>
      );
    },
  },
  {
    accessorKey: "actions",
    header: "عملیات",
    meta: {
      headerClassName: "text-center",
      cellClassName: "text-center",
    },
    cell: ({ row }) => {
      const childCategories = getChildCategories(row.original);
      const hasChildren = childCategories.length > 0;
      const isExpanded = expandedParentIds.has(row.original.id);

      return (
        <div className="flex items-center justify-center gap-2">
          {/* Expand/collapse button */}
          {hasChildren && (
            <button
              type="button"
              onClick={() => toggleParentExpansion(row.original.id)}
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-blue-50 hover:border-blue-300 hover:text-blue-600 transition-all duration-150"
              aria-expanded={isExpanded}
              aria-label={isExpanded ? "بستن فرزندان" : "نمایش فرزندان"}
            >
              {isExpanded ? <ChevronDownIcon /> : <ChevronRightIcon />}
            </button>
          )}

          {/* Edit button */}
          <SuperAdminTableCellActionButton
            variant="secondary"
            icon={<EditIcon />}
            path={`/super-admin/products/categories/edit/${row.original.id}`}
          />
        </div>
      );
    },
  },
];

type Props = {
  data: Category[] | undefined;
};

type MobileTableProps = Props & {
  expandedParentIds: Set<string>;
  toggleParentExpansion: (id: string) => void;
};

export const MobileTable = ({
  data,
  expandedParentIds,
  toggleParentExpansion,
}: MobileTableProps) => {
  return (
    <div className="space-y-3">
      {data?.map((row) => {
        const childCategories = row.attributes?.children?.data ?? [];
        const hasChildren = childCategories.length > 0;
        const isExpanded = expandedParentIds.has(row.id);

        return (
          <div
            key={row.id}
            className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm"
          >
            {/* Parent category header */}
            <div className="flex items-start gap-3">
              {/* Expand toggle */}
              <div className="flex-shrink-0 pt-0.5">
                {hasChildren ? (
                  <button
                    type="button"
                    onClick={() => toggleParentExpansion(row.id)}
                    className="flex h-6 w-6 items-center justify-center text-slate-500 hover:text-slate-700 transition-colors"
                    aria-expanded={isExpanded}
                    aria-label={isExpanded ? "بستن فرزندان" : "نمایش فرزندان"}
                  >
                    {isExpanded ? <ChevronDownIcon /> : <ChevronRightIcon />}
                  </button>
                ) : (
                  <div className="w-6" />
                )}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-slate-900 truncate">
                  {row.attributes?.Title || "Unnamed"}
                </h3>
                {row.attributes?.Slug && (
                  <p className="text-xs text-slate-500 font-mono mt-1 truncate">
                    {row.attributes.Slug}
                  </p>
                )}
              </div>

              {/* Count badge + Edit button */}
              <div className="flex items-center gap-2 flex-shrink-0">
                {hasChildren && (
                  <div className="flex items-center justify-center px-2 py-1 bg-blue-100/70 rounded-full">
                    <span className="text-xs font-bold text-blue-700">
                      {childCategories.length}
                    </span>
                  </div>
                )}
                <Link
                  href={`/super-admin/products/categories/edit/${row.id}`}
                  className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-blue-50 hover:border-blue-300 transition-all duration-150"
                >
                  <EditIcon />
                </Link>
              </div>
            </div>

            {/* Expanded children */}
            {hasChildren && isExpanded && (
              <div className="mt-4 space-y-2">
                {childCategories.map((child) => (
                  <Link
                    key={child.id}
                    href={`/super-admin/products/categories/edit/${child.id}`}
                    className="flex items-center gap-3 rounded-lg px-3 py-2.5 bg-blue-50/60 hover:bg-blue-100/70 transition-colors border border-blue-200/40"
                  >
                    <div className="flex-1 min-w-0 pl-2 border-l-2 border-blue-300">
                      <p className="text-sm font-medium text-slate-900 truncate">
                        {child.attributes?.Title || "Unnamed"}
                      </p>
                      {child.attributes?.Slug && (
                        <p className="text-xs text-slate-500 font-mono truncate">
                          {child.attributes.Slug}
                        </p>
                      )}
                    </div>
                    <EditIcon className="h-4 w-4 text-slate-400 flex-shrink-0" />
                  </Link>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};
