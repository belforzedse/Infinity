"use client";

import { IMAGE_BASE_URL } from "@/constants/api";
import NoData from "./NoData";
import dynamic from "next/dynamic";

// Lazy load heavy components
const ProductCard = dynamic(() => import("@/components/Product/Card"), {
  loading: () => <div className="animate-pulse bg-gray-200 h-48 rounded-lg" />,
});
const ProductSmallCard = dynamic(() => import("@/components/Product/SmallCard"), {
  loading: () => <div className="animate-pulse bg-gray-200 h-24 rounded-lg" />,
});
import Filter from "./List/Filter";
import PLPListMobileFilter from "./List/MobileFilter";
import HeartIcon from "./Icons/HeartIcon";
import DiscountIcon from "./Icons/DiscountIcon";
import SidebarSuggestions from "./List/SidebarSuggestions";
import PLPPagination from "./Pagination";
import { useQueryState } from "nuqs";
import { useEffect, useState, useMemo, useCallback } from "react";
import { useDebouncedCallback } from "use-debounce";
import { API_BASE_URL } from "@/constants/api";
import ProductListSkeleton from "@/components/Skeletons/ProductListSkeleton";
// use native fetch so user isn't timed out artificially

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
  const [category, setCategory] = useQueryState("category");
  const [available] = useQueryState("available");
  const [minPrice] = useQueryState("minPrice");
  const [maxPrice] = useQueryState("maxPrice");
  const [size] = useQueryState("size");
  const [material] = useQueryState("material");
  const [season] = useQueryState("season");
  const [gender] = useQueryState("gender");
  const [usage] = useQueryState("usage");
  const [page, setPage] = useQueryState("page", { defaultValue: "1" });
  const [sort] = useQueryState("sort");
  const [discountOnly] = useQueryState("hasDiscount");

  // Local state for products and pagination
  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [pagination, setPagination] = useState<Pagination>(initialPagination);
  const [isLoading, setIsLoading] = useState(false);

  // Initialize category from prop
  useEffect(() => {
    if (initialCategory && !category) {
      setCategory(initialCategory);
    }
  }, [initialCategory, category, setCategory]);

  // Define fetchProducts function with useCallback
  const fetchProducts = useCallback(() => {
    // Skip fetch if this is a search results page managed by server component
    if (searchQuery) {
      return;
    }

    setIsLoading(true);

    // Base URL with required fields and pagination
    const baseUrl = `${API_BASE_URL}/products`;

    // Build query parameters
    const queryParams = new URLSearchParams();

    // Add required fields
    queryParams.append("populate[0]", "CoverImage");
    queryParams.append("populate[1]", "product_main_category");
    queryParams.append("populate[2]", "product_variations");
    queryParams.append("populate[3]", "product_variations.product_stock");

    // Add pagination
    queryParams.append("pagination[page]", page);
    queryParams.append("pagination[pageSize]", "20");

    // Add filters
    queryParams.append("filters[Status][$eq]", "Active");

    // Only show products whose Title contains کیف, کفش, صندل, or کتونی
    // We append the $or filters as separate params to keep URLSearchParams usage
    queryParams.append("filters[$or][0][Title][$containsi]", "کیف");
    queryParams.append("filters[$or][1][Title][$containsi]", "کفش");
    queryParams.append("filters[$or][2][Title][$containsi]", "صندل");
    queryParams.append("filters[$or][3][Title][$containsi]", "کتونی");

    // Category filter
    if (category) {
      queryParams.append(
        "filters[product_main_category][Slug][$eq]",
        category,
      );
    }

    // Availability filter
    if (available === "true") {
      queryParams.append(
        "filters[product_variations][IsPublished][$eq]",
        "true",
      );
    }

    // Price range filters
    if (minPrice) {
      queryParams.append(
        "filters[product_variations][Price][$gte]",
        minPrice,
      );
    }
    if (maxPrice) {
      queryParams.append(
        "filters[product_variations][Price][$lte]",
        maxPrice,
      );
    }

    // Size filter
    if (size) {
      queryParams.append("filters[product_variations][Size][$eq]", size);
    }

    // Material filter
    if (material) {
      queryParams.append(
        "filters[product_variations][Material][$eq]",
        material,
      );
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

    // Sorting
    if (sort) {
      queryParams.append("sort[0]", sort);
    }

    // Construct final URL
    const url = `${baseUrl}?${queryParams.toString()}`;

    fetch(url)
      .then((response) => response.json())
      .then((data) => {
        setProducts(Array.isArray(data?.data) ? data.data : []);
        setPagination(
          data?.meta?.pagination || {
            page: parseInt(page) || 1,
            pageSize: 20,
            pageCount: 0,
            total: 0,
          },
        );
      })
      .catch((error) => {
        console.error("Error fetching products:", error);
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
  }, [page, category, available, minPrice, maxPrice, size, material, season, gender, usage, sort, searchQuery]);

  // Fetch products when dependencies change
  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  // Memoize expensive filtering operations
  const validProducts = useMemo(() => products.filter((product) => {
    try {
      // Basic product structure validation
      if (!product?.attributes?.product_variations?.data) {
        return false;
      }

      // Check if any variation has a valid price
      const hasValidPrice = product.attributes.product_variations.data.some(
        (variation) => {
          if (!variation?.attributes?.Price) return false;
          const price = parseInt(variation.attributes.Price);
          return !isNaN(price) && price > 0;
        },
      );

      // If showAvailableOnly is true, check if any variation is published AND has stock
      if (available === "true") {
        const hasAvailableVariation = product.attributes.product_variations.data.some(
          (variation) => variation?.attributes?.IsPublished === true,
        );
        const hasStock = checkStockAvailability(product);
        if (!(hasValidPrice && hasAvailableVariation && hasStock)) return false;
      } else if (!hasValidPrice) {
        return false;
      }

      // Discount-only filter
      if (discountOnly === "true") {
        const hasDiscount = product.attributes.product_variations.data.some(
          (variation) => {
            if (!variation?.attributes) return false;

            // Check for general_discounts first
            const generalDiscounts = variation.attributes.general_discounts?.data;
            if (generalDiscounts && Array.isArray(generalDiscounts) && generalDiscounts.length > 0) {
              return true;
            }

            // Fallback to DiscountPrice field
            const price = parseFloat(variation.attributes.Price || "0");
            const discountPrice = variation.attributes.DiscountPrice
              ? parseFloat(variation.attributes.DiscountPrice)
              : null;
            return discountPrice && !isNaN(discountPrice) && !isNaN(price) && discountPrice < price;
          }
        );
        if (!hasDiscount) return false;
      }

      return true;
    } catch (error) {
      console.warn('Error filtering product:', error, product);
      return false;
    }
  }), [products, available, discountOnly]);

  // Memoize sidebar products
  const sidebarProducts = useMemo(() => validProducts.slice(0, 3).map((product) => {
    try {
      const firstValidVariation = product.attributes.product_variations?.data?.find((variation) => {
        if (!variation?.attributes?.Price) return false;
        const price = parseInt(variation.attributes.Price);
        return !isNaN(price) && price > 0;
      });

      const price = parseInt(firstValidVariation?.attributes?.Price || "0");
      if (isNaN(price) || price <= 0) {
        throw new Error('Invalid price for sidebar product');
      }

      // Check for general_discounts relationship first
      const generalDiscounts = firstValidVariation?.attributes?.general_discounts?.data;
      let discountPrice = undefined;
      let discount = undefined;

      if (generalDiscounts && Array.isArray(generalDiscounts) && generalDiscounts.length > 0) {
        // Use general_discounts relationship
        const discountAmount = generalDiscounts[0]?.attributes?.Amount;
        if (typeof discountAmount === 'number' && discountAmount > 0) {
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
        title: product.attributes.Title || '',
        category: product.attributes.product_main_category?.data?.attributes?.Title || "",
        likedCount: product.attributes.RatingCount || 0,
        price: price,
        discountedPrice: discountPrice,
        discount: discount,
        image: product.attributes.CoverImage?.data?.attributes?.url ? `${IMAGE_BASE_URL}${product.attributes.CoverImage.data.attributes.url}` : '/images/placeholders/product-placeholder.png',
      };
    } catch (error) {
      console.warn('Error creating sidebar product:', error, product);
      // Return a fallback product object
      return {
        id: product.id,
        title: product.attributes?.Title || 'محصول نامشخص',
        category: '',
        likedCount: 0,
        price: 0,
        discountedPrice: undefined,
        discount: undefined,
        image: '',
      };
    }
  }).filter(product => product.price > 0), [validProducts]); // Filter out invalid products

  // Memoize stock availability check
  const checkStockAvailability = useCallback((product: Product) => {
    try {
      if (!product?.attributes?.product_variations?.data) {
        return false;
      }

      return product.attributes.product_variations.data.some(
        (variation) => {
          if (!variation?.attributes) {
            return false;
          }

          const stockData = variation.attributes.product_stock?.data;
          if (!stockData?.attributes) {
            return false;
          }

          const stockCount = stockData.attributes.Count;
          return typeof stockCount === 'number' && stockCount > 0;
        }
      );
    } catch (error) {
      console.warn('Error checking stock availability:', error);
      return false;
    }
  }, []);

  return (
    <div className="container mx-auto px-4" data-plp-top>
      <div className="flex flex-col gap-4 md:flex-row">
        {/* Sidebar with filters - Desktop only */}
        <div className="hidden w-[269px] flex-col gap-7 md:flex">
          <Filter showAvailableOnly={available === "true"} />

          <SidebarSuggestions
            title="شاید بپسندید"
            icon={<HeartIcon />}
            items={sidebarProducts}
          />

          <SidebarSuggestions
            title="تخفیف های آخرماه"
            icon={<DiscountIcon />}
            items={sidebarProducts}
          />
        </div>

        {/* Main content */}
        <div className="flex-1">
          {/* Mobile filter buttons */}
          <div className="mb-4 md:hidden">
            <PLPListMobileFilter />
          </div>

          {/* Show search results title if search query exists */}
          {searchQuery && (
            <div className="mb-6">
              <h2 className="text-xl font-semibold">
                نتایج جستجو برای: &quot;{searchQuery}&quot;
              </h2>
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
              <div className="hidden grid-cols-2 gap-4 md:grid md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-4">
                {validProducts.map((product, index) => {
                  // Find the first variation with a valid price
                  const firstValidVariation =
                    product.attributes.product_variations?.data?.find(
                      (variation) => {
                        const price = variation.attributes.Price;
                        return price && parseInt(price) > 0;
                      },
                    );

                  const price = parseInt(
                    firstValidVariation?.attributes?.Price || "0",
                  );

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
                      variationData: firstValidVariation?.attributes
                    });
                  }

                  const isAvailable = checkStockAvailability(product);

                  return (
                    <ProductCard
                      key={product.id}
                      id={product.id}
                      images={product.attributes.CoverImage?.data?.attributes?.url ? [
                        `${IMAGE_BASE_URL}${product.attributes.CoverImage.data.attributes.url}`,
                      ] : ['/images/placeholders/product-placeholder.png']}
                      category={
                        product.attributes.product_main_category?.data
                          ?.attributes?.Title || ""
                      }
                      title={product.attributes.Title}
                      price={price}
                      seenCount={product.attributes.RatingCount || 0}
                      discount={discount}
                      discountPrice={discountPrice}
                      colorsCount={
                        product.attributes.product_variations?.data?.length || 0
                      }
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
                  const firstValidVariation =
                    product.attributes.product_variations?.data?.find(
                      (variation) => {
                        const price = variation.attributes.Price;
                        return price && parseInt(price) > 0;
                      },
                    );

                  const price = parseInt(
                    firstValidVariation?.attributes?.Price || "0",
                  );

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

                  return (
                    <ProductSmallCard
                      key={product.id}
                      id={product.id}
                      title={product.attributes.Title}
                      category={
                        product.attributes.product_main_category?.data
                          ?.attributes?.Title || ""
                      }
                      likedCount={product.attributes.RatingCount || 0}
                      price={price}
                      discountedPrice={discountPrice}
                      discount={discount}
                      image={product.attributes.CoverImage?.data?.attributes?.url ? `${IMAGE_BASE_URL}${product.attributes.CoverImage.data.attributes.url}` : '/images/placeholders/product-placeholder.png'}
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
