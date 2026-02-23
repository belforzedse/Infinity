import { API_BASE_URL, IMAGE_BASE_URL, getStrapiServerUrl } from "@/constants/api";
import Image from "next/image";
import { calculateUniqueColorsCount, getUniqueColorCodes } from "@/services/product/product";
import imageLoader from "@/utils/imageLoader";
import ProductSmallCard from "../Product/SmallCard";
import Link from "next/link";
import PageContainer from "@/components/layout/PageContainer";
import fetchWithTimeout from "@/utils/fetchWithTimeout";

interface PLPHeroBannerProps {
  category?: string;
}

interface ProductData {
  id: number;
  attributes: {
    Title: string;
    SeenCount?: number | null;
    CoverImage?: {
      data?: {
        attributes?: {
          url?: string;
        };
      } | null;
    };
    product_main_category?: {
      data?: {
        attributes?: {
          Title?: string;
          Slug?: string;
        };
      } | null;
    };
    product_variations?: {
      data?: Array<{
        attributes: {
          Price?: string;
          IsPublished?: boolean;
          DiscountPrice?: string;
          general_discounts?: {
            data?: Array<{
              attributes?: {
                Amount?: number;
              };
            }>;
          };
        };
      }>;
    };
  };
}

interface ProcessedProduct {
  id: number;
  title: string;
  category: string;
  likedCount: number;
  price: number;
  discountedPrice: number;
  discount: number;
  image: string;
  colorsCount: number;
  colorCodes: string[];
}

interface CategoryFetchResponse {
  data?: Array<{
    attributes?: {
      Title?: string;
      CoverImage?: {
        data?: {
          attributes?: {
            url?: string;
          };
        } | null;
      };
    };
  }>;
}

const MAX_HERO_PRODUCTS = 8;

// Helper to ensure image URLs have proper format
const formatImageUrl = (path?: string): string => {
  if (!path) return "";

  if (!IMAGE_BASE_URL && path) {
    return path.startsWith("/") ? path : `/${path}`;
  }

  const url = `${IMAGE_BASE_URL}${path}`;
  if (!url.startsWith("http") && !url.startsWith("/")) {
    return `/${url}`;
  }
  return url;
};

const mapProduct = (product: ProductData): ProcessedProduct => {
  const variations = product.attributes.product_variations?.data || [];

  const firstValidVariation = variations.find((variation) => {
    const price = variation.attributes.Price;
    const isPublished = variation.attributes.IsPublished === true;
    return isPublished && price && parseInt(price, 10) > 0;
  });

  if (!firstValidVariation) {
    return {
      id: product.id,
      title: product.attributes.Title,
      category: product.attributes.product_main_category?.data?.attributes?.Title || "",
      likedCount: product.attributes.SeenCount || 0,
      price: 0,
      discountedPrice: 0,
      discount: 0,
      image: formatImageUrl(product.attributes.CoverImage?.data?.attributes?.url),
      colorsCount: calculateUniqueColorsCount(variations || []),
      colorCodes: getUniqueColorCodes(variations || []),
    };
  }

  const hasDiscount =
    firstValidVariation.attributes.general_discounts?.data &&
    firstValidVariation.attributes.general_discounts.data.length > 0;
  const discount =
    hasDiscount && firstValidVariation.attributes.general_discounts?.data
      ? firstValidVariation.attributes.general_discounts.data[0]?.attributes?.Amount || 0
      : 0;
  const price = parseInt(firstValidVariation.attributes.Price || "0", 10);
  const discountedPrice = hasDiscount && discount ? Math.round(price * (1 - discount / 100)) : price;

  return {
    id: product.id,
    title: product.attributes.Title,
    category: product.attributes.product_main_category?.data?.attributes?.Title || "",
    likedCount: product.attributes.SeenCount || 0,
    price,
    discountedPrice,
    discount,
    image: formatImageUrl(product.attributes.CoverImage?.data?.attributes?.url),
    colorsCount: calculateUniqueColorsCount(variations || []),
    colorCodes: getUniqueColorCodes(variations || []),
  };
};

const shuffle = <T,>(items: T[]) => [...items].sort(() => Math.random() - 0.5);

async function fetchJsonWithFallback(path: string, revalidate: number = 120): Promise<any> {
  const internalUrl = `${getStrapiServerUrl()}${path}`;
  const publicUrl = `${API_BASE_URL}${path}`;

  try {
    const response = await fetchWithTimeout(internalUrl, {
      timeoutMs: 10000,
      next: { revalidate },
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        "Accept-Encoding": "gzip",
      },
    });
    return await response.json();
  } catch {
    const response = await fetchWithTimeout(publicUrl, {
      timeoutMs: 10000,
      next: { revalidate },
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        "Accept-Encoding": "gzip",
      },
    });
    return await response.json();
  }
}

