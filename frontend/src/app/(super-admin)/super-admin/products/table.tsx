import EditIcon from "@/components/SuperAdmin/Layout/Icons/EditIcon";
import DuplicateIcon from "@/components/SuperAdmin/Layout/Icons/DuplicateIcon";
import ShowMoreIcon from "@/components/SuperAdmin/Layout/Icons/ShowMoreIcon";
import SuperAdminTableCellActionButton from "@/components/SuperAdmin/Table/Cells/ActionButton";
import RemoveActionButton from "@/components/SuperAdmin/Table/Cells/RemoveActionButton";
import SuperAdminTableCellSimplePrice from "@/components/SuperAdmin/Table/Cells/SimplePrice";
import type { ProductCoverImage } from "@/types/Product";
import { priceFormatter } from "@/utils/price";
import type { ColumnDef } from "@tanstack/react-table";
import { duplicateProduct } from "@/services/super-admin/product/duplicate";
import { resolveAssetUrl } from "@/utils/resolveAssetUrl";
import { useRouter } from "next/navigation";

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
      const thumbnailUrl =
        imageData?.formats?.thumbnail?.url || imageData?.formats?.small?.url || imageData?.url;
      const imageUrl = resolveAssetUrl(thumbnailUrl || imageData?.url);

      return (
        <div className="flex items-center gap-2">
          {imageUrl ? (
            <>
              <img
                src={imageUrl}
                alt={imageData?.name || row.original?.attributes?.Title || "Product image"}
                className="h-12 w-12 overflow-hidden rounded-xl object-cover"
                onError={(e) => {
                  e.currentTarget.style.display = "none";
                  const placeholder = e.currentTarget.nextElementSibling;
                  if (placeholder) placeholder.classList.remove("hidden");
                }}
              />
              <div className="hidden h-12 w-12 items-center justify-center rounded-xl bg-gray-200">
                <svg className="h-6 w-6 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
            </>
          ) : (
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gray-200">
              <svg className="h-6 w-6 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
          )}

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

const getPriceInfo = (variations: Product["attributes"]["product_variations"]["data"]) => {
  const normalized = variations
    .map((variation) => {
      const price = Number(variation?.attributes?.Price || 0);
      const discount = variation?.attributes?.DiscountPrice
        ? Number(variation.attributes.DiscountPrice)
        : null;
      return { price, discount };
    })
    .filter((variation) => variation.price > 0);

  if (!normalized.length) {
    return null;
  }

  const minPrice = Math.min(...normalized.map((variation) => variation.price));
  const maxPrice = Math.max(...normalized.map((variation) => variation.price));
  const discounts = normalized
    .map((variation) => variation.discount)
    .filter((value): value is number => typeof value === "number" && value > 0);
  const minDiscount = discounts.length ? Math.min(...discounts) : null;

  return { minPrice, maxPrice, minDiscount };
};

const getThumbnailUrl = (row: Product) => {
  const coverImage = row?.attributes?.CoverImage;
  const imageData = coverImage?.data?.attributes;
  const thumbnailUrl =
    imageData?.formats?.thumbnail?.url || imageData?.formats?.small?.url || imageData?.url;
  return resolveAssetUrl(thumbnailUrl || imageData?.url);
};

type Props = {
  data: Product[] | undefined;
  enableSelection?: boolean;
  selectedIds?: Set<string>;
  onSelectionChange?: (id: string, selected: boolean) => void;
};

export const MobileTable = ({ data, enableSelection, selectedIds, onSelectionChange }: Props) => {
  const router = useRouter();
  const handleRowClick = (id: string) => {
    router.push(`/super-admin/products/${id}`);
  };

  return (
    <div className="mt-2 flex flex-col gap-2">
      {data?.map((row) => {
        const variations = row?.attributes?.product_variations?.data || [];
        const priceInfo = getPriceInfo(variations);
        const rowPriceText = priceInfo
          ? priceInfo.maxPrice > priceInfo.minPrice
            ? `${priceFormatter(priceInfo.minPrice, " تومان")} تا ${priceFormatter(
                priceInfo.maxPrice,
                " تومان",
              )}`
            : priceFormatter(priceInfo.minPrice, " تومان")
          : "-";
        const stockCount = variations.reduce(
          (acc, variation) =>
            acc + (variation?.attributes?.product_stock?.data?.attributes?.Count || 0),
          0,
        );
        const sku = variations[0]?.attributes?.SKU || "";
        const imageUrl = getThumbnailUrl(row);

        return (
          <div
            key={row?.id}
            role="button"
            tabIndex={0}
            onClick={() => handleRowClick(row.id)}
            onKeyDown={(event) => {
              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                handleRowClick(row.id);
              }
            }}
            className="flex min-h-[76px] w-full items-center gap-2 rounded-lg bg-white p-3"
          >
            {enableSelection ? (
              <input
                type="checkbox"
                className="h-5 w-5"
                checked={selectedIds?.has(row.id) || false}
                onClick={(event) => event.stopPropagation()}
                onChange={(event) => onSelectionChange?.(row.id, event.target.checked)}
              />
            ) : (
              <input type="checkbox" className="h-5 w-5" onClick={(event) => event.stopPropagation()} />
            )}

            {imageUrl ? (
              <>
                <img
                  src={imageUrl}
                  alt={row?.attributes?.Title || "Product image"}
                  className="h-12 w-12 rounded-lg object-cover"
                  onError={(event) => {
                    event.currentTarget.style.display = "none";
                    const placeholder = event.currentTarget.nextElementSibling;
                    if (placeholder) placeholder.classList.remove("hidden");
                  }}
                />
                <div className="h-12 w-12 bg-gray-200 rounded-lg hidden items-center justify-center">
                  <svg className="h-6 w-6 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
              </>
            ) : (
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-gray-200">
                <svg className="h-6 w-6 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
            )}

            <div className="flex flex-1 flex-col gap-2">
              <div className="flex w-full items-center justify-between">
                <span className="text-sm text-neutral-800">
                  {row?.attributes?.Title}
                  {sku}
                </span>

                <button
                  className="flex h-6 w-6 items-center justify-center rounded-full border border-neutral-600"
                  onClick={(event) => {
                    event.stopPropagation();
                    handleRowClick(row.id);
                  }}
                  aria-label="نمایش جزئیات محصول"
                >
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
                    {stockCount}
                    عدد در انبار
                  </span>
                </div>

                <div className="flex flex-col">
                  {priceInfo?.minDiscount && (
                    <span className="text-xs font-medium text-pink-600">
                      {priceFormatter(priceInfo.minDiscount, " تومان")}
                    </span>
                  )}
                  <span
                    className={`text-xs ${
                      priceInfo?.minDiscount ? "text-gray-500 line-through" : "text-neutral-800"
                    }`}
                  >
                    {rowPriceText}
                  </span>
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};
