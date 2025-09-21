import Breadcrumb from "@/components/Kits/Breadcrumb";
import Hero from "@/components/PDP/Hero";
import OffersList from "@/components/PDP/OffersList";
import FavoriteIcon from "@/components/PDP/Icons/FavoriteIcon";
import PDPComment from "@/components/PDP/Comment";
import { ProductReview } from "@/components/PDP/Comment/List";
import Link from "next/link";
import type { Metadata } from "next";
import { IMAGE_BASE_URL } from "@/constants/api";
import logger from "@/utils/logger";
import {
  getProductBySlug,
  ProductDetail,
  getRelatedProductsByMainCategory,
  getRelatedProductsByOtherCategories,
} from "@/services/product/product";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  try {
    const response = await getProductBySlug(slug);
    const product = response?.data as ProductDetail | undefined;
    const titleRaw = product?.attributes?.Title || "محصول";
    const descRaw = product?.attributes?.Description || titleRaw;
    const description = String(descRaw).slice(0, 160);
    const imageUrl = product?.attributes?.CoverImage?.data?.attributes?.url
      ? `${IMAGE_BASE_URL}${product.attributes.CoverImage.data.attributes.url}`
      : undefined;

    const title = `خرید ${titleRaw} | اینفینیتی استور`;

    return {
      title,
      description,
      openGraph: {
        title,
        description,
        type: "website",
        url: `/pdp/${slug}`,
        images: imageUrl ? [{ url: imageUrl }] : undefined,
      },
      alternates: {
        canonical: `/pdp/${slug}`,
      },
    };
  } catch {
    const fallbackTitle = "مشاهده محصول | اینفینیتی استور";
    return {
      title: fallbackTitle,
      description: "جزئیات و مشخصات کامل محصول در اینفینیتی استور",
      alternates: { canonical: `/pdp/${slug}` },
    };
  }
}

export default async function PDP({ params }: { params: Promise<{ slug: string }> }) {
  // Handle both Promise<{slug}> and direct {slug} parameter formats
  const { slug } = await params;

  // Fetch product data from API
  let productData: ProductDetail | null = null;
  let error = null;

  try {
    // Try fetching by slug (which now uses ID internally)
    const response = await getProductBySlug(slug);
    if (response.data) {
      productData = response.data;
    }
  } catch (err) {
    error = err;
    logger.error("Error fetching product", { error: String(err) });
  }

  // If we still don't have product data, just return a message
  if (!productData && error) {
    return (
      <div className="flex flex-col items-center justify-center gap-8 p-10">
        <h1 className="text-2xl font-bold">محصول مورد نظر یافت نشد</h1>
        <p>لطفا محصول دیگری را انتخاب کنید یا به صفحه اصلی بازگردید.</p>
        <Link href="/" className="text-blue-500">
          بازگشت به صفحه اصلی
        </Link>
      </div>
    );
  }

  // Get category name from either Title or Name field
  const categoryName =
    productData?.attributes.product_main_category?.data?.attributes.Title ||
    productData?.attributes.product_main_category?.data?.attributes.Name ||
    "دسته بندی";

  const categorySlug =
    productData?.attributes.product_main_category?.data?.attributes.Slug || "دسته-بندی";

  const productTitle = productData?.attributes.Title || "محصول";

  // Fetch related products
  const productId = productData?.id.toString() || "";
  const mainCategoryId = productData?.attributes.product_main_category?.data?.id.toString() || "";

  // Get IDs of other categories this product belongs to
  const otherCategoryIds =
    productData?.attributes.product_other_categories?.data?.map((cat) => cat.id.toString()) || [];

  // Fetch related products from same main category and other categories
  let sameMainCategoryProducts: any[] = [];
  let otherCategoriesProducts: any[] = [];

  try {
    // Use Promise.all but handle potential errors for each promise separately
    const results = await Promise.allSettled([
      getRelatedProductsByMainCategory(mainCategoryId, productId),
      getRelatedProductsByOtherCategories(otherCategoryIds, productId),
    ]);

    if (results[0].status === "fulfilled") {
      sameMainCategoryProducts = results[0].value;
    } else {
      logger.error("Error fetching main category products", {
        error: String(results[0].reason),
      });
    }

    if (results[1].status === "fulfilled") {
      otherCategoriesProducts = results[1].value;
    } else {
      logger.error("Error fetching other categories products", {
        error: String(results[1].reason),
      });
    }
  } catch (error) {
    logger.error("Error fetching related products", { error: String(error) });
  }

  // Format product reviews data for the component
  const productReviews: ProductReview[] =
    productData?.attributes.product_reviews?.data.map((review) => {
      // Use a type assertion to treat the API response as having the correct fields
      const reviewAttributes = review.attributes as unknown as {
        Rate: number;
        Content: string;
        createdAt: string;
        LikeCounts: number;
        DislikeCounts: number;
        user: typeof review.attributes.user;
        product_review_replies: typeof review.attributes.product_review_replies;
      };

      return {
        id: review.id,
        attributes: {
          Rate: reviewAttributes.Rate,
          Content: reviewAttributes.Content,
          createdAt: reviewAttributes.createdAt,
          user: reviewAttributes.user,
          LikeCounts: reviewAttributes.LikeCounts || 0,
          DislikeCounts: reviewAttributes.DislikeCounts || 0,
          product_review_replies: reviewAttributes.product_review_replies,
        },
      };
    }) || [];

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-3">
        <Breadcrumb
          breadcrumbs={[
            {
              label: "صفحه اصلی",
              href: "/",
            },
            {
              label: categoryName,
              href: `/plp?category=${categorySlug}`,
            },
            {
              label: productTitle,
            },
          ]}
        />

        <Hero productData={productData} productId={productId} />
      </div>

      {/* Other Products in the same main category */}
      {sameMainCategoryProducts.length > 0 && (
        <OffersList
          icon={<FavoriteIcon />}
          title="شاید بپسندید"
          products={sameMainCategoryProducts}
        />
      )}

      {/* Other Products in other categories */}
      {otherCategoriesProducts.length > 0 && (
        <OffersList
          icon={<FavoriteIcon />}
          title="محصولات مشابه"
          products={otherCategoriesProducts}
        />
      )}

      <PDPComment
        rating={productData?.attributes.AverageRating || 0}
        rateCount={productData?.attributes.RatingCount || 0}
        productReviews={productReviews}
        productId={productId}
      />

      {/* <PDPHeroInfoFAQItem
        title="عنوان توضیحات سئو در این قسمت قرار می گیرد"
        content={
          productData?.attributes.Description ||
          "مانتو زنانه شیک و مجلسی با پارچه نخی درجه یک، مناسب برای استفاده روزمره و مهمانی"
        }
      /> */}
    </div>
  );
}
