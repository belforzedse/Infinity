import EditIcon from "@/components/SuperAdmin/Layout/Icons/EditIcon";
import SuperAdminTableCellActionButton from "@/components/SuperAdmin/Table/Cells/ActionButton";
import SuperAdminTableCellFullDate from "@/components/SuperAdmin/Table/Cells/FullDate";
import RemoveActionButton from "@/components/SuperAdmin/Table/Cells/RemoveActionButton";
import SuperAdminTableCellSimplePrice from "@/components/SuperAdmin/Table/Cells/SimplePrice";
import SuperAdminTableCellSwitch from "@/components/SuperAdmin/Table/Cells/Switch";
import MobileTableRowBox from "@/components/SuperAdmin/Table/Mobile/Row/Box";
import { priceFormatter } from "@/utils/price";
import { ColumnDef } from "@tanstack/react-table";

// This is a sample data type. Modify according to your needs
export type Shipping = {
  id: string;
  attributes: {
    Title: string;
    Price: number;
    IsActive: boolean;
    removedAt: string | null;
    createdAt: string;
    updatedAt: string;
  };
};

export const columns: ColumnDef<Shipping>[] = [
  {
    accessorKey: "attributes.Title",
    header: "روش ارسال",
  },
  {
    accessorKey: "attributes.Price",
    header: "هزینه",
    cell: ({ row }) => {
      const price = row.original?.attributes?.Price as number;
      return <SuperAdminTableCellSimplePrice price={price} />;
    },
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
    accessorKey: "attributes.IsActive",
    header: "وضعیت",
    cell: ({ row }) => {
      const status = row.original?.attributes?.IsActive as boolean;
      return (
        <SuperAdminTableCellSwitch
          status={status ? "active" : "inactive"}
          apiUrl={`/shippings/${row.original?.id}`}
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
            apiUrl={`/shippings/${row.original?.id}`}
            isRemoved={row.original?.attributes?.removedAt !== null}
            id={row.original?.id}
          />

          {/* <SuperAdminTableCellActionButton
            variant="secondary"
            icon={<EditIcon />}
            path={`/super-admin/shipping/${row.original?.id}`}
          /> */}
        </div>
      );
    },
  },
];

type Props = {
  data: Shipping[] | undefined;
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
                      {priceFormatter(row?.attributes?.Price, "تومان")}
                    </span>
                    <span className="text-xs text-neutral-400">|</span>
                    <span className="text-xs text-neutral-400">ارسال سریع</span>
                    <span className="text-xs text-neutral-400">|</span>
                    <span className="text-sm text-neutral-800">
                      فعال در {row?.attributes?.Title}
                    </span>
                  </div>

                  <SuperAdminTableCellSwitch
                    status={row?.attributes?.IsActive ? "active" : "inactive"}
                    apiUrl={`/shippings/${row.id}`}
                  />
                </div>
              </>
            }
            headTitle={row?.attributes?.Title}
          />
        );
      })}
    </div>
  );
};
