import EditIcon from "@/components/SuperAdmin/Layout/Icons/EditIcon";
import DuplicateIcon from "@/components/SuperAdmin/Layout/Icons/DuplicateIcon";
import ShowMoreIcon from "@/components/SuperAdmin/Layout/Icons/ShowMoreIcon";
import SuperAdminTableCellActionButton from "@/components/SuperAdmin/Table/Cells/ActionButton";
import RemoveActionButton from "@/components/SuperAdmin/Table/Cells/RemoveActionButton";
import SuperAdminTableCellSimplePrice from "@/components/SuperAdmin/Table/Cells/SimplePrice";
import { API_BASE_URL } from "@/constants/api";
import type { ProductCoverImage } from "@/types/Product";
import { priceFormatter } from "@/utils/price";
import type { ColumnDef } from "@tanstack/react-table";
import Image from "next/image";
import imageLoader from "@/utils/imageLoader";
import { duplicateProduct } from "@/services/super-admin/product/duplicate";

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
          DiscountPrice?: string;
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

const handleDuplicateProduct = async (productId: string) => {
  const result = await duplicateProduct(productId);
  if (result.success) {
    // Trigger table refresh
    window.location.reload(); // Simple refresh for now
  }
};

export const columns: ColumnDef<Product>[] = [
  {
    accessorKey: "attributes.Title",
    header: "نام محصول",
    cell: ({ row }) => {
      const coverImage = row.original?.attributes?.CoverImage;
      const imageData = coverImage?.data?.attributes;
      const thumbnailUrl = imageData?.formats?.thumbnail?.url || imageData?.formats?.small?.url || imageData?.url;

      console.log('Product debug:', {
        id: row.original?.id,
        coverImage,
        imageData,
        thumbnailUrl,
        API_BASE_URL: API_BASE_URL.split("/api")[0]
      });

      // Fix URL construction - ensure proper base URL
      const baseImageUrl = API_BASE_URL.split("/api")[0]; // Should be "https://api.infinity.rgbgroup.ir"
      const imageUrl = thumbnailUrl
        ? (thumbnailUrl.startsWith('http') ? thumbnailUrl : `${baseImageUrl}${thumbnailUrl}`)
        : null;

      console.log('Final product image URL:', imageUrl);

      return (
        <div className="flex items-center gap-2">
          {imageUrl ? (
            <img
              src={imageUrl}
              alt={imageData?.name || row.original?.attributes?.Title || 'Product image'}
              className="h-12 w-12 overflow-hidden rounded-xl object-cover"
              onError={(e) => {
                console.log('Products table image failed:', imageUrl);
                console.log('Trying to load:', imageUrl);
                e.currentTarget.style.display = 'none';
                const placeholder = e.currentTarget.nextElementSibling;
                if (placeholder) placeholder.classList.remove('hidden');
              }}
            />
          ) : null}
          <div className={`h-12 w-12 bg-gray-200 rounded-xl flex items-center justify-center ${imageUrl ? 'hidden' : ''}`}>
            <svg className="w-6 h-6 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
            </svg>
          </div>

          <div className="flex flex-col gap-2">
            <span className="text-xs !leading-none text-foreground-primary">
              {row.original?.attributes?.Title}
            </span>

            <span className="text-xs !leading-none text-foreground-secondary">
              {row.original?.attributes?.product_variations?.data?.[0]?.attributes?.SKU}
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
    cell: ({ row }) => {
      const variation = row.original?.attributes?.product_variations?.data?.[0]?.attributes;
      if (!variation?.Price) return "-";

      const price = +variation.Price;
      const discountPrice = variation.DiscountPrice ? +variation.DiscountPrice : null;

      return (
        <div className="flex flex-col">
          {discountPrice && (
            <span className="font-medium text-pink-600">
              <SuperAdminTableCellSimplePrice price={discountPrice} />
            </span>
          )}
          <span className={discountPrice ? "text-xs text-gray-500 line-through" : ""}>
            <SuperAdminTableCellSimplePrice price={price} />
          </span>
        </div>
      );
    },
  },
  {
    accessorKey: "inventory",
    header: "موجودی",
    cell: ({ row }) => {
      const sum = row.original?.attributes?.product_variations?.data?.reduce(
        (acc, curr) => acc + curr?.attributes?.product_stock?.data?.attributes?.Count,
        0,
      );

      return (
        <span
          className={
            sum === 0
              ? "rounded-xl bg-red-600 px-2 py-1 text-right text-white"
              : "rounded-xl bg-green-600 px-2 py-1 text-right text-white"
          }
        >
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

          <SuperAdminTableCellActionButton
            variant="secondary"
            icon={<DuplicateIcon />}
            onClick={() => handleDuplicateProduct(row.original.id)}
            text="دوبل کردن"
          />

          <SuperAdminTableCellActionButton
            variant="secondary"
            icon={<EditIcon />}
            path={`/super-admin/products/${row.original.id}`}
            text="ویرایش"
          />
        </div>
      );
    },
  },
];

type Props = {
  data: Product[] | undefined;
  enableSelection?: boolean;
  selectedIds?: Set<string>;
  onSelectionChange?: (id: string, selected: boolean) => void;
};

export const MobileTable = ({ data, enableSelection, selectedIds, onSelectionChange }: Props) => {
  return (
    <div className="mt-2 flex flex-col gap-2">
      {data?.map((row) => (
        <div
          key={row?.id}
          className="flex min-h-[76px] w-full items-center gap-2 rounded-lg bg-white p-3"
        >
          {enableSelection ? (
            <input
              type="checkbox"
              className="h-5 w-5"
              checked={selectedIds?.has(row.id) || false}
              onChange={(e) => onSelectionChange?.(row.id, e.target.checked)}
            />
          ) : (
            <input type="checkbox" className="h-5 w-5" />
          )}

          {(() => {
            const coverImage = row?.attributes?.CoverImage;
            const imageData = coverImage?.data?.attributes;
            const thumbnailUrl = imageData?.formats?.thumbnail?.url || imageData?.formats?.small?.url || imageData?.url;
            // Fix URL construction for mobile table
            const baseImageUrl = API_BASE_URL.split("/api")[0];
            const imageUrl = thumbnailUrl
              ? (thumbnailUrl.startsWith('http') ? thumbnailUrl : `${baseImageUrl}${thumbnailUrl}`)
              : null;

            return imageUrl ? (
              <img
                src={imageUrl}
                alt={imageData?.name || row?.attributes?.Title || 'Product image'}
                className="h-12 w-12 rounded-lg object-cover"
                onError={(e) => {
                  console.log('Mobile products table image failed:', imageUrl);
                  console.log('Mobile trying to load:', imageUrl);
                  e.currentTarget.style.display = 'none';
                  const placeholder = e.currentTarget.nextElementSibling;
                  if (placeholder) placeholder.classList.remove('hidden');
                }}
              />
            ) : (
              <div className="h-12 w-12 bg-gray-200 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
                </svg>
              </div>
            );
          })()}

          <div className="flex flex-1 flex-col gap-2">
            <div className="flex w-full items-center justify-between">
              <span className="text-sm text-neutral-800">
                {row?.attributes?.Title}
                {row?.attributes?.product_variations?.data?.[0]?.attributes?.SKU}
              </span>

              <button className="flex h-6 w-6 items-center justify-center rounded-full border border-neutral-600">
                <ShowMoreIcon />
              </button>
            </div>

            <div className="flex w-full items-center justify-between rounded-[4px] bg-stone-50 px-2 py-1">
              <div className="flex gap-1">
                <span className="text-xs text-neutral-400">
                  {row?.attributes?.product_main_category?.data?.attributes?.Title}
                </span>
                <span className="text-xs text-neutral-400">|</span>
                <span className="text-xs text-green-700">
                  {row?.attributes?.product_variations?.data?.reduce(
                    (acc, curr) => acc + curr?.attributes?.product_stock?.data?.attributes?.Count,
                    0,
                  )}
                  عدد در انبار
                </span>
              </div>

              <div className="flex flex-col">
                {row?.attributes?.product_variations?.data?.[0]?.attributes?.DiscountPrice && (
                  <span className="text-xs font-medium text-pink-600">
                    {priceFormatter(
                      +row?.attributes?.product_variations?.data?.[0]?.attributes?.DiscountPrice,
                      " تومان",
                    )}
                  </span>
                )}
                <span
                  className={`text-xs ${
                    row?.attributes?.product_variations?.data?.[0]?.attributes?.DiscountPrice
                      ? "text-gray-500 line-through"
                      : "text-neutral-800"
                  }`}
                >
                  {priceFormatter(
                    +row?.attributes?.product_variations?.data?.[0]?.attributes?.Price,
                    " تومان",
                  )}
                </span>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};
