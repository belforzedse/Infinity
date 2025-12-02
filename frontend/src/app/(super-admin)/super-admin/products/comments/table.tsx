import EditIcon from "@/components/SuperAdmin/Layout/Icons/EditIcon";
import ShowIcon from "@/components/SuperAdmin/Layout/Icons/ShowIcon";
import SuperAdminTableCellActionButton from "@/components/SuperAdmin/Table/Cells/ActionButton";
import RemoveActionButton from "@/components/SuperAdmin/Table/Cells/RemoveActionButton";
import MobileTableRowBox from "@/components/SuperAdmin/Table/Mobile/Row/Box";
import type { ColumnDef } from "@tanstack/react-table";
import { useState } from "react";
import { translateCommentStatus } from "@/utils/statusTranslations";

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
    cell: () => {
      return <span className="text-xs">محصول</span>;
    },
  },
  {
    accessorKey: "attributes.Content",
    header: "متن دیدگاه",
    cell: ({ row }) => <CommentContentCell content={row.original?.attributes?.Content} />,
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
            {translateCommentStatus(row.original?.attributes?.Status)}
          </span>

          <span className="text-xs text-right text-foreground-primary">
            {(new Date(row.original?.attributes?.createdAt) || new Date()).toLocaleString("fa-IR", {
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
        <div className="flex flex-row-reverse items-center gap-3 p-1">
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
    <div className="mt-2 flex flex-col gap-2">
      {data.map((row) => (
        <MobileTableRowBox
          key={row.id}
          columns={columns}
          row={row}
          headTitle={row.attributes?.user?.data?.attributes?.Phone}
          header={
            <div className="flex w-full items-center justify-between rounded-[4px] bg-stone-50 px-2 py-1">
              <div className="flex gap-1">
                <span className="text-xs text-neutral-400">
                  {translateCommentStatus(row.attributes?.Status)}
                </span>
                <span className="text-xs text-neutral-400">|</span>
                <span className="text-xs inline-block max-w-[70vw] overflow-hidden text-ellipsis whitespace-nowrap text-neutral-400">
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

function CommentContentCell({ content }: { content: string }) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  return (
    <>
      <button
        className="flex items-center gap-1 rounded-md bg-slate-100 px-2 py-1"
        onClick={() => setIsModalOpen(true)}
      >
        <span className="text-xs text-slate-500">دیدن</span>
        <ShowIcon />
      </button>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="max-h-[80vh] w-full max-w-lg overflow-auto rounded-lg bg-white p-4">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-medium">متن دیدگاه</h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                ×
              </button>
            </div>
            <p className="text-sm text-gray-700">{content}</p>
          </div>
        </div>
      )}
    </>
  );
}
