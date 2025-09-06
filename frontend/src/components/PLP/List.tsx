"use client";

import { IMAGE_BASE_URL } from "@/constants/api";
import NoData from "./NoData";
import ProductCard from "@/components/Product/Card";
import ProductSmallCard from "@/components/Product/SmallCard";
import Filter from "./List/Filter";
import PLPListMobileFilter from "./List/MobileFilter";
import HeartIcon from "./Icons/HeartIcon";
import DiscountIcon from "./Icons/DiscountIcon";
import SidebarSuggestions from "./List/SidebarSuggestions";
import PLPPagination from "./Pagination";
import { useQueryState } from "nuqs";
import { useEffect, useState } from "react";
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
          general_discounts?: {
            data: Array<{
              attributes: {
                Amount: number;
              };
            }>;
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

  // Fetch products when filters change
  useEffect(() => {
    // Skip fetch if this is a search results page managed by server component
    if (searchQuery) {
      return;
    }

    const fetchProducts = () => {
      setIsLoading(true);

      // Base URL with required fields and pagination
      const baseUrl = `${API_BASE_URL}/products`;

      // Build query parameters
      const queryParams = new URLSearchParams();

      // Add required fields
      queryParams.append("populate[0]", "CoverImage");
      queryParams.append("populate[1]", "product_main_category");
      queryParams.append("populate[2]", "product_variations");
      queryParams.append("populate[3]", "product_variations.general_discounts");

      // Add pagination
      queryParams.append("pagination[page]", page);
      queryParams.append("pagination[pageSize]", "20");

      // Add filters
      queryParams.append("filters[Status][$eq]", "Active");

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
    };

    fetchProducts();
  }, [
    category,
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
    searchQuery,
  ]);

  // Filter out products with zero price by checking all variations
  const validProducts = products.filter((product) => {
    // Check if any variation has a valid price
    const hasValidPrice = product.attributes.product_variations?.data?.some(
      (variation) => {
        const price = variation.attributes.Price;
        return price && parseInt(price) > 0;
      },
    );

    // If showAvailableOnly is true, also check if any variation is published
    if (available === "true") {
      const hasAvailableVariation =
        product.attributes.product_variations?.data?.some(
          (variation) => variation.attributes.IsPublished,
        );
      if (!(hasValidPrice && hasAvailableVariation)) return false;
    } else if (!hasValidPrice) {
      return false;
    }

    // Discount-only filter
    if (discountOnly === "true") {
      const hasDiscount = product.attributes.product_variations?.data?.some(
        (variation) =>
          (variation.attributes as any)?.general_discounts?.data?.length > 0,
      );
      if (!hasDiscount) return false;
    }

    return true;
  });

  // Create sample products for sidebar suggestions
  const sidebarProducts = validProducts.slice(0, 3).map((product) => {
    const firstValidVariation =
      product.attributes.product_variations?.data?.find((variation) => {
        const price = variation.attributes.Price;
        return price && parseInt(price) > 0;
      });

    const hasDiscount =
      firstValidVariation?.attributes?.general_discounts?.data &&
      firstValidVariation.attributes.general_discounts.data.length > 0;
    const discount =
      hasDiscount && firstValidVariation.attributes.general_discounts?.data
        ? firstValidVariation.attributes.general_discounts.data[0].attributes
            .Amount
        : undefined;
    const price = parseInt(firstValidVariation?.attributes?.Price || "0");
    const discountPrice =
      hasDiscount && discount ? price * (1 - discount / 100) : undefined;

    return {
      id: product.id,
      title: product.attributes.Title,
      category:
        product.attributes.product_main_category?.data?.attributes?.Title || "",
      likedCount: product.attributes.RatingCount || 0,
      price: price,
      discountedPrice: discountPrice,
      discount: discount,
      image: `${IMAGE_BASE_URL}${product.attributes.CoverImage?.data?.attributes?.url}`,
    };
  });

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
              <div className="hidden grid-cols-2 gap-4 md:grid lg:grid-cols-3">
                {validProducts.map((product) => {
                  // Find the first variation with a valid price
                  const firstValidVariation =
                    product.attributes.product_variations?.data?.find(
                      (variation) => {
                        const price = variation.attributes.Price;
                        return price && parseInt(price) > 0;
                      },
                    );

                  const hasDiscount =
                    firstValidVariation?.attributes?.general_discounts?.data &&
                    firstValidVariation.attributes.general_discounts.data
                      .length > 0;
                  const discount =
                    hasDiscount &&
                    firstValidVariation.attributes.general_discounts?.data
                      ? firstValidVariation.attributes.general_discounts.data[0]
                          .attributes.Amount
                      : undefined;
                  const price = parseInt(
                    firstValidVariation?.attributes?.Price || "0",
                  );
                  const discountPrice =
                    hasDiscount && discount
                      ? price * (1 - discount / 100)
                      : undefined;

                  return (
                    <ProductCard
                      key={product.id}
                      id={product.id}
                      images={[
                        `${IMAGE_BASE_URL}${product.attributes.CoverImage?.data?.attributes?.url}`,
                      ]}
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
                    />
                  );
                })}
              </div>

              {/* Mobile view - ProductSmallCard */}
              <div className="flex flex-col gap-3 md:hidden">
                {validProducts.map((product) => {
                  // Find the first variation with a valid price
                  const firstValidVariation =
                    product.attributes.product_variations?.data?.find(
                      (variation) => {
                        const price = variation.attributes.Price;
                        return price && parseInt(price) > 0;
                      },
                    );

                  const hasDiscount =
                    firstValidVariation?.attributes?.general_discounts?.data &&
                    firstValidVariation.attributes.general_discounts.data
                      .length > 0;
                  const discount =
                    hasDiscount &&
                    firstValidVariation.attributes.general_discounts?.data
                      ? firstValidVariation.attributes.general_discounts.data[0]
                          .attributes.Amount
                      : undefined;
                  const price = parseInt(
                    firstValidVariation?.attributes?.Price || "0",
                  );
                  const discountPrice =
                    hasDiscount && discount
                      ? price * (1 - discount / 100)
                      : undefined;

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
                      image={`${IMAGE_BASE_URL}${product.attributes.CoverImage?.data?.attributes?.url}`}
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
