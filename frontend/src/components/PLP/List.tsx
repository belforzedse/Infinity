"use client";

import { API_BASE_URL, ENDPOINTS, IMAGE_BASE_URL } from "@/constants/api";
import NoData from "./NoData";
import dynamic from "next/dynamic";
import { apiClient } from "@/services";
import { categories as STATIC_CATEGORIES } from "@/constants/categories";
import { faNum } from "@/utils/faNum";
import Filter from "./List/Filter";
import PLPListMobileFilter from "./List/MobileFilter";
import HeartIcon from "./Icons/HeartIcon";
import DiscountIcon from "./Icons/DiscountIcon";
import SidebarSuggestions from "./List/SidebarSuggestions";
import PLPPagination from "./Pagination";
import { useQueryState } from "nuqs";
import { useEffect, useState, useMemo, useCallback, useRef } from "react";
import ProductListSkeleton from "@/components/Skeletons/ProductListSkeleton";
import notify from "@/utils/notify";
import { SORT_LABELS } from "./sortOptions";
import { computeDiscountForVariation } from "@/utils/discounts";
import { usePullToRefresh } from "@/hooks/usePullToRefresh";

const humanize = (value: string) =>
  value
    .toString()
    .replace(/[-_]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();


// Lazy load heavy components
const ProductCard = dynamic(() => import("@/components/Product/Card"), {
  loading: () => <div className="h-48 animate-pulse rounded-lg bg-gray-200" />,
});
const ProductSmallCard = dynamic(() => import("@/components/Product/SmallCard"), {
  loading: () => <div className="h-24 animate-pulse rounded-lg bg-gray-200" />,
});

interface Product {
  id: number;
  attributes: {
    Title: string;
    Description: string;
    Status: string;
    AverageRating: number | null;
    RatingCount: number | null;
    CoverImage: {
      data: {
        attributes: {
          url: string;
        };
      };
    };
    product_main_category: {
      data: {
        attributes: {
          Title: string;
          Slug: string;
        };
      };
    };
    product_variations: {
      data: Array<{
        attributes: {
          SKU: string;
          Price: string;
          IsPublished: boolean;
          DiscountPrice?: string;
          general_discounts?: {
            data: Array<{
              attributes: {
                Amount: number;
              };
            }>;
          };
          product_stock?: {
            data?: {
              attributes?: {
                Count?: number;
              };
            };
          };
        };
      }>;
    };
  };
}

interface Pagination {
  page: number;
  pageSize: number;
  pageCount: number;
  total: number;
}

interface PLPListProps {
  products: Product[];
  pagination: Pagination;
  category?: string;
  searchQuery?: string;
}

export default function PLPList({
  products: initialProducts,
  pagination: initialPagination,
  category: initialCategory,
  searchQuery,
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


  // Helper function to check if product has an image
  const hasImage = (product: Product): boolean => {
    return !!(
      product.attributes?.CoverImage?.data?.attributes?.url ||
      product.attributes?.CoverImage?.data
    );
  };

  const productHasDiscount = (product: Product): boolean => {
    return product.attributes?.product_variations?.data?.some((variation) => {
      const generalDiscounts = variation.attributes?.general_discounts?.data;
      if (generalDiscounts && Array.isArray(generalDiscounts) && generalDiscounts.length > 0) {
        return true;
      }

      const price = parseFloat(variation.attributes?.Price || "0");
      const discountPrice = variation.attributes?.DiscountPrice
        ? parseFloat(variation.attributes.DiscountPrice)
        : undefined;

      return !!(
        typeof discountPrice === "number" &&
        !isNaN(discountPrice) &&
        !isNaN(price) &&
        discountPrice > 0 &&
        discountPrice < price
      );
    }) || false;
  };

  // Filter initial products to only include those with images
  const filteredInitialProducts = initialProducts.filter(hasImage);

  // Local state for products and pagination
  const [products, setProducts] = useState<Product[]>(filteredInitialProducts);
  const [pagination, setPagination] = useState<Pagination>(initialPagination);
  const [isLoading, setIsLoading] = useState(false);
  const [categoryOptions, setCategoryOptions] = useState<Array<{ id: string; title: string }>>(
    STATIC_CATEGORIES.map((cat) => ({ id: cat.slug, title: cat.name })),
  );
  const [isLoadingCategories, setIsLoadingCategories] = useState(false);

  // Initialize category from prop
  const initializedCategoryRef = useRef(false);

  useEffect(() => {
    if (!initializedCategoryRef.current && initialCategory) {
      initializedCategoryRef.current = true;
      setCategory(initialCategory);
    }
  }, [initialCategory, setCategory]);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setIsLoadingCategories(true);
        const response = await fetch(`${API_BASE_URL}${ENDPOINTS.PRODUCT.CATEGORY}`);
        if (!response.ok) throw new Error("Failed to fetch categories");
        const data = await response.json();
        if (Array.isArray(data?.data) && data.data.length > 0) {
          const mapped = data.data.map((cat: any) => ({
            id: cat.attributes?.Slug || String(cat.id),
            title: cat.attributes?.Title || cat.attributes?.Slug || String(cat.id),
          }));
          setCategoryOptions(mapped);
        }
      } catch (error) {
        console.error("[PLP] Error fetching categories:", error);
      } finally {
        setIsLoadingCategories(false);
      }
    };

    fetchCategories();
  }, []);

  // Define fetchProducts function with useCallback
  const fetchProducts = useCallback(() => {
    // Skip fetch if this is a search results page managed by server component
    if (searchQuery) {
      return;
    }

    setIsLoading(true);

    // Build query parameters
    const queryParams = new URLSearchParams();

    // Add required fields
    queryParams.append("populate[0]", "CoverImage");
    queryParams.append("populate[1]", "product_main_category");
    queryParams.append("populate[2]", "product_variations");
    queryParams.append("populate[3]", "product_variations.product_stock");
    queryParams.append("populate[4]", "product_variations.general_discounts");
    queryParams.append("fields[0]", "Title");
    queryParams.append("fields[1]", "Slug");
    queryParams.append("fields[2]", "Description");
    queryParams.append("fields[3]", "Status");

    // Add pagination
    queryParams.append("pagination[page]", page);
    queryParams.append("pagination[pageSize]", "30"); // Match server-side pageSize

    // Add filters
    queryParams.append("filters[Status][$eq]", "Active");
    queryParams.append("filters[removedAt][$null]", "true");

    // Filter for products with valid prices (Price > 0)
    // Note: We can't filter for CoverImage at API level (relations don't support $notNull in REST API)
    // So we do post-fetch filtering for images, which is why we fetch more products (60) than we display
    queryParams.append("filters[product_variations][Price][$gt]", "0");

    // Category filter
    if (category) {
      queryParams.append("filters[product_main_category][Slug][$eq]", category);
    }

    // Availability filter - check for actual stock (Count > 0) not just IsPublished
    if (available === "true") {
      queryParams.append("filters[product_variations][product_stock][Count][$gt]", "0");
    }

    // Price range filters
    if (minPrice) {
      queryParams.append("filters[product_variations][Price][$gte]", minPrice);
    }
    if (maxPrice) {
      queryParams.append("filters[product_variations][Price][$lte]", maxPrice);
    }

    // Size filter
    if (size) {
      queryParams.append("filters[product_variations][Size][$eq]", size);
    }

    // Material filter
    if (material) {
      queryParams.append("filters[product_variations][Material][$eq]", material);
    }

    // Season filter
    if (season) {
      queryParams.append("filters[product_variations][Season][$eq]", season);
    }

    // Gender filter
    if (gender) {
      queryParams.append("filters[product_variations][Gender][$eq]", gender);
    }

    // Usage filter
    if (usage) {
      queryParams.append("filters[product_variations][Usage][$eq]", usage);
    }

    if (discountOnly === "true") {
      queryParams.append(
        "filters[$or][0][product_variations][general_discounts][id][$notNull]",
        "true",
      );
      queryParams.append(
        "filters[$or][1][product_variations][DiscountPrice][$gt]",
        "0",
      );
    }

    // Sorting - only send to backend if not price sorting (price sorting done on frontend)
    if (sort && sort !== "price:asc" && sort !== "price:desc") {
      queryParams.append("sort[0]", sort);
    }

    // Construct endpoint with query params
    const endpoint = `/products?${queryParams.toString()}`;

    // Use apiClient instead of native fetch for better error handling, retry logic, and consistency
    apiClient
      .getPublic<any>(endpoint, { suppressAuthRedirect: true })
      .then((data) => {
        let productsArray = Array.isArray(data?.data) ? data.data : [];

        // Filter out products without images (can't filter at API level for relations)
        productsArray = productsArray.filter(hasImage);

        if (discountOnly === "true") {
          productsArray = productsArray.filter(productHasDiscount);
        }

        // CRITICAL: Sort products by stock availability FIRST, before any other operations
        // This ensures in-stock products always appear before out-of-stock products
        productsArray.sort((a: any, b: any) => {
          // Helper function to check if product has available stock
          // A product is "in stock" if it has at least one published variation with stock > 0
          const hasStock = (product: any): boolean => {
            if (!product.attributes?.product_variations?.data) return false;

            return product.attributes.product_variations.data.some((variation: any) => {
              // Must be published
              if (!variation.attributes?.IsPublished) return false;

              // Check stock count - handle various data structures
              const stockData = variation.attributes?.product_stock;
              if (!stockData) return false;

              const stockCount = stockData?.data?.attributes?.Count;
              // Check if stockCount exists and is a positive number
              if (typeof stockCount !== "number" || stockCount <= 0) return false;

              return true;
            });
          };

          const aHasStock = hasStock(a);
          const bHasStock = hasStock(b);

          // Products with stock come first
          if (aHasStock && !bHasStock) return -1;
          if (!aHasStock && bHasStock) return 1;
          return 0; // Keep original order if both have same stock status
        });

        // Frontend price sorting (applied after stock sorting)
        if (sort === "price:asc" || sort === "price:desc") {
          const getMinVariationPrice = (product: any): number => {
            const variations = product.attributes?.product_variations?.data || [];
            let minPrice = Infinity;

            for (const variation of variations) {
              // Only consider published variations with stock
              if (!variation.attributes?.IsPublished) continue;

              const stockCount = variation.attributes?.product_stock?.data?.attributes?.Count;
              if (typeof stockCount === "number" && stockCount <= 0) continue;

              // Compute final price with discounts
              const discountResult = computeDiscountForVariation(variation);
              const finalPrice = discountResult?.finalPrice || parseFloat(variation.attributes?.Price || "0");

              if (finalPrice > 0 && finalPrice < minPrice) {
                minPrice = finalPrice;
              }
            }

            return minPrice === Infinity ? 0 : minPrice;
          };

          // Sort by price, but maintain stock priority (in-stock products first)
          productsArray = [...productsArray].sort((a: any, b: any) => {
            // First, check stock status (maintain stock priority)
            const aHasStock = a.attributes?.product_variations?.data?.some((v: any) =>
              v.attributes?.IsPublished &&
              typeof v.attributes?.product_stock?.data?.attributes?.Count === "number" &&
              v.attributes.product_stock.data.attributes.Count > 0
            ) || false;

            const bHasStock = b.attributes?.product_variations?.data?.some((v: any) =>
              v.attributes?.IsPublished &&
              typeof v.attributes?.product_stock?.data?.attributes?.Count === "number" &&
              v.attributes.product_stock.data.attributes.Count > 0
            ) || false;

            // If stock status differs, stock comes first
            if (aHasStock && !bHasStock) return -1;
            if (!aHasStock && bHasStock) return 1;

            // If same stock status, sort by price
            const priceA = getMinVariationPrice(a);
            const priceB = getMinVariationPrice(b);
            return sort === "price:asc" ? priceA - priceB : priceB - priceA;
          });
        }

        if (process.env.NODE_ENV !== "production") {
          console.log("[PLP] Fetched products:", {
            count: productsArray.length,
            endpoint,
            firstProduct: productsArray[0] ? {
              id: productsArray[0].id,
              title: productsArray[0].attributes?.Title,
              slug: productsArray[0].attributes?.Slug,
              hasVariations: !!productsArray[0].attributes?.product_variations?.data?.length,
            } : null,
          });
        }

        setProducts(productsArray);

        const pageNumber = parseInt(page) || data?.meta?.pagination?.page || 1;
        const pageSizeNumber = data?.meta?.pagination?.pageSize || 30;
        const backendPagination = data?.meta?.pagination;

        let totalItems = backendPagination?.total ?? productsArray.length;

        if (discountOnly === "true") {
          const observedTotal = (pageNumber - 1) * pageSizeNumber + productsArray.length;
          totalItems = Math.min(totalItems, observedTotal);
        }

        const pageCount = Math.ceil(totalItems / pageSizeNumber) || 0;

        setPagination({
          page: pageNumber,
          pageSize: pageSizeNumber,
          pageCount,
          total: totalItems,
        });
      })
      .catch((error) => {
        console.error("[PLP] Error fetching products:", {
          error,
          endpoint,
          message: error?.message || "Unknown error",
          status: (error as any)?.status,
        });
        notify.error("خطا در بارگیری محصولات");
        setProducts([]);
        setPagination({
          page: parseInt(page) || 1,
          pageSize: 20,
          pageCount: 0,
          total: 0,
        });
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [
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
    searchQuery,
    discountOnly,
    productHasDiscount,
  ]);

  // Fetch products when dependencies change
  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);



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
            const hasInStockVariation = checkStockAvailability(product);
            if (!(hasValidPrice && hasInStockVariation)) return false;
          } else if (!hasValidPrice) {
            return false;
          }

          // Discount-only filter
          if (discountOnly === "true") {
            if (!productHasDiscount(product)) return false;
          }

          return true;
        } catch (error) {
          console.warn("Error filtering product:", error, product);
          return false;
        }
      }),
    [products, available, discountOnly, productHasDiscount],
  );


  // Memoize sidebar products
  const sidebarProducts = useMemo(
    () =>
      validProducts
        .slice(0, 3)
        .map((product) => {
          try {
            const firstValidVariation = product.attributes.product_variations?.data?.find(
              (variation) => {
                if (!variation?.attributes?.Price) return false;
                const price = parseInt(variation.attributes.Price);
                return !isNaN(price) && price > 0;
              },
            );

            const price = parseInt(firstValidVariation?.attributes?.Price || "0");
            if (isNaN(price) || price <= 0) {
              throw new Error("Invalid price for sidebar product");
            }

            // Check for general_discounts relationship first
            const generalDiscounts = firstValidVariation?.attributes?.general_discounts?.data;
            let discountPrice = undefined;
            let discount = undefined;

            if (
              generalDiscounts &&
              Array.isArray(generalDiscounts) &&
              generalDiscounts.length > 0
            ) {
              // Use general_discounts relationship
              const discountAmount = generalDiscounts[0]?.attributes?.Amount;
              if (typeof discountAmount === "number" && discountAmount > 0) {
                discount = discountAmount;
                discountPrice = Math.round(price * (1 - discountAmount / 100));
              }
            } else if (firstValidVariation?.attributes?.DiscountPrice) {
              // Fallback to DiscountPrice field (if it exists)
              const parsedDiscountPrice = parseInt(firstValidVariation.attributes.DiscountPrice);
              if (!isNaN(parsedDiscountPrice) && parsedDiscountPrice < price) {
                discountPrice = parsedDiscountPrice;
                discount = Math.round(((price - discountPrice) / price) * 100);
              }
            }

            return {
              id: product.id,
              title: product.attributes.Title || "",
              category: product.attributes.product_main_category?.data?.attributes?.Title || "",
              likedCount: product.attributes.RatingCount || 0,
              price: price,
              discountedPrice: discountPrice,
              discount: discount,
              image: product.attributes.CoverImage?.data?.attributes?.url
                ? `${IMAGE_BASE_URL}${product.attributes.CoverImage.data.attributes.url}`
                : "", // Empty string will trigger BlurImage fallback SVG
            };
          } catch (error) {
            console.warn("Error creating sidebar product:", error, product);
            // Return a fallback product object
            return {
              id: product.id,
              title: product.attributes?.Title || "",
              category: "",
              likedCount: 0,
              price: 0,
              discountedPrice: undefined,
              discount: undefined,
              image: "",
            };
          }
        })
        .filter((product) => product.price > 0),
    [validProducts],
  ); // Filter out invalid products

  // Memoize stock availability check
  const checkStockAvailability = useCallback((product: Product) => {
    try {
      if (!product?.attributes?.product_variations?.data) {
        return false;
      }

      return product.attributes.product_variations.data.some((variation) => {
        const attrs = variation?.attributes;
        if (!attrs) {
          return false;
        }

        const stockCount = attrs.product_stock?.data?.attributes?.Count;
        if (typeof stockCount !== "number" || stockCount <= 0) {
          return false;
        }

        return attrs.IsPublished === true;
      });
    } catch (error) {
      console.warn("Error checking stock availability:", error);
      return false;
    }
  }, []);

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

            <SidebarSuggestions title="شاید بپسندید" icon={<HeartIcon />} items={sidebarProducts} />

            <SidebarSuggestions
              title="تخفیف های آخرماه"
              icon={<DiscountIcon />}
              items={sidebarProducts}
            />
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
              {/* Desktop view - ProductCard */}
              <div className="hidden gap-4 md:grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {validProducts.map((product, index) => {
                  // Find the first variation with a valid price
                  const firstValidVariation = product.attributes.product_variations?.data?.find(
                    (variation) => {
                      const price = variation.attributes.Price;
                      return price && parseInt(price) > 0;
                    },
                  );

                  const price = parseInt(firstValidVariation?.attributes?.Price || "0");

                  // Check for general_discounts relationship first
                  const generalDiscounts = firstValidVariation?.attributes?.general_discounts?.data;
                  let discountPrice = undefined;
                  let discount = undefined;

                  if (generalDiscounts && generalDiscounts.length > 0) {
                    // Use general_discounts relationship
                    const discountAmount = generalDiscounts[0].attributes.Amount;
                    discount = discountAmount;
                    discountPrice = Math.round(price * (1 - discountAmount / 100));
                  } else if (firstValidVariation?.attributes?.DiscountPrice) {
                    // Fallback to DiscountPrice field (if it exists)
                    discountPrice = parseInt(firstValidVariation.attributes.DiscountPrice);
                    const hasDiscount = discountPrice && discountPrice < price;
                    discount = hasDiscount
                      ? Math.round(((price - discountPrice) / price) * 100)
                      : undefined;
                  }

                  // Debug: Log pricing calculations for PLP desktop view
                  if (process.env.NODE_ENV !== "production" && (discount || discountPrice)) {
                    console.log(`PLP Desktop - Product ${product.id}:`, {
                      title: product.attributes.Title.substring(0, 30),
                      originalPrice: price,
                      discountPrice,
                      discount,
                      generalDiscounts: generalDiscounts,
                      variationData: firstValidVariation?.attributes,
                    });
                  }

                  const isAvailable = checkStockAvailability(product);
                  const slug = (product as any)?.attributes?.Slug || product.id.toString();

                  return (
                    <ProductCard
                      key={product.id}
                      id={product.id}
                      slug={slug}
                      images={
                        product.attributes.CoverImage?.data?.attributes?.url
                          ? [
                              `${IMAGE_BASE_URL}${product.attributes.CoverImage.data.attributes.url}`,
                            ]
                          : [""] // Empty string will trigger BlurImage fallback SVG
                      }
                      category={
                        product.attributes.product_main_category?.data?.attributes?.Title || ""
                      }
                      title={product.attributes.Title}
                      price={price}
                      seenCount={product.attributes.RatingCount || 0}
                      discount={discount}
                      discountPrice={discountPrice}
                      colorsCount={product.attributes.product_variations?.data?.length || 0}
                      isAvailable={isAvailable}
                      priority={index < 6}
                    />
                  );
                })}
              </div>

              {/* Mobile view - ProductSmallCard */}
              <div className="flex flex-col gap-3 md:hidden">
                {validProducts.map((product, index) => {
                  // Find the first variation with a valid price
                  const firstValidVariation = product.attributes.product_variations?.data?.find(
                    (variation) => {
                      const price = variation.attributes.Price;
                      return price && parseInt(price) > 0;
                    },
                  );

                  const price = parseInt(firstValidVariation?.attributes?.Price || "0");

                  // Check for general_discounts relationship first
                  const generalDiscounts = firstValidVariation?.attributes?.general_discounts?.data;
                  let discountPrice = undefined;
                  let discount = undefined;

                  if (generalDiscounts && generalDiscounts.length > 0) {
                    // Use general_discounts relationship
                    const discountAmount = generalDiscounts[0].attributes.Amount;
                    discount = discountAmount;
                    discountPrice = Math.round(price * (1 - discountAmount / 100));
                  } else if (firstValidVariation?.attributes?.DiscountPrice) {
                    // Fallback to DiscountPrice field (if it exists)
                    discountPrice = parseInt(firstValidVariation.attributes.DiscountPrice);
                    const hasDiscount = discountPrice && discountPrice < price;
                    discount = hasDiscount
                      ? Math.round(((price - discountPrice) / price) * 100)
                      : undefined;
                  }

                  const isAvailable = checkStockAvailability(product);
                  const slug = (product as any)?.attributes?.Slug || product.id.toString();

                  return (
                    <ProductSmallCard
                      key={product.id}
                      id={product.id}
                      slug={slug}
                      title={product.attributes.Title}
                      category={
                        product.attributes.product_main_category?.data?.attributes?.Title || ""
                      }
                      likedCount={product.attributes.RatingCount || 0}
                      price={price}
                      discountedPrice={discountPrice}
                      discount={discount}
                      image={
                        product.attributes.CoverImage?.data?.attributes?.url
                          ? `${IMAGE_BASE_URL}${product.attributes.CoverImage.data.attributes.url}`
                          : "" // Empty string will trigger BlurImage fallback SVG
                      }
                      isAvailable={isAvailable}
                      priority={index < 3}
                    />
                  );
                })}
              </div>

              {/* Pagination */}
              <PLPPagination
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
