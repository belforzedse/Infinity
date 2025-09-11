import EditIcon from "@/components/SuperAdmin/Layout/Icons/EditIcon";
import ShowMoreIcon from "@/components/SuperAdmin/Layout/Icons/ShowMoreIcon";
import SuperAdminTableCellActionButton from "@/components/SuperAdmin/Table/Cells/ActionButton";
import RemoveActionButton from "@/components/SuperAdmin/Table/Cells/RemoveActionButton";
import SuperAdminTableCellSimplePrice from "@/components/SuperAdmin/Table/Cells/SimplePrice";
import { API_BASE_URL } from "@/constants/api";
import { ProductCoverImage } from "@/types/Product";
import { priceFormatter } from "@/utils/price";
import { ColumnDef } from "@tanstack/react-table";
import Image from "next/image";
import imageLoader from "@/utils/imageLoader";

export type Product = {
  id: string;
  attributes: {
    removedAt: string;
    product_main_category: {
      data: {
        id: number;
        attributes: {
          Title: string;
        };
      };
    };
    Title: string;
    Description: string;
    Status: string;
    AverageRating: number | null;
    RatingCount: number | null;
    createdAt: string;
    updatedAt: string;
    CleaningTips: string;
    ReturnConditions: string;
    product_variations: {
      data: Array<{
        id: number;
        attributes: {
          IsPublished: boolean;
          SKU: string;
          Price: string;
          createdAt: string;
          updatedAt: string;
          product_stock: {
            data: {
              id: number;
              attributes: {
                Count: number;
                createdAt: string;
                updatedAt: string;
              };
            };
          };
        };
      }>;
    };
    CoverImage: ProductCoverImage;
  };
};

export const columns: ColumnDef<Product>[] = [
  {
    accessorKey: "attributes.Title",
    header: "نام محصول",
    cell: ({ row }) => {
      return (
        <div className="flex items-center gap-2">
          <Image
            src={
              API_BASE_URL.split("/api")[0] +
              row.original?.attributes?.CoverImage?.data?.attributes?.formats
                ?.thumbnail?.url
            }
            alt={row.original?.attributes?.CoverImage?.data?.attributes?.name}
            width={48}
            height={48}
            sizes="48px"
            className="h-12 w-12 overflow-hidden rounded-xl object-cover"
            loader={imageLoader}
          />

          <div className="flex flex-col gap-2">
            <span className="text-xs !leading-none text-foreground-primary">
              {row.original?.attributes?.Title}
            </span>

            <span className="text-xs !leading-none text-foreground-secondary">
              {
                row.original?.attributes?.product_variations?.data?.[0]
                  ?.attributes?.SKU
              }
            </span>
          </div>
        </div>
      );
    },
  },
  {
    accessorKey: "attributes.product_main_category.data.attributes.Title",
    header: "دسته‌بندی",
  },
  {
    accessorKey: "attributes.product_variations.data[0].attributes.Price",
    header: "قیمت",
    cell: ({ row }) =>
      row.original?.attributes?.product_variations?.data?.[0]?.attributes
        ?.Price ? (
        <SuperAdminTableCellSimplePrice
          price={
            +row.original?.attributes?.product_variations?.data?.[0]?.attributes
              ?.Price
          }
        />
      ) : (
        "-"
      ),
  },
  {
    accessorKey: "inventory",
    header: "موجودی",
    cell: ({ row }) => {
      const sum = row.original?.attributes?.product_variations?.data?.reduce(
        (acc, curr) =>
          acc + curr?.attributes?.product_stock?.data?.attributes?.Count,
        0,
      );

      return (
        <span className="rounded-xl bg-green-600 px-2 py-1 text-right text-white">
          {sum} عدد در انبار
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
        <div className="flex flex-row-reverse items-center gap-3 p-1">
          <RemoveActionButton
            isRemoved={!!row.original?.attributes?.removedAt}
            id={row.original?.id.toString()}
            apiUrl={"/products"}
          />

          {/* <SuperAdminTableCellActionButton
            variant="secondary"
            icon={<DuplicateIcon />}
          /> */}

          <SuperAdminTableCellActionButton
            variant="secondary"
            icon={<EditIcon />}
            path={`/super-admin/products/${row.original.id}`}
          />
        </div>
      );
    },
  },
];

type Props = {
  data: Product[] | undefined;
};

export const MobileTable = ({ data }: Props) => {
  return (
    <div className="mt-2 flex flex-col gap-2">
      {data?.map((row) => (
        <div
          key={row?.id}
          className="flex min-h-[76px] w-full items-center gap-2 rounded-lg bg-white p-3"
        >
          <input type="checkbox" className="h-5 w-5" />

          <Image
            src={
              API_BASE_URL.split("/api")[0] +
              row?.attributes?.CoverImage?.data?.attributes?.formats?.thumbnail
                ?.url
            }
            alt={row?.attributes?.CoverImage?.data?.attributes?.name}
            width={48}
            height={48}
            sizes="48px"
            className="h-12 w-12 rounded-lg object-cover"
            loader={imageLoader}
          />

          <div className="flex flex-1 flex-col gap-2">
            <div className="flex w-full items-center justify-between">
              <span className="text-sm text-neutral-800">
                {row?.attributes?.Title}
                {
                  row?.attributes?.product_variations?.data?.[0]?.attributes
                    ?.SKU
                }
              </span>

              <button className="flex h-6 w-6 items-center justify-center rounded-full border border-neutral-600">
                <ShowMoreIcon />
              </button>
            </div>

            <div className="flex w-full items-center justify-between rounded-[4px] bg-stone-50 px-2 py-1">
              <div className="flex gap-1">
                <span className="text-xs text-neutral-400">
                  {
                    row?.attributes?.product_main_category?.data?.attributes
                      ?.Title
                  }
                </span>
                <span className="text-xs text-neutral-400">|</span>
                <span className="text-xs text-green-700">
                  {row?.attributes?.product_variations?.data?.reduce(
                    (acc, curr) =>
                      acc +
                      curr?.attributes?.product_stock?.data?.attributes?.Count,
                    0,
                  )}
                  عدد در انبار
                </span>
              </div>

              <span className="text-xs text-neutral-800">
                {priceFormatter(
                  +row?.attributes?.product_variations?.data?.[0]?.attributes
                    ?.Price,
                  " تومان",
                )}
              </span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};
