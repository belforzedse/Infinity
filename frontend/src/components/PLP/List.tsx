"use client";

import NoData from "./NoData";
import { apiClient } from "@/services";
import { getProductCategories, type ProductCategorySummary } from "@/services/product/categories";
import { getCategoryAndDescendantSlugs } from "@/utils/category-descendants";
import { faNum } from "@/utils/faNum";
import type { ProductCardProps } from "@/components/Product/Card";
import Filter from "./List/Filter";
import PLPListMobileFilter from "./List/MobileFilter";
import HeartIcon from "./Icons/HeartIcon";
import DiscountIcon from "./Icons/DiscountIcon";
import SidebarSuggestions from "./List/SidebarSuggestions";
import Pagination from "./Pagination";
import { useQueryState } from "nuqs";
import { useEffect, useState, useMemo, useCallback, useRef } from "react";
import ProductListSkeleton from "@/components/Skeletons/ProductListSkeleton";
import notify from "@/utils/notify";
import { SORT_LABELS } from "./sortOptions";
import {
  getMinInStockVariationPrice,
  hasAvailableStock,
  productTitleHasG,
  getProductCreatedAt,
} from "@/utils/product";
import { useSidebarProducts } from "@/hooks/useSidebarProducts";
import usePLPProductLikes from "@/hooks/usePLPProductLikes";
import PLPDesktopList from "./List/PLPDesktopList";
import PLPMobileList from "./List/PLPMobileList";
import type { PLPProduct, PLPPagination } from "./types";

