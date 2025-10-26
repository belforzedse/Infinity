// Revalidate every hour to show updated product prices, stock, and search results
export const revalidate = 3600; // 1 hour in seconds

import PLPHeroBanner from "@/components/PLP/HeroBanner";
import PLPList from "@/components/PLP/List";
import { API_BASE_URL } from "@/constants/api";
import fetchWithTimeout from "@/utils/fetchWithTimeout";
import { searchProducts } from "@/services/product/search";
import logger from "@/utils/logger";
import type { Metadata } from "next";

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
          product_stock?: {
            data?: {
              attributes: {
                Count: number;
              };
            };
          };
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

async function getProducts(
  category?: string,
  page = 1,
  pageSize = 20,
  showAvailableOnly = false,
  minPrice?: string,
  maxPrice?: string,
  size?: string,
  material?: string,
  season?: string,
  gender?: string,
  usage?: string,
  search?: string,
  sort?: string,
  hasDiscount?: boolean,
) {
  // Handle search queries differently
  if (search) {
    try {
      // Use the search service
      const searchResults = await searchProducts(search, page, pageSize);
      // Only keep search results where Title contains کیف, کفش, صندل, کتونی, or ونس
      const filtered = searchResults.data.filter((item) => {
        const title = (item.Title || "").toString();
        return /کیف|کفش|صندل|کتونی|ونس/.test(title);
      });

      return {
        products: filtered.map((item) => {
          // Transform search API format to match product data format
          return {
            id: item.id,
            attributes: {
              Title: item.Title,
              Description: item.Description,
              Status: "Active",
              CoverImage: {
                data: {
                  attributes: {
                    url: item.CoverImage?.url,
                  },
                },
              },
              product_main_category: {
                data: {
                  attributes: {
                    Title: item.product_main_category?.Title || "",
                    Slug: "",
                  },
                },
              },
              product_variations: {
                data: item.product_variations.map((variation) => ({
                  attributes: {
                    SKU: "",
                    Price: variation.Price.toString(),
                    DiscountPrice: variation.DiscountPrice?.toString(),
                    IsPublished: true,
                  },
                })),
              },
            },
          };
        }),
        pagination: {
          ...searchResults.meta.pagination,
          total: filtered.length,
        },
      };
    } catch (error) {
      logger.error("Error searching products", { error: String(error) });
      return {
        products: [],
        pagination: {
          page: 1,
          pageSize: pageSize,
          pageCount: 0,
          total: 0,
        },
      };
    }
  }

  // Build query parameters for regular product listing
  const baseUrl = `${API_BASE_URL}/products`;

  // Add required fields
  const queryParams = new URLSearchParams();
  queryParams.append("populate[0]", "CoverImage");
  queryParams.append("populate[1]", "product_main_category");
  queryParams.append("populate[2]", "product_variations");
  queryParams.append("populate[3]", "product_variations.product_stock");
  queryParams.append("populate[4]", "product_variations.general_discounts");

  // Add pagination
  queryParams.append("pagination[page]", page.toString());
  queryParams.append("pagination[pageSize]", pageSize.toString());

  // Add filters
  queryParams.append("filters[Status][$eq]", "Active");

  // Only show products whose Title contains کیف، کفش، صندل، کتونی، or ونس
  queryParams.append("filters[$or][0][Title][$containsi]", "کیف");
  queryParams.append("filters[$or][1][Title][$containsi]", "کفش");
  queryParams.append("filters[$or][2][Title][$containsi]", "صندل");
  queryParams.append("filters[$or][3][Title][$containsi]", "کتونی");
  queryParams.append("filters[$or][4][Title][$containsi]", "ونس");

  // Category filter
  if (category) {
    queryParams.append("filters[product_main_category][Slug][$eq]", category);
  }

  // Price range filters
  if (minPrice) {
    queryParams.append("filters[product_variations][Price][$gte]", minPrice);
  }
  if (maxPrice) {
    queryParams.append("filters[product_variations][Price][$lte]", maxPrice);
  }

  // Availability filter
  if (showAvailableOnly) {
    queryParams.append("filters[product_variations][IsPublished][$eq]", "true");
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

  // Sorting
  if (sort) {
    queryParams.append("sort[0]", sort);
  }

  // Construct final URL
  const url = `${baseUrl}?${queryParams.toString()}`;

  try {
    const response = await fetchWithTimeout(url, {
      timeoutMs: 15000,
      next: { revalidate: 600 }, // Revalidate every 10 minutes (600 seconds)
    });
    const data = await response.json();

    // Filter out products with zero price and check availability if needed
    let filteredProducts = data.data.filter((product: Product) => {
      // Check if any variation has a valid price
      const hasValidPrice = product.attributes.product_variations?.data?.some((variation) => {
        const price = variation.attributes.Price;
        return price && parseInt(price) > 0;
      });

      // If showAvailableOnly is true, also check if any variation has stock
      if (showAvailableOnly) {
        const hasAvailableVariation = product.attributes.product_variations?.data?.some((variation) => {
          const stockCount = variation.attributes.product_stock?.data?.attributes?.Count;
          return typeof stockCount === "number" && stockCount > 0;
        });
        return hasValidPrice && hasAvailableVariation;
      }

      return hasValidPrice;
    });

    // Discount-only filter (post-fetch) if requested
    if (hasDiscount) {
      filteredProducts = filteredProducts.filter((product: Product) =>
        product.attributes.product_variations?.data?.some((variation) => {
          const price = parseFloat(variation.attributes.Price);

          // Check for general_discounts first
          const generalDiscounts = variation.attributes.general_discounts?.data;
          if (generalDiscounts && generalDiscounts.length > 0) {
            return true;
          }

          // Fallback to DiscountPrice field
          const discountPrice = variation.attributes.DiscountPrice
            ? parseFloat(variation.attributes.DiscountPrice)
            : null;
          return discountPrice && discountPrice < price;
        }),
      );
    }

    return {
      products: filteredProducts,
      pagination: data.meta.pagination,
    };
  } catch (error) {
    logger.error("Error fetching products", { error: String(error) });
    return {
      products: [],
      pagination: {
        page: page,
        pageSize,
        pageCount: 0,
        total: 0,
      },
    };
  }
}

export default async function PLPPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  // Await the searchParams object
  const params = await searchParams;

  // Extract parameters with default values
  const category = typeof params.category === "string" ? params.category : undefined;
  const page = typeof params.page === "string" ? parseInt(params.page) : 1;
  const showAvailableOnly =
    typeof params.available === "string" ? params.available === "true" : false;
  const minPrice = typeof params.minPrice === "string" ? params.minPrice : undefined;
  const maxPrice = typeof params.maxPrice === "string" ? params.maxPrice : undefined;
  const size = typeof params.size === "string" ? params.size : undefined;
  const material = typeof params.material === "string" ? params.material : undefined;
  const season = typeof params.season === "string" ? params.season : undefined;
  const gender = typeof params.gender === "string" ? params.gender : undefined;
  const usage = typeof params.usage === "string" ? params.usage : undefined;
  const search = typeof params.search === "string" ? params.search : undefined;
  const sort = typeof params.sort === "string" ? params.sort : undefined;
  const hasDiscount =
    typeof params.hasDiscount === "string" ? params.hasDiscount === "true" : undefined;

  const { products, pagination } = await getProducts(
    category,
    page,
    20,
    showAvailableOnly,
    minPrice,
    maxPrice,
    size,
    material,
    season,
    gender,
    usage,
    search,
    sort,
    hasDiscount,
  );

  // Determine if we're showing search results or category results
  const isSearchResults = !!search;

  return (
    <>
      <div className="mt-3 md:mt-0 md:pb-[80px] md:pt-[38px]">
        {/* Show hero banner only for category browsing, not search results */}
        {!isSearchResults && <PLPHeroBanner category={category} />}

        {/* Show search results or product list */}
        <PLPList
          products={products}
          pagination={pagination}
          category={category}
          searchQuery={search}
        />
      </div>
    </>
  );
}

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}): Promise<Metadata> {
  const params = await searchParams;
  const category = typeof params.category === "string" ? params.category : undefined;
  const search = typeof params.search === "string" ? params.search : undefined;

  const isSearch = !!search;
  const baseTitle = "فروشگاه | اینفینیتی استور";

  if (isSearch) {
    const q = search?.slice(0, 60) || "";
    const title = `نتایج جستجو برای "${q}" | اینفینیتی استور`;
    const description = `مشاهده نتایج جستجو برای «${q}» در فروشگاه اینفینیتی استور. جدیدترین و محبوب‌ترین محصولات.`;
    return {
      title,
      description,
      openGraph: {
        title,
        description,
        type: "website",
        url: `/plp?search=${encodeURIComponent(q)}`,
      },
      alternates: {
        canonical: `/plp${q ? `?search=${encodeURIComponent(q)}` : ""}`,
      },
    };
  }

  if (category) {
    const title = `خرید ${category} | اینفینیتی استور`;
    const description = `خرید ${category} با بهترین قیمت و ارسال سریع از اینفینیتی استور. جدیدترین محصولات ${category}.`;
    return {
      title,
      description,
      openGraph: {
        title,
        description,
        type: "website",
        url: `/plp?category=${encodeURIComponent(category)}`,
      },
      alternates: {
        canonical: `/plp?category=${encodeURIComponent(category)}`,
      },
    };
  }

  return {
    title: baseTitle,
    description: "مشاهده و خرید انواع محصولات با بهترین قیمت در اینفینیتی استور.",
    alternates: { canonical: "/plp" },
  };
}
