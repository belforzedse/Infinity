import SuperAdminTableCellFullDate from "@/components/SuperAdmin/Table/Cells/FullDate";
import SuperAdminTableCellSimplePrice from "@/components/SuperAdmin/Table/Cells/SimplePrice";
import MobileTableRowBox from "@/components/SuperAdmin/Table/Mobile/Row/Box";
import { API_BASE_URL } from "@/constants/api";
import type { ProductCoverImage } from "@/types/Product";
import { priceFormatter } from "@/utils/price";
import type { ColumnDef } from "@tanstack/react-table";
import { twMerge } from "tailwind-merge";
import Image from "next/image";
import imageLoader from "@/utils/imageLoader";
import { translateCartStatus } from "@/utils/statusTranslations";
const cartStatusTextClass = (status?: string) => {
  const normalized = status?.toLowerCase().replace(/\s+/g, " ") || "";
  switch (normalized) {
    case "pending":
      return "text-blue-600";
    case "payment":
      return "text-amber-500";
    case "left":
      return "text-red-600";
    case "completed":
      return "text-green-600";
    default:
      return "text-gray-500";
  }
};


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
    accessorKey: "attributes.user.data.attributes.user_info.data.attributes.FirstName",
    header: "نام",
    cell: ({ row }) => {
      const firstName =
        row.original?.attributes?.user?.data?.attributes?.user_info?.data?.attributes?.FirstName;

      const lastName =
        row.original?.attributes?.user?.data?.attributes?.user_info?.data?.attributes?.LastName;

      const fullName = `${firstName || ""} ${lastName || ""}`;

      return <span className="text-xs text-foreground-primary">{fullName.trim() || " - "}</span>;
    },
  },
  {
    accessorKey: "attributes.user.data.attributes.Phone",
    header: "شماره تلفن",
    cell: ({ row }) => {
      const phone = row.original?.attributes?.user?.data?.attributes?.Phone;
      return <span className="text-xs text-foreground-primary">{phone}</span>;
    },
  },
  {
    accessorKey: "id",
    header: "اقلام سبد خرید",
    cell: ({ row }) => {
      const items = row.original?.attributes?.cart_items?.data;

      return (
        <div className="flex items-center gap-2">
          {items.slice(0, 5).map((item) => {
            const productData = item?.attributes?.product_variation?.data?.attributes?.product?.data?.attributes;
            const coverImage = productData?.CoverImage;
            const imageData = coverImage?.data?.attributes;
            const thumbnailUrl = imageData?.formats?.thumbnail?.url || imageData?.formats?.small?.url || imageData?.url;

            // Fix URL construction for cart items
            const baseImageUrl = API_BASE_URL ? API_BASE_URL.split("/api")[0] : "";
            const imageUrl = thumbnailUrl
              ? (thumbnailUrl.startsWith('http') ? thumbnailUrl : `${baseImageUrl}${thumbnailUrl}`)
              : null;

            return imageUrl ? (
              <img
                key={item?.attributes?.product_variation?.data?.id}
                src={imageUrl}
                alt={imageData?.name || productData?.Title || 'Cart item image'}
                className="h-12 w-12 overflow-hidden rounded-lg object-cover"
                onError={(e) => {
                  console.log('Cart item image failed:', imageUrl);
                  console.log('Cart trying to load:', imageUrl);
                  e.currentTarget.style.display = 'none';
                  const placeholder = e.currentTarget.nextElementSibling;
                  if (placeholder) placeholder.classList.remove('hidden');
                }}
              />
            ) : (
              <div key={item?.attributes?.product_variation?.data?.id} className="h-12 w-12 bg-gray-200 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
                </svg>
              </div>
            );
          })}
          {items.length > 5 && (
            <span className="text-sm text-actions-primary">+{items.length - 5}</span>
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
        0,
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
            "flex h-[29px] w-[118px] items-center justify-center rounded-md",
            status === "Pending"
              ? "bg-blue-600"
              : status === "Payment"
                ? "bg-amber-500"
                : status === "Left"
                  ? "bg-red-600"
                  : "bg-gray-400",
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
    <div className="mt-2 flex flex-col gap-2">
      {data.map((row) => (
        <MobileTableRowBox
          key={row.id}
          columns={columns}
          row={row}
          header={
            <>
              <div className="flex w-full items-center justify-between rounded-[4px] bg-stone-50 px-2 py-1">
                <div className="flex gap-1">
                  <span className="text-xs text-neutral-400">
                    {row?.attributes?.cart_items?.data?.length}
                  </span>
                  <span className="text-xs text-neutral-400">|</span>
                  <SuperAdminTableCellFullDate date={new Date(row?.attributes?.createdAt)} />
                  <span className="text-xs text-neutral-400">|</span>
                  <span className={twMerge("text-xs", cartStatusTextClass(row?.attributes?.Status))}>
                    {translateCartStatus(row?.attributes?.Status)}
                  </span>
                </div>

                <span className="text-sm text-yellow-600">
                  {priceFormatter(
                    row?.attributes?.cart_items?.data?.reduce(
                      (acc, item) => acc + Number(item.attributes.Sum),
                      0,
                    ),
                    " تومان",
                  )}
                </span>
              </div>
            </>
          }
          headTitle={
            (
              (row?.attributes?.user?.data?.attributes?.user_info?.data?.attributes?.FirstName ||
                "") +
              " " +
              (row?.attributes?.user?.data?.attributes?.user_info?.data?.attributes?.LastName || "")
            ).trim() || " - "
          }
        />
      ))}
    </div>
  );
};
