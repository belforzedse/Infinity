import EditIcon from "@/components/SuperAdmin/Layout/Icons/EditIcon";
import EyeIcon from "@/components/SuperAdmin/Layout/Icons/EyeIcon";
import ShowMoreIcon from "@/components/SuperAdmin/Layout/Icons/ShowMoreIcon";
import SuperAdminTableCellActionButton from "@/components/SuperAdmin/Table/Cells/ActionButton";
import RemoveActionButton from "@/components/SuperAdmin/Table/Cells/RemoveActionButton";
import SuperAdminTableCellSimplePrice from "@/components/SuperAdmin/Table/Cells/SimplePrice";
import { API_BASE_URL } from "@/constants/api";
import { ProductCoverImage } from "@/types/Product";
import { priceFormatter } from "@/utils/price";
import { ColumnDef } from "@tanstack/react-table";

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
          <img
            src={
              API_BASE_URL.split("/api")[0] +
              row.original?.attributes?.CoverImage?.data?.attributes?.formats
                ?.thumbnail?.url
            }
            alt={row.original?.attributes?.CoverImage?.data?.attributes?.name}
            className="w-12 h-12 rounded-xl overflow-hidden"
          />

          <div className="flex gap-2 flex-col">
            <span className="text-foreground-primary text-xs !leading-none">
              {row.original?.attributes?.Title}
            </span>

            <span className="text-foreground-secondary text-xs !leading-none">
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
        0
      );

      return (
        <span className="text-right px-2 py-1 text-white bg-green-600 rounded-xl">
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
        <div className="flex items-center gap-3 p-1 flex-row-reverse">
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
    <div className="flex flex-col gap-2 mt-2">
      {data?.map((row) => (
        <div
          key={row?.id}
          className="p-3 bg-white rounded-lg w-full min-h-[76px] flex items-center gap-2"
        >
          <input type="checkbox" className="w-5 h-5" />

          <img
            src={
              API_BASE_URL.split("/api")[0] +
              row?.attributes?.CoverImage?.data?.attributes?.formats?.thumbnail
                ?.url
            }
            alt={row?.attributes?.CoverImage?.data?.attributes?.name}
            className="w-12 h-12 rounded-lg"
          />

          <div className="flex flex-col gap-2 flex-1">
            <div className="flex justify-between items-center w-full">
              <span className="text-sm text-neutral-800">
                {row?.attributes?.Title}
                {
                  row?.attributes?.product_variations?.data?.[0]?.attributes
                    ?.SKU
                }
              </span>

              <button className="flex items-center justify-center rounded-full border border-neutral-600 w-6 h-6">
                <ShowMoreIcon />
              </button>
            </div>

            <div className="bg-stone-50 w-full flex justify-between items-center rounded-[4px] px-2 py-1">
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
                    0
                  )}
                  عدد در انبار
                </span>
              </div>

              <span className="text-xs text-neutral-800">
                {priceFormatter(
                  +row?.attributes?.product_variations?.data?.[0]?.attributes
                    ?.Price,
                  " تومان"
                )}
              </span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};
