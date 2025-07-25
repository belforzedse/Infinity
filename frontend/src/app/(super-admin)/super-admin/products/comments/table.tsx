import EditIcon from "@/components/SuperAdmin/Layout/Icons/EditIcon";
import ShowIcon from "@/components/SuperAdmin/Layout/Icons/ShowIcon";
import SuperAdminTableCellActionButton from "@/components/SuperAdmin/Table/Cells/ActionButton";
import RemoveActionButton from "@/components/SuperAdmin/Table/Cells/RemoveActionButton";
import MobileTableRowBox from "@/components/SuperAdmin/Table/Mobile/Row/Box";
import { ColumnDef } from "@tanstack/react-table";
import { useState } from "react";

// This is a sample data type. Modify according to your needs
export type Comment = {
  id: string;
  attributes: {
    Rate: number;
    Date: string;
    Content: string;
    Status: string;
    LikeCounts: number;
    DislikeCounts: number;
    user: {
      data: {
        id: number;
        attributes: {
          Phone: string;
          IsVerified: boolean;
          createdAt: string;
          updatedAt: string;
          IsActive: boolean;
          removedAt: string;
        };
      };
    };
    removedAt: string;
    createdAt: string;
    updatedAt: string;
  };
};

export const columns: ColumnDef<Comment>[] = [
  {
    accessorKey: "attributes.user.data.attributes.Phone",
    header: "شناسه کاربر",
    cell: ({ row }) => {
      const userId = row.original?.attributes?.user?.data?.attributes?.Phone;

      return <span className="text-xs">{userId}</span>;
    },
  },
  {
    accessorKey: "contentType",
    header: "نوع محتوا",
    cell: ({ row }) => {
      return <span className="text-xs">محصول</span>;
    },
  },
  {
    accessorKey: "attributes.Content",
    header: "متن دیدگاه",
    cell: ({ row }) => {
      const [isModalOpen, setIsModalOpen] = useState(false);
      const commentContent = row.original?.attributes?.Content;

      return (
        <>
          <button
            className="flex items-center gap-1 px-2 py-1 rounded-md bg-slate-100"
            onClick={() => setIsModalOpen(true)}
          >
            <span className="text-xs text-slate-500">دیدن</span>
            <ShowIcon />
          </button>

          {isModalOpen && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white p-4 rounded-lg max-w-lg w-full max-h-[80vh] overflow-auto">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-medium">متن دیدگاه</h3>
                  <button
                    onClick={() => setIsModalOpen(false)}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    ×
                  </button>
                </div>
                <p className="text-sm text-gray-700">{commentContent}</p>
              </div>
            </div>
          )}
        </>
      );
    },
  },
  {
    accessorKey: "attributes.Status",
    header: "وضعیت",
    cell: ({ row }) => {
      return (
        <div className="flex flex-col gap-0.5">
          <span
            className={`text-right ${
              row.original?.attributes?.Status === "Accepted"
                ? "text-green-600"
                : row.original?.attributes?.Status === "Rejected"
                ? "text-red-600"
                : "text-yellow-600"
            } text-xs`}
          >
            {row.original?.attributes?.Status === "Accepted"
              ? "تایید شده"
              : row.original?.attributes?.Status === "Rejected"
              ? "رد شده"
              : "درحال بررسی"}
          </span>

          <span className="text-xs text-foreground-primary text-right">
            {(
              new Date(row.original?.attributes?.createdAt) || new Date()
            ).toLocaleString("fa-IR", {
              hour: "2-digit",
              minute: "2-digit",
              hour12: true,
            })}
          </span>
        </div>
      );
    },
  },
  {
    accessorKey: "attributes.LikeCounts",
    header: "لایک",
  },
  {
    accessorKey: "attributes.DislikeCounts",
    header: "دیسلایک",
  },
  {
    accessorKey: "attributes.updatedAt",
    header: "عملیات",
    meta: {
      headerClassName: "text-left",
      cellClassName: "text-left",
    },
    cell: ({ row }) => {
      return (
        <div className="flex items-center gap-3 p-1 flex-row-reverse">
          <RemoveActionButton
            isRemoved={!!row.original?.attributes?.removedAt}
            id={row.original?.id.toString()}
            apiUrl={"/product-reviews"}
          />

          <SuperAdminTableCellActionButton
            variant="secondary"
            icon={<EditIcon />}
            path={`/super-admin/products/comments/edit/${row.original?.id}`}
          />
        </div>
      );
    },
  },
];

type Props = {
  data: Comment[] | undefined;
};

export const MobileTable = ({ data }: Props) => {
  if (!data) return null;

  return (
    <div className="flex flex-col gap-2 mt-2">
      {data.map((row) => (
        <MobileTableRowBox
          key={row.id}
          columns={columns}
          row={row}
          headTitle={row.attributes?.user?.data?.attributes?.Phone}
          header={
            <div className="bg-stone-50 w-full flex justify-between items-center rounded-[4px] px-2 py-1">
              <div className="flex gap-1">
                <span className="text-xs text-neutral-400">
                  {row.attributes?.Status === "Accepted"
                    ? "تایید شده"
                    : row.attributes?.Status === "Rejected"
                    ? "رد شده"
                    : "درحال بررسی"}
                </span>
                <span className="text-xs text-neutral-400">|</span>
                <span className="text-xs text-neutral-400 overflow-hidden text-ellipsis whitespace-nowrap max-w-[70vw] inline-block">
                  {row.attributes?.Content}
                </span>
              </div>
            </div>
          }
        />
      ))}
    </div>
  );
};