async function getFeaturedProducts(category?: string): Promise<ProcessedProduct[]> {
  const params = new URLSearchParams();
  params.append("pagination[page]", "1");
  params.append("pagination[pageSize]", "20");
  params.append("includeMedia", "false");
  params.append("filters[Status][$eq]", "Active");
  params.append("filters[removedAt][$null]", "true");
  params.append("filters[product_variations][Price][$gt]", "0");

  // Feature-biased products (same keywords as previous implementation)
  params.append("filters[$or][0][Title][$containsi]", "کیف");
  params.append("filters[$or][1][Title][$containsi]", "کفش");
  params.append("filters[$or][2][Title][$containsi]", "صندل");
  params.append("filters[$or][3][Title][$containsi]", "کتونی");

  if (category) {
    params.append("filters[product_main_category][Slug][$eq]", category);
  }

  const data = await fetchJsonWithFallback(`/products/plp?${params.toString()}`, 120);
  if (!Array.isArray(data?.data)) return [];

  return (data.data as ProductData[])
    .map(mapProduct)
    .filter((product) => product.price > 0 && product.image && product.image !== "");
}

async function getRandomProducts(): Promise<ProcessedProduct[]> {
  const params = new URLSearchParams();
  params.append("pagination[page]", "1");
  params.append("pagination[pageSize]", "24");
  params.append("includeMedia", "false");
  params.append("filters[Status][$eq]", "Active");
  params.append("filters[removedAt][$null]", "true");
  params.append("filters[product_variations][Price][$gt]", "0");

  const data = await fetchJsonWithFallback(`/products/plp?${params.toString()}`, 120);
  if (!Array.isArray(data?.data)) return [];

  const mapped = (data.data as ProductData[])
    .map(mapProduct)
    .filter((product) => product.price > 0 && product.image && product.image !== "");

  return shuffle(mapped).slice(0, MAX_HERO_PRODUCTS);
}

async function getCategoryMeta(category?: string): Promise<{ title: string; imageUrl: string }> {
  if (!category) {
    return { title: "همه محصولات", imageUrl: "/images/PLP.webp" };
  }

  try {
    const params = new URLSearchParams();
    params.append("filters[Slug][$eq]", category);
    params.append("fields[0]", "Title");
    params.append("populate[0]", "CoverImage");

    const data = (await fetchJsonWithFallback(
      `/product-categories?${params.toString()}`,
      600,
    )) as CategoryFetchResponse;

    const attrs = data?.data?.[0]?.attributes;
    const title = attrs?.Title || "همه محصولات";
    const imageUrl = attrs?.CoverImage?.data?.attributes?.url
      ? formatImageUrl(attrs.CoverImage.data.attributes.url)
      : "/images/PLP.webp";

    return { title, imageUrl: imageUrl || "/images/PLP.webp" };
  } catch {
    return { title: "همه محصولات", imageUrl: "/images/PLP.webp" };
  }
}

export default async function PLPHeroBanner({ category }: PLPHeroBannerProps) {
  const [categoryMeta, featured] = await Promise.all([
    getCategoryMeta(category),
    getFeaturedProducts(category),
  ]);

  const featuredProducts = featured.length > 0 ? shuffle(featured).slice(0, MAX_HERO_PRODUCTS) : await getRandomProducts();
  const visibleProducts = featuredProducts.slice(0, MAX_HERO_PRODUCTS);

  return (
    <div className="w-full rounded-2xl bg-slate-50 py-4">
      <PageContainer
        variant="wide"
        disablePadding
        className="space-y-3 bg-transparent px-4 pb-0 md:px-4"
      >
        <div className="flex flex-col gap-3 md:flex-row">
          <div className="hidden xl:grid xl:flex-1 xl:grid-cols-3 xl:justify-items-center xl:gap-3 2xl:grid-cols-4">
            {visibleProducts.map((product, index) => (
              <div key={product.id} className={index >= 6 ? "hidden 2xl:block" : "block"}>
                <ProductSmallCard {...product} />
              </div>
            ))}
          </div>

          <Link href="/" className="flex-shrink-0">
            <div className="relative h-[244px] w-full overflow-hidden rounded-2xl md:w-[517px]">
              {categoryMeta.imageUrl && (
                <Image
                  src={categoryMeta.imageUrl}
                  alt={categoryMeta.title}
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, 517px"
                  priority
                  loader={categoryMeta.imageUrl.startsWith("http") ? imageLoader : undefined}
                />
              )}
            </div>
          </Link>
        </div>
      </PageContainer>
    </div>
  );
}
