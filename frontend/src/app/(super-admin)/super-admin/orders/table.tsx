import SuperAdminTableCellFullDate from "@/components/SuperAdmin/Table/Cells/FullDate";
import { priceFormatter } from "@/utils/price";
import SuperAdminTableCellSimplePrice from "@/components/SuperAdmin/Table/Cells/SimplePrice";
import { ColumnDef } from "@tanstack/react-table";
import { twMerge } from "tailwind-merge";
import MobileTableRowBox from "@/components/SuperAdmin/Table/Mobile/Row/Box";
import OrderRowActions from "@/components/SuperAdmin/Order/OrderRowActions";

export type Order = {
  id: string;
  attributes: {
    Description: string;
    Note: string;
    Status: string;
    Date: string;
    ShippingBarcode?: string;
    createdAt: string;
    updatedAt: string;
    user: {
      data: {
        id: number;
        attributes: {
          Phone: string;
          IsVerified: boolean;
          createdAt: string;
          updatedAt: string;
          IsActive: boolean;
          removedAt: string | null;
          user_info: {
            data: {
              id: number;
              attributes: {
                FirstName: string;
                LastName: string;
                createdAt: string;
                updatedAt: string;
                NationalCode: string;
                BirthDate: string;
                Sex: boolean;
                Bio: string;
              };
            };
          };
        };
      };
    };
    contract: {
      data: {
        id: number;
        attributes: {
          Type: string;
          Status: string;
          Amount: number;
          TaxPercent: number;
          Date: string;
          createdAt: string;
          updatedAt: string;
        };
      };
    };
  };
};
const _bulkPrint = (selectedIds: string[]) => {
  if (!selectedIds.length) return;
  const url = `/super-admin/orders/print/bulk?ids=${selectedIds.join(",")}`;
  window.open(url, "_blank"); // ✅ One tab only
};



export const columns: ColumnDef<Order>[] = [
  {
    accessorKey: "id",
    header: "سفارش",
    cell: ({ row }) => {
      return (
        <span className="text-sm text-foreground-primary">
          #{row.original.id}
        </span>
      );
    },
  },
  {
    accessorKey: "attributes.user.data.attributes.Phone",
    header: "نام",
    cell: ({ row }) => {
      const firstName =
        row.original?.attributes?.user?.data?.attributes?.user_info?.data
          ?.attributes?.FirstName;
      const lastName =
        row.original?.attributes?.user?.data?.attributes?.user_info?.data
          ?.attributes?.LastName;

      const fullName = `${firstName || ""} ${lastName || ""}`;

      return (
        <span className="text-sm text-foreground-primary">
          {fullName.trim() || " - "}
        </span>
      );
    },
  },
  {
    accessorKey: "attributes.Date",
    header: "تاریخ",
    cell: ({ row }) => {
      const date = new Date(row.original?.attributes?.Date);

      return <DateAgo date={date} />;
    },
  },
  {
    accessorKey: "status",
    header: "وضعیت",
    cell: ({ row }) => {
      const status = row.original?.attributes?.Status;

      return (
        <div
          className={twMerge(
            "flex h-[29px] w-[92px] items-center justify-center rounded-md",
            status === "Paying" && "bg-blue-600",
            status === "Started" && "bg-yellow-600",
            status === "Shipment" && "bg-indigo-600",
            status === "Done" && "bg-green-600",
            status === "Returned" && "bg-orange-600",
            status === "Cancelled" && "bg-red-600",
          )}
        >
          <span className="text-xs text-white">
            {status === "Paying" && "در حال پرداخت"}
            {status === "Started" && "درحال پردازش"}
            {status === "Shipment" && "در حال ارسال"}
            {status === "Done" && "تکمیل شده"}
            {status === "Returned" && "مرجوع شده"}
            {status === "Cancelled" && "لغو شده"}
          </span>
        </div>
      );
    },
  },
  {
    accessorKey: "price",
    header: "مجموع",
    cell: ({ row }) => {
      const price =
        row.original?.attributes?.contract?.data?.attributes?.Amount;

      return price ? (
        <SuperAdminTableCellSimplePrice price={price} />
      ) : (
        <span className="text-sm text-foreground-primary">سفارش دستی</span>
      );
    },
  },
  {
    accessorKey: "attributes.ShippingBarcode",
    header: "کد رهگیری",
    cell: ({ row }) => {
      const barcode = row.original?.attributes?.ShippingBarcode;

      return (
        <span className="text-sm text-foreground-primary">
          {barcode || "-"}
        </span>
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
        <OrderRowActions
          orderId={row.original.id}
          shippingBarcode={row.original.attributes.ShippingBarcode}
        />
      );
    },
  },
];

function DateAgo(props: { date: Date }) {
  const { date } = props;

  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) {
    return (
      <span className="text-xs text-neutral-400 md:text-base md:text-foreground-primary">
        {diffInSeconds} ثانیه پیش
      </span>
    );
  }

  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) {
    return (
      <span className="text-xs text-neutral-400 md:text-base md:text-foreground-primary">
        {diffInMinutes} دقیقه پیش
      </span>
    );
  }

  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 12) {
    return (
      <span className="text-xs text-neutral-400 md:text-base md:text-foreground-primary">
        {diffInHours} ساعت پیش
      </span>
    );
  }

  return <SuperAdminTableCellFullDate date={date} />;
}

type Props = {
  data: Order[] | undefined;
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
          header={
            <div className="flex w-full items-center justify-between rounded-[4px] bg-stone-50 px-2 py-1">
              <div className="flex items-center gap-1">
                <span className="text-xs text-neutral-400">
                  {row?.attributes?.user?.data?.attributes?.Phone}
                </span>
                <span className="text-xs text-neutral-400">|</span>
                <DateAgo date={new Date(row?.attributes?.Date)} />
                <span className="text-xs text-neutral-400">|</span>
                <div
                  className={twMerge(
                    row?.attributes?.Status === "Paying" && "text-blue-600",
                    row?.attributes?.Status === "Started" && "text-yellow-600",
                    row?.attributes?.Status === "Shipment" && "text-indigo-600",
                    row?.attributes?.Status === "Done" && "text-green-600",
                    row?.attributes?.Status === "Returned" && "text-orange-600",
                    row?.attributes?.Status === "Cancelled" && "text-red-600",
                  )}
                >
                  <span className="text-xs">
                    {row?.attributes?.Status === "Paying" && "در حال پرداخت"}
                    {row?.attributes?.Status === "Started" && "درحال پردازش"}
                    {row?.attributes?.Status === "Shipment" && "در حال ارسال"}
                    {row?.attributes?.Status === "Done" && "تکمیل شده"}
                    {row?.attributes?.Status === "Returned" && "مرجوع شده"}
                    {row?.attributes?.Status === "Cancelled" && "لغو شده"}
                  </span>
                </div>
                {row?.attributes?.ShippingBarcode && (
                  <>
                    <span className="text-xs text-neutral-400">|</span>
                    <span className="text-xs text-neutral-600 font-medium">
                      {row.attributes.ShippingBarcode}
                    </span>
                  </>
                )}
              </div>

              <span className="text-xs text-neutral-800">
                {row?.attributes?.contract?.data?.attributes?.Amount
                  ? priceFormatter(
                      row?.attributes?.contract?.data?.attributes?.Amount,
                      " تومان",
                    )
                  : "سفارش دستی"}
              </span>
            </div>
          }
          headTitle={"#" + row.id}
          actions={
            <OrderRowActions
              orderId={row.id}
              shippingBarcode={row.attributes.ShippingBarcode}
            />
          }
        />
      ))}
    </div>
  );
};
