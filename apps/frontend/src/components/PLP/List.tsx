"use client";

import NoData from "./NoData";
import { getProductCategories, type ProductCategorySummary } from "@/services/product/categories";
import { faNum } from "@/utils/faNum";
import type { ProductCardProps } from "@/components/Product/Card";
import Filter from "./List/Filter";
import PLPListMobileFilter from "./List/MobileFilter";
import HeartIcon from "./Icons/HeartIcon";
import DiscountIcon from "./Icons/DiscountIcon";
import SidebarSuggestions from "./List/SidebarSuggestions";
import Pagination from "./Pagination";
import { useQueryStates } from "nuqs";
import { useCallback, useEffect, useMemo, useRef, useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { SORT_LABELS } from "./sortOptions";
import { hasAvailableStock, productTitleHasG } from "@/utils/product";
import { useSidebarProducts } from "@/hooks/useSidebarProducts";
import PLPDesktopList from "./List/PLPDesktopList";
import PLPMobileList from "./List/PLPMobileList";
import type { PLPProduct, PLPPagination } from "./types";
import { plpQueryOptions, plpQueryParsers } from "./queryState";
import { getPlpHref } from "@/utils/plpRoutes";
import { ProductResultsSkeleton } from "@/components/Skeletons/ProductListSkeleton";
import { scrollIntoViewWithOffset } from "@/utils/scroll";

const humanize = (value: string) =>
  value.toString().replace(/[-_]+/g, " ").replace(/\s+/g, " ").trim();

interface PLPListProps {
  products: PLPProduct[];
  pagination: PLPPagination;
  category?: string;
  /** All categories with parentId (for resolving category + children in filter). */
  allCategories?: ProductCategorySummary[];
  searchQuery?: string;
  discountedSidebarProducts?: ProductCardProps[];
  suggestedSidebarProducts?: ProductCardProps[];
  /** When provided, rendered in the sidebar instead of default suggestions (e.g. Suspense + AsyncSidebarProducts). */
  sidebarSlot?: React.ReactNode;
}

export default function PLPList({
  products: initialProducts,
  pagination: initialPagination,
  category: initialCategory,
  allCategories: allCategoriesProp = [],
  searchQuery,
  discountedSidebarProducts = [],
  suggestedSidebarProducts = [],
  sidebarSlot,
}: PLPListProps) {
  const [query, setQuery] = useQueryStates(plpQueryParsers, plpQueryOptions);
  const [isPagePending, startPageTransition] = useTransition();
  const pendingPageScrollRef = useRef<number | null>(null);
  const {
    available,
    minPrice,
    maxPrice,
    size,
    material,
    season,
    gender,
    usage,
    page,
    sort,
    hasDiscount: discountOnly,
  } = query;
  const router = useRouter();
  const searchParams = useSearchParams();

  const [isDesktop, setIsDesktop] = useState(false);

  useEffect(() => {
    const checkDesktop = () => {
      setIsDesktop(window.innerWidth >= 768);
    };
    checkDesktop();
    window.addEventListener("resize", checkDesktop);
    return () => window.removeEventListener("resize", checkDesktop);
  }, []);

  // Helper function to check if product has an image
  const hasImage = (product: PLPProduct): boolean => {
    return !!(
      product.attributes?.CoverImage?.data?.attributes?.url || product.attributes?.CoverImage?.data
    );
  };

  // Filter initial products to only include those with images
  const filteredInitialProducts = useMemo(
    () => initialProducts.filter(hasImage),
    [initialProducts],
  );

  const [categoryOptions, setCategoryOptions] = useState<Array<{ id: string; title: string }>>([]);
  const [isLoadingCategories, setIsLoadingCategories] = useState(false);

  // When server passed allCategories (e.g. category PLP), use them for filter and skip client fetch.
  useEffect(() => {
    if (allCategoriesProp.length > 0) {
      setCategoryOptions(
        allCategoriesProp.map((cat) => ({
          id: cat.slug || String(cat.id),
          title: cat.name || cat.slug || String(cat.id),
        })),
      );
      return;
    }
    const fetchCategories = async () => {
      try {
        setIsLoadingCategories(true);
        const categories = await getProductCategories({ sort: "Title:asc" });
        if (!categories || categories.length === 0) {
          setCategoryOptions([]);
          return;
        }
        setCategoryOptions(
          categories.map((cat) => ({
            id: cat.slug || String(cat.id),
            title: cat.name || cat.slug || String(cat.id),
          })),
        );
      } catch (error) {
        console.error("[PLP] Error fetching categories:", error);
        setCategoryOptions([]);
      } finally {
        setIsLoadingCategories(false);
      }
    };
    fetchCategories();
  }, [allCategoriesProp]);

  // Memoize expensive filtering operations
  const validProducts = useMemo(
    () =>
      filteredInitialProducts.filter((product) => {
        try {
          // Basic product structure validation
          const hasCompactProjection = product?.attributes?.Price !== undefined;
          if (!hasCompactProjection && !product?.attributes?.product_variations?.data) {
            return false;
          }

          // Check if any variation has a valid price
          const hasValidPrice = hasCompactProjection
            ? Number(product.attributes.Price) > 0
            : product.attributes.product_variations!.data!.some((variation) => {
                if (!variation?.attributes?.Price) return false;
                const price = parseInt(variation.attributes.Price);
                return !isNaN(price) && price > 0;
              });

          // If showAvailableOnly is true, check if any variation is published AND has stock
          if (available === "true") {
            const hasInStockVariation =
              typeof product.attributes.IsAvailable === "boolean"
                ? product.attributes.IsAvailable
                : hasAvailableStock(product);
            if (!(hasValidPrice && hasInStockVariation)) return false;
          } else if (!hasValidPrice) {
            return false;
          }

          // Discount-only filter
          if (discountOnly === "true") {
            const hasDiscount = hasCompactProjection
              ? Number(product.attributes.Discount ?? 0) > 0 ||
                (Number(product.attributes.DiscountPrice ?? 0) > 0 &&
                  Number(product.attributes.DiscountPrice) < Number(product.attributes.Price))
              : product.attributes.product_variations!.data!.some((variation) => {
                  if (!variation?.attributes) return false;

                  // Check for general_discounts first
                  const generalDiscounts = variation.attributes.general_discounts?.data;
                  if (
                    generalDiscounts &&
                    Array.isArray(generalDiscounts) &&
                    generalDiscounts.length > 0
                  ) {
                    return true;
                  }

                  // Fallback to DiscountPrice field
                  const price = parseFloat(variation.attributes.Price || "0");
                  const discountPrice = variation.attributes.DiscountPrice
                    ? parseFloat(variation.attributes.DiscountPrice)
                    : null;
                  return (
                    discountPrice && !isNaN(discountPrice) && !isNaN(price) && discountPrice < price
                  );
                });
            if (!hasDiscount) return false;
          }

          return true;
        } catch (error) {
          console.warn("Error filtering product:", error, product);
          return false;
        }
      }),
    [filteredInitialProducts, available, discountOnly],
  );

  const { sidebarProducts, mappedDiscountedSidebar, mappedSuggestedSidebar } = useSidebarProducts({
    validProducts,
    discountedSidebarProducts,
    suggestedSidebarProducts,
  });

  const sidebarContent = sidebarSlot ?? (
    <>
      <SidebarSuggestions
        title="شاید بپسندید"
        icon={<HeartIcon />}
        items={mappedSuggestedSidebar.length > 0 ? mappedSuggestedSidebar : sidebarProducts}
      />
      <SidebarSuggestions
        title="تخفیف های آخرماه"
        icon={<DiscountIcon />}
        items={mappedDiscountedSidebar.length > 0 ? mappedDiscountedSidebar : sidebarProducts}
      />
    </>
  );

  // When discount filter is active (تخفیف های وسوسه انگیز PLP), sort products with G in title first
  const displayProducts = useMemo(() => {
    if (discountOnly !== "true") return validProducts;
    return [...validProducts].sort((a, b) => {
      const aHasG = productTitleHasG(a);
      const bHasG = productTitleHasG(b);
      if (aHasG && !bHasG) return -1;
      if (!aHasG && bHasG) return 1;
      return 0;
    });
  }, [validProducts, discountOnly]);

  const selectedCategoryTitle = useMemo(() => {
    if (!initialCategory) return null;

    const option = categoryOptions.find((item) => item.id === initialCategory);
    if (option) return option.title;

    const dynamicMatch = validProducts.find(
      (product) =>
        product.attributes.product_main_category?.data?.attributes?.Slug === initialCategory ||
        product.attributes.product_main_category?.data?.attributes?.Title === initialCategory,
    );

    if (dynamicMatch?.attributes.product_main_category?.data?.attributes?.Title) {
      return dynamicMatch.attributes.product_main_category.data.attributes.Title;
    }

    return initialCategory.replace(/[-_]/g, " ");
  }, [initialCategory, categoryOptions, validProducts]);

  const activeFilters = useMemo(() => {
    const filters: Array<{ key: string; label: string; onRemove: () => void }> = [];

    if (available === "true") {
      filters.push({
        key: "available",
        label: "فقط کالاهای موجود",
        onRemove: () => {
          void setQuery({ available: null, page: 1 });
        },
      });
    }

    if (initialCategory) {
      filters.push({
        key: "category",
        label: `دسته: ${selectedCategoryTitle || initialCategory}`,
        onRemove: () => {
          router.push(getPlpHref(searchParams));
        },
      });
    }

    if (discountOnly === "true") {
      filters.push({
        key: "discount",
        label: "فقط با تخفیف",
        onRemove: () => {
          void setQuery({ hasDiscount: null, page: 1 });
        },
      });
    }

    if (minPrice || maxPrice) {
      const minLabel = minPrice ? `از ${faNum(Number(minPrice))}` : "";
      const maxLabel = maxPrice ? `تا ${faNum(Number(maxPrice))}` : "";
      filters.push({
        key: "price",
        label: `قیمت ${[minLabel, maxLabel].filter(Boolean).join(" ") || ""}`.trim(),
        onRemove: () => {
          void setQuery({ minPrice: null, maxPrice: null, page: 1 });
        },
      });
    }

    if (size) {
      const numericSize = Number(size);
      const sizeLabel = Number.isNaN(numericSize) ? size : faNum(numericSize);
      filters.push({
        key: "size",
        label: `سایز ${sizeLabel}`,
        onRemove: () => {
          void setQuery({ size: null, page: 1 });
        },
      });
    }

    if (material) {
      filters.push({
        key: "material",
        label: `جنس: ${humanize(material)}`,
        onRemove: () => {
          void setQuery({ material: null, page: 1 });
        },
      });
    }

    if (season) {
      filters.push({
        key: "season",
        label: `فصل: ${humanize(season)}`,
        onRemove: () => {
          void setQuery({ season: null, page: 1 });
        },
      });
    }

    if (gender) {
      filters.push({
        key: "gender",
        label: `جنسیت: ${humanize(gender)}`,
        onRemove: () => {
          void setQuery({ gender: null, page: 1 });
        },
      });
    }

    if (usage) {
      filters.push({
        key: "usage",
        label: `کاربری: ${humanize(usage)}`,
        onRemove: () => {
          void setQuery({ usage: null, page: 1 });
        },
      });
    }

    if (sort) {
      filters.push({
        key: "sort",
        label: `مرتب‌سازی: ${SORT_LABELS[sort] || humanize(sort)}`,
        onRemove: () => {
          void setQuery({ sort: null, page: 1 });
        },
      });
    }

    return filters;
  }, [
    available,
    discountOnly,
    gender,
    initialCategory,
    material,
    maxPrice,
    minPrice,
    router,
    season,
    selectedCategoryTitle,
    searchParams,
    setQuery,
    size,
    sort,
    usage,
  ]);

  const clearAllFilters = () => {
    if (initialCategory) {
      router.push("/plp");
      return;
    }

    void setQuery({
      available: null,
      minPrice: null,
      maxPrice: null,
      size: null,
      material: null,
      season: null,
      gender: null,
      usage: null,
      hasDiscount: null,
      sort: null,
      page: 1,
    });
  };

  const scrollToPLPTop = useCallback(() => {
    if (typeof window === "undefined") return;
    const anchor = document.querySelector<HTMLElement>("[data-plp-top]");
    if (anchor) {
      scrollIntoViewWithOffset(anchor);
      return;
    }

    scrollIntoViewWithOffset(null, { fallbackTop: 0 });
  }, []);

  const scheduleScrollToPLPTop = useCallback(() => {
    if (typeof window === "undefined") return;
    window.requestAnimationFrame(scrollToPLPTop);
  }, [scrollToPLPTop]);

  const handlePageChange = (nextPage: number) => {
    pendingPageScrollRef.current = nextPage;
    void setQuery(
      { page: nextPage },
      {
        ...plpQueryOptions,
        startTransition: startPageTransition,
      },
    );
    scheduleScrollToPLPTop();
  };

  useEffect(() => {
    if (isPagePending || pendingPageScrollRef.current !== page) return;

    pendingPageScrollRef.current = null;
    scheduleScrollToPLPTop();
  }, [isPagePending, page, scheduleScrollToPLPTop]);

  return (
    <div className="w-full" data-plp-top style={{ scrollMarginTop: "var(--header-offset, 88px)" }}>
      <div className="flex flex-col gap-4 md:flex-row">
        {/* Sidebar with filters - Desktop only */}
        <div className="hidden md:flex md:w-[280px]">
          <div
            className="sticky flex w-full flex-col gap-7"
            style={{ top: "calc(var(--header-offset, 88px) + 1.5rem)" }}
          >
            <Filter
              showAvailableOnly={available === "true"}
              categories={categoryOptions}
              isLoadingCategories={isLoadingCategories}
              selectedCategory={initialCategory}
            />

            {sidebarContent}
          </div>
        </div>

        {/* Main content */}
        <div className="min-w-0 flex-1">
          {/* Mobile filter buttons */}
          <div className="mb-4 md:hidden">
            <PLPListMobileFilter
              categories={categoryOptions}
              isLoadingCategories={isLoadingCategories}
              selectedCategory={initialCategory}
            />
          </div>

          {/* Show search results title if search query exists */}
          {searchQuery && (
            <div className="mb-6">
              <h2 className="text-xl font-semibold">نتایج جستجو برای: &quot;{searchQuery}&quot;</h2>
            </div>
          )}

          {activeFilters.length > 0 && (
            <div className="mb-4 flex flex-wrap items-center gap-2 rounded-2xl border border-slate-200 bg-white px-3 py-3 shadow-sm">
              {activeFilters.map((filterEntry) => (
                <button
                  key={`${filterEntry.key}-${filterEntry.label}`}
                  type="button"
                  onClick={filterEntry.onRemove}
                  className="group flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1 text-xs text-neutral-600 transition-colors hover:border-pink-300 hover:text-pink-600"
                >
                  <span>{filterEntry.label}</span>
                  <span className="text-base leading-none text-slate-400 transition-colors group-hover:text-pink-600">
                    &times;
                  </span>
                </button>
              ))}
              <button
                type="button"
                onClick={clearAllFilters}
                className="text-xs font-medium text-pink-600 hover:text-pink-700"
              >
                حذف همه
              </button>
            </div>
          )}

          {validProducts.length === 0 ? (
            <NoData category={initialCategory} />
          ) : (
            <>
              {isPagePending ? (
                <ProductResultsSkeleton />
              ) : (
                <>
                  <PLPDesktopList products={displayProducts} includeMedia={isDesktop} />
                  <PLPMobileList products={displayProducts} />
                </>
              )}

              {/* Pagination */}
              <Pagination
                currentPage={page}
                totalPages={initialPagination.pageCount}
                onPageChange={handlePageChange}
                disabled={isPagePending}
              />
            </>
          )}
        </div>
      </div>
    </div>
  );
}
