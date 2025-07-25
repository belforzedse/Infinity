import SuperAdminTableCellFullDate from "@/components/SuperAdmin/Table/Cells/FullDate";
import SuperAdminTableCellSimplePrice from "@/components/SuperAdmin/Table/Cells/SimplePrice";
import MobileTableRowBox from "@/components/SuperAdmin/Table/Mobile/Row/Box";
import { API_BASE_URL } from "@/constants/api";
import { ProductCoverImage } from "@/types/Product";
import { priceFormatter } from "@/utils/price";
import { ColumnDef } from "@tanstack/react-table";
import { twMerge } from "tailwind-merge";

export type Cart = {
  id: string;
  attributes: {
    Status: string;
    createdAt: string;
    updatedAt: string;
    user: {
      data: {
        id: string;
        attributes: {
          Phone: string;
          IsVerified: boolean;
          createdAt: string;
          updatedAt: string;
          IsActive: boolean;
          removedAt: string | null;
          user_info: {
            data: {
              id: string;
              attributes: {
                FirstName: string | null;
                LastName: string | null;
                createdAt: string;
                updatedAt: string;
                NationalCode: string | null;
                BirthDate: string | null;
                Sex: string | null;
                Bio: string | null;
              };
            };
          };
        };
      };
    };
    cart_items: {
      data: Array<{
        id: string;
        attributes: {
          Sum: string;
          Count: number;
          createdAt: string;
          updatedAt: string;
          product_variation: {
            data: {
              id: string;
              attributes: {
                IsPublished: boolean;
                SKU: string;
                Price: string;
                createdAt: string;
                updatedAt: string;
                product: {
                  data: {
                    id: string;
                    attributes: {
                      Title: string;
                      Description: string;
                      Status: string;
                      AverageRating: number | null;
                      RatingCount: number | null;
                      createdAt: string;
                      updatedAt: string;
                      CleaningTips: string;
                      ReturnConditions: string;
                      removedAt: string | null;
                      CoverImage: ProductCoverImage;
                    };
                  };
                };
              };
            };
          };
        };
      }>;
    };
  };
};

export const columns: ColumnDef<Cart>[] = [
  {
    accessorKey:
      "attributes.user.data.attributes.user_info.data.attributes.FirstName",
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
        <span className="text-foreground-primary text-xs">
          {fullName.trim() || " - "}
        </span>
      );
    },
  },
  {
    accessorKey: "attributes.user.data.attributes.Phone",
    header: "شماره تلفن",
    cell: ({ row }) => {
      const phone = row.original?.attributes?.user?.data?.attributes?.Phone;
      return <span className="text-foreground-primary text-xs">{phone}</span>;
    },
  },
  {
    accessorKey: "id",
    header: "اقلام سبد خرید",
    cell: ({ row }) => {
      const items = row.original?.attributes?.cart_items?.data;

      return (
        <div className="flex items-center gap-2">
          {items.slice(0, 5).map((item) => (
            <img
              key={item?.attributes?.product_variation?.data?.id}
              src={
                API_BASE_URL.split("/api")[0] +
                item?.attributes?.product_variation?.data?.attributes?.product
                  ?.data?.attributes?.CoverImage?.data?.attributes?.url
              }
              alt={
                item?.attributes?.product_variation?.data?.attributes?.product
                  ?.data?.attributes?.CoverImage?.data?.attributes?.name
              }
              className="w-12 h-12 rounded-lg overflow-hidden"
            />
          ))}
          {items.length > 5 && (
            <span className="text-sm text-actions-primary">
              +{items.length - 5}
            </span>
          )}
        </div>
      );
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
    accessorKey: "attributes.cart_items.data",
    header: "ارزش سبد خرید",
    cell: ({ row }) => {
      const price = row.original?.attributes?.cart_items?.data?.reduce(
        (acc, item) => acc + Number(item.attributes.Sum),
        0
      );

      return <SuperAdminTableCellSimplePrice price={price} />;
    },
  },
  {
    accessorKey: "attributes.Status",
    header: "وضعیت",
    cell: ({ row }) => {
      const status = row.original?.attributes?.Status as string;
      return (
        <div
          className={twMerge(
            "flex items-center justify-center w-[118px] h-[29px] rounded-md",
            status === "Pending"
              ? "bg-blue-600"
              : status === "Payment"
              ? "bg-amber-500"
              : status === "Left"
              ? "bg-red-600"
              : "bg-gray-400"
          )}
        >
          <span className="text-xs text-white">
            {status === "Pending"
              ? "در حال تصمیم گیری"
              : status === "Payment"
              ? "در انتظار پرداخت"
              : status === "Left"
              ? "رها شده"
              : "خالی"}
          </span>
        </div>
      );
    },
  },
];

type Props = {
  data: Cart[] | undefined;
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
          header={
            <>
              <div className="bg-stone-50 w-full flex justify-between items-center rounded-[4px] px-2 py-1">
                <div className="flex gap-1">
                  <span className="text-xs text-neutral-400">
                    {row?.attributes?.cart_items?.data?.length}
                  </span>
                  <span className="text-xs text-neutral-400">|</span>
                  <SuperAdminTableCellFullDate
                    date={new Date(row?.attributes?.createdAt)}
                  />
                  <span className="text-xs text-neutral-400">|</span>
                  <span
                    className={twMerge(
                      "text-xs",
                      row?.attributes?.Status === "Pending"
                        ? "text-blue-600"
                        : row?.attributes?.Status === "Payment"
                        ? "text-amber-500"
                        : row?.attributes?.Status === "Left"
                        ? "text-red-600"
                        : "text-gray-400"
                    )}
                  >
                    {row?.attributes?.Status === "Pending"
                      ? "در حال تصمیم گیری"
                      : row?.attributes?.Status === "Payment"
                      ? "در انتظار پرداخت"
                      : row?.attributes?.Status === "Left"
                      ? "رها شده"
                      : "خالی"}
                  </span>
                </div>

                <span className="text-sm text-yellow-600">
                  {priceFormatter(
                    row?.attributes?.cart_items?.data?.reduce(
                      (acc, item) => acc + Number(item.attributes.Sum),
                      0
                    ),
                    " تومان"
                  )}
                </span>
              </div>
            </>
          }
          headTitle={
            (
              (row?.attributes?.user?.data?.attributes?.user_info?.data
                ?.attributes?.FirstName || "") +
              " " +
              (row?.attributes?.user?.data?.attributes?.user_info?.data
                ?.attributes?.LastName || "")
            ).trim() || " - "
          }
        />
      ))}
    </div>
  );
};