const humanize = (value: string) =>
  value
    .toString()
    .replace(/[-_]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();

interface PLPListProps {
  products: PLPProduct[];
  pagination: PLPPagination;
  category?: string;
  initialIsDesktop?: boolean;
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
  initialIsDesktop = false,
  allCategories: allCategoriesProp = [],
  searchQuery,
  discountedSidebarProducts = [],
  suggestedSidebarProducts = [],
  sidebarSlot,
}: PLPListProps) {
  // URL state management with nuqs
  // These hooks are safe to use in client components - the adapter is in root layout
  const [category, setCategory] = useQueryState("category");
  const [available, setAvailable] = useQueryState("available");
  const [minPrice, setMinPrice] = useQueryState("minPrice");
  const [maxPrice, setMaxPrice] = useQueryState("maxPrice");
  const [size, setSize] = useQueryState("size");
  const [material, setMaterial] = useQueryState("material");
  const [season, setSeason] = useQueryState("season");
  const [gender, setGender] = useQueryState("gender");
  const [usage, setUsage] = useQueryState("usage");
  const [page, setPage] = useQueryState("page", { defaultValue: "1" });
  const [sort, setSort] = useQueryState("sort");
  const [discountOnly, setDiscountOnly] = useQueryState("hasDiscount");

  const [isDesktop, setIsDesktop] = useState(initialIsDesktop);
  const isDesktopForFetchRef = useRef(initialIsDesktop);
  /** Remember that we have or had products from server so we never overwrite with empty client response */
  const hadProductsFromServerRef = useRef(initialProducts.length > 0);
  /** Skip the first fetchProducts run on mount so we don't duplicate the server-rendered products request. */
  const didInitialMountRef = useRef(false);

  useEffect(() => {
    const checkDesktop = () => {
      const isD = window.innerWidth >= 768;
      setIsDesktop(isD);
      if (!isDesktopForFetchRef.current && isD) {
        isDesktopForFetchRef.current = true;
      }
    };
    checkDesktop();
    window.addEventListener("resize", checkDesktop);
    return () => window.removeEventListener("resize", checkDesktop);
  }, []);

  // Helper function to check if product has an image
  const hasImage = (product: PLPProduct): boolean => {
    return !!(
      product.attributes?.CoverImage?.data?.attributes?.url ||
      product.attributes?.CoverImage?.data
    );
  };

  // Filter initial products to only include those with images
  const filteredInitialProducts = useMemo(
    () => initialProducts.filter(hasImage),
    [initialProducts],
  );

  // Local state for products and pagination
  const [products, setProducts] = useState<PLPProduct[]>(filteredInitialProducts);
  const [pagination, setPagination] = useState<PLPPagination>(initialPagination);
  const [isLoading, setIsLoading] = useState(false);
  const [categoryOptions, setCategoryOptions] = useState<Array<{ id: string; title: string }>>(
    [],
  );
  /** Full category list from client fetch; used for descendant slugs when server did not pass allCategories (e.g. /plp with no category). */
  const [allCategoriesLocal, setAllCategoriesLocal] = useState<ProductCategorySummary[]>([]);
  const [isLoadingCategories, setIsLoadingCategories] = useState(false);

  useEffect(() => {
    hadProductsFromServerRef.current = filteredInitialProducts.length > 0;
    setProducts(filteredInitialProducts);
    setPagination(initialPagination);
  }, [filteredInitialProducts, initialPagination]);

  // Initialize category from prop
  const initializedCategoryRef = useRef(false);

  useEffect(() => {
    if (!initializedCategoryRef.current && initialCategory && category !== initialCategory) {
      initializedCategoryRef.current = true;
      setCategory(initialCategory);
    }
  }, [category, initialCategory, setCategory]);

  const resolvedCategorySlugs = useMemo(() => {
    if (!category) return undefined;
    const categoriesForDescendants =
      allCategoriesProp.length > 0 ? allCategoriesProp : allCategoriesLocal;
    if (categoriesForDescendants.length === 0) return [category];
    const slugs = getCategoryAndDescendantSlugs(categoriesForDescendants, category);
    return slugs.length > 0 ? slugs : [category];
  }, [allCategoriesLocal, allCategoriesProp, category]);

  const currentQueryKey = useMemo(
    () =>
      JSON.stringify({
        page,
        category,
        available,
        minPrice,
        maxPrice,
        size,
        material,
        season,
        gender,
        usage,
        sort,
        discountOnly,
        searchQuery,
      }),
    [
      page,
      category,
      available,
      minPrice,
      maxPrice,
      size,
      material,
      season,
      gender,
      usage,
      sort,
      discountOnly,
      searchQuery,
    ],
  );
  const initialQueryKeyRef = useRef<string | null>(null);
  if (initialQueryKeyRef.current === null) {
    initialQueryKeyRef.current = currentQueryKey;
  }

  // When server passed allCategories (e.g. category PLP), use them for filter and skip client fetch.
  useEffect(() => {
    if (allCategoriesProp.length > 0) {
      setAllCategoriesLocal(allCategoriesProp);
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
          setAllCategoriesLocal([]);
          return;
        }
        setAllCategoriesLocal(categories);
        setCategoryOptions(
          categories.map((cat) => ({
            id: cat.slug || String(cat.id),
            title: cat.name || cat.slug || String(cat.id),
          })),
        );
      } catch (error) {
        console.error("[PLP] Error fetching categories:", error);
        setCategoryOptions([]);
        setAllCategoriesLocal([]);
      } finally {
        setIsLoadingCategories(false);
      }
    };
    fetchCategories();
  }, [allCategoriesProp]);

  // Define fetchProducts function with useCallback
  const fetchProducts = useCallback(async () => {
    // Skip fetch if this is a search results page managed by server component
    if (searchQuery) return;

    setIsLoading(true);

    // Build query parameters
    const queryParams = new URLSearchParams();

    // Add pagination
    queryParams.append("pagination[page]", page);
    queryParams.append("pagination[pageSize]", "30");

    // PLP endpoint-specific hint for optional media
    queryParams.append("includeMedia", isDesktopForFetchRef.current ? "true" : "false");

    // Add filters
    queryParams.append("filters[Status][$eq]", "Active");
    queryParams.append("filters[removedAt][$null]", "true");
    queryParams.append("filters[product_variations][Price][$gt]", "0");

    // Category filter: include selected category and descendants
    if (resolvedCategorySlugs && resolvedCategorySlugs.length > 0) {
      resolvedCategorySlugs.forEach((slug, i) => {
        queryParams.append(`filters[product_main_category][Slug][$in][${i}]`, slug);
      });
    }

    // Availability filter - check for actual stock (Count > 0)
    if (available === "true") {
      queryParams.append("filters[product_variations][product_stock][Count][$gt]", "0");
    }

    // Price range filters
    if (minPrice) queryParams.append("filters[product_variations][Price][$gte]", minPrice);
    if (maxPrice) queryParams.append("filters[product_variations][Price][$lte]", maxPrice);

    // Attribute filters
    if (size) queryParams.append("filters[product_variations][Size][$eq]", size);
    if (material) queryParams.append("filters[product_variations][Material][$eq]", material);
    if (season) queryParams.append("filters[product_variations][Season][$eq]", season);
    if (gender) queryParams.append("filters[product_variations][Gender][$eq]", gender);
    if (usage) queryParams.append("filters[product_variations][Usage][$eq]", usage);

    // Sorting - only send to backend if not price sorting (price sorting done on frontend)
    if (sort && sort !== "price:asc" && sort !== "price:desc") {
      queryParams.append("sort[0]", sort);
    }

    // Prefer lightweight PLP endpoint with fallback to legacy /products
    const legacyQueryParams = new URLSearchParams(queryParams);
    legacyQueryParams.append("populate[0]", "CoverImage");
    legacyQueryParams.append("populate[1]", "product_main_category");
    legacyQueryParams.append("populate[2]", "product_variations");
    legacyQueryParams.append("populate[3]", "product_variations.product_stock");
    legacyQueryParams.append("populate[4]", "product_variations.general_discounts");
    legacyQueryParams.append("populate[5]", "product_variations.product_variation_color");
    if (isDesktopForFetchRef.current) {
      legacyQueryParams.append("populate[6]", "Media");
      legacyQueryParams.append("populate[Media][pagination][limit]", "3");
    }
    legacyQueryParams.append("fields[0]", "Title");
    legacyQueryParams.append("fields[1]", "Slug");
    legacyQueryParams.append("fields[2]", "Description");
    legacyQueryParams.append("fields[3]", "Status");
    legacyQueryParams.append("fields[4]", "createdAt");

    const primaryEndpoint = `/products/plp?${queryParams.toString()}`;
    const fallbackEndpoint = `/products?${legacyQueryParams.toString()}`;

    try {
      let data: any;
      try {
        data = await apiClient.getPublic<any>(primaryEndpoint, { suppressAuthRedirect: true });
      } catch {
        data = await apiClient.getPublic<any>(fallbackEndpoint, { suppressAuthRedirect: true });
      }

      let productsArray = Array.isArray(data?.data) ? data.data : [];
      productsArray = productsArray.filter(hasImage);

      // Sort by stock availability first; for newest/discount, prioritize G title.
      productsArray.sort((a: any, b: any) => {
        const aHasStock = hasAvailableStock(a);
        const bHasStock = hasAvailableStock(b);

        if (sort === "createdAt:desc") {
          const aHasG = productTitleHasG(a);
          const bHasG = productTitleHasG(b);
          if (aHasG && !bHasG) return -1;
          if (!aHasG && bHasG) return 1;
          if (aHasStock && !bHasStock) return -1;
          if (!aHasStock && bHasStock) return 1;
          return getProductCreatedAt(b) - getProductCreatedAt(a);
        }

        if (discountOnly === "true") {
          const aHasG = productTitleHasG(a);
          const bHasG = productTitleHasG(b);
          if (aHasG && !bHasG) return -1;
          if (!aHasG && bHasG) return 1;
        }

        if (aHasStock && !bHasStock) return -1;
        if (!aHasStock && bHasStock) return 1;
        return 0;
      });

      // Frontend price sorting (applied after stock sorting)
      if (sort === "price:asc" || sort === "price:desc") {
        productsArray = [...productsArray].sort((a: any, b: any) => {
          const aHasStock = hasAvailableStock(a);
          const bHasStock = hasAvailableStock(b);

          if (aHasStock && !bHasStock) return -1;
          if (!aHasStock && bHasStock) return 1;

          const priceA = getMinInStockVariationPrice(a);
          const priceB = getMinInStockVariationPrice(b);
          return sort === "price:asc" ? priceA - priceB : priceB - priceA;
        });
      }

      if (productsArray.length === 0 && hadProductsFromServerRef.current) {
        return;
      }
      if (productsArray.length > 0) hadProductsFromServerRef.current = true;

      setProducts(productsArray);
      setPagination(
        data?.meta?.pagination || {
          page: parseInt(page, 10) || 1,
          pageSize: 30,
          pageCount: 0,
          total: 0,
        },
      );
    } catch (error) {
      console.error("[PLP] Error fetching products:", {
        error,
        message: (error as any)?.message || "Unknown error",
        status: (error as any)?.status,
      });
      notify.error("خطا در بارگیری محصولات");
    } finally {
      setIsLoading(false);
    }
  }, [
    page,
    available,
    minPrice,
    maxPrice,
    size,
    material,
    season,
    gender,
    usage,
    sort,
    searchQuery,
    discountOnly,
    resolvedCategorySlugs,
  ]);

  // Fetch products when query changes. Skip first run and skip no-op query key.
  useEffect(() => {
    if (!didInitialMountRef.current) {
      didInitialMountRef.current = true;
      return;
    }
    if (hadProductsFromServerRef.current && currentQueryKey === initialQueryKeyRef.current) {
      return;
    }
    fetchProducts();
  }, [currentQueryKey, fetchProducts]);



  // Memoize expensive filtering operations
  const validProducts = useMemo(
    () =>
      products.filter((product) => {
        try {
          // Basic product structure validation
          if (!product?.attributes?.product_variations?.data) {
            return false;
          }

          // Check if any variation has a valid price
          const hasValidPrice = product.attributes.product_variations.data.some((variation) => {
            if (!variation?.attributes?.Price) return false;
            const price = parseInt(variation.attributes.Price);
            return !isNaN(price) && price > 0;
          });

          // If showAvailableOnly is true, check if any variation is published AND has stock
          if (available === "true") {
            const hasInStockVariation = hasAvailableStock(product);
            if (!(hasValidPrice && hasInStockVariation)) return false;
          } else if (!hasValidPrice) {
            return false;
          }

          // Discount-only filter
          if (discountOnly === "true") {
            const hasDiscount = product.attributes.product_variations.data.some((variation) => {
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
    [products, available, discountOnly],
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

  const displayedProductIds = useMemo(
    () => displayProducts.map((product) => product.id),
    [displayProducts],
  );
  const { isProductLiked, isProductLikeLoading, toggleProductLike } =
    usePLPProductLikes(displayedProductIds);

  const selectedCategoryTitle = useMemo(() => {
    if (!category) return null;

    const option = categoryOptions.find((item) => item.id === category);
    if (option) return option.title;

    const dynamicMatch = validProducts.find(
      (product) =>
        product.attributes.product_main_category?.data?.attributes?.Slug === category ||
        product.attributes.product_main_category?.data?.attributes?.Title === category,
    );

    if (dynamicMatch?.attributes.product_main_category?.data?.attributes?.Title) {
      return dynamicMatch.attributes.product_main_category.data.attributes.Title;
    }

    return category.replace(/[-_]/g, " ");
  }, [category, categoryOptions, validProducts]);

  const activeFilters = useMemo(
    () => {
      const filters: Array<{ key: string; label: string; onRemove: () => void }> = [];

      if (available === "true") {
        filters.push({
          key: "available",
          label: "فقط کالاهای موجود",
          onRemove: () => {
            setAvailable(null);
            setPage("1");
          },
        });
      }

      if (category) {
        filters.push({
          key: "category",
          label: `دسته: ${selectedCategoryTitle || category}`,
          onRemove: () => {
            setCategory(null);
            setPage("1");
          },
        });
      }

      if (discountOnly === "true") {
        filters.push({
          key: "discount",
          label: "فقط با تخفیف",
          onRemove: () => {
            setDiscountOnly(null);
            setPage("1");
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
            setMinPrice(null);
            setMaxPrice(null);
            setPage("1");
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
            setSize(null);
            setPage("1");
          },
        });
      }

      if (material) {
        filters.push({
          key: "material",
          label: `جنس: ${humanize(material)}`,
          onRemove: () => {
            setMaterial(null);
            setPage("1");
          },
        });
      }

      if (season) {
        filters.push({
          key: "season",
          label: `فصل: ${humanize(season)}`,
          onRemove: () => {
            setSeason(null);
            setPage("1");
          },
        });
      }

      if (gender) {
        filters.push({
          key: "gender",
          label: `جنسیت: ${humanize(gender)}`,
          onRemove: () => {
            setGender(null);
            setPage("1");
          },
        });
      }

      if (usage) {
        filters.push({
          key: "usage",
          label: `کاربری: ${humanize(usage)}`,
          onRemove: () => {
            setUsage(null);
            setPage("1");
          },
        });
      }

      if (sort) {
        filters.push({
          key: "sort",
          label: `مرتب‌سازی: ${SORT_LABELS[sort] || humanize(sort)}`,
          onRemove: () => {
            setSort(null);
            setPage("1");
          },
        });
      }

      return filters;
    },
    [
      available,
      category,
      discountOnly,
      gender,
      material,
      maxPrice,
      minPrice,
      season,
      selectedCategoryTitle,
      setAvailable,
      setCategory,
      setDiscountOnly,
      setGender,
      setMaterial,
      setMaxPrice,
      setMinPrice,
      setPage,
      setSeason,
      setSize,
      setSort,
      setUsage,
      size,
      sort,
      usage,
    ],
  );

  const clearAllFilters = () => {
    setCategory(null);
    setAvailable(null);
    setMinPrice(null);
    setMaxPrice(null);
    setSize(null);
    setMaterial(null);
    setSeason(null);
    setGender(null);
    setUsage(null);
    setDiscountOnly(null);
    setSort(null);
    setPage("1");
  };

  return (
    <div
      className="container mx-auto px-4"
      data-plp-top
      style={{ scrollMarginTop: "var(--header-offset, 88px)" }}
    >
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
            />

            {sidebarContent}
          </div>
        </div>

        {/* Main content */}
        <div className="flex-1">
          {/* Mobile filter buttons */}
          <div className="mb-4 md:hidden">
                <PLPListMobileFilter
                  categories={categoryOptions}
                  isLoadingCategories={isLoadingCategories}
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

          {/* Show skeleton while loading */}
          {isLoading ? (
            <ProductListSkeleton />
          ) : validProducts.length === 0 ? (
            <NoData category={category || initialCategory} />
          ) : (
            <>
              {isDesktop ? (
                <PLPDesktopList
                  products={displayProducts}
                  includeMedia
                  isProductLiked={isProductLiked}
                  isProductLikeLoading={isProductLikeLoading}
                  onToggleProductLike={toggleProductLike}
                />
              ) : (
                <PLPMobileList
                  products={displayProducts}
                  isProductLiked={isProductLiked}
                  isProductLikeLoading={isProductLikeLoading}
                  onToggleProductLike={toggleProductLike}
                />
              )}

              {/* Pagination */}
              <Pagination
                currentPage={pagination.page}
                totalPages={pagination.pageCount}
                onPageChange={(page) => setPage(page.toString())}
              />
            </>
          )}
        </div>
      </div>
    </div>
  );
}
