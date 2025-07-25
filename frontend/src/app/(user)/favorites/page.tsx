"use client";

import UserSidebar from "@/components/User/Sidebar";
import BreadCrumb from "@/components/User/BreadCrumb";
import { useEffect, useState } from "react";
import ProductSmallCard from "@/components/Product/SmallCard";
import SortIcon from "@/components/User/Icons/SortIcon";
import ProductLikeService, {
  ProductLike,
} from "@/services/product/product-like";
import { IMAGE_BASE_URL } from "@/constants/api";

export default function FavoritesPage() {
  const [favorites, setFavorites] = useState<ProductLike[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [pageCount, setPageCount] = useState(1);
  const pageSize = 12;

  useEffect(() => {
    fetchFavorites();
  }, [page]);

  const fetchFavorites = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await ProductLikeService.getUserFavorites(
        page,
        pageSize
      );

      const productLikes = Array.isArray(response.data) ? response.data : [];
      setFavorites(productLikes);
      setPageCount(response.meta?.pagination?.pageCount || 1);
    } catch (err: any) {
      console.error("Error fetching favorites:", err);
      setError(err.message || "خطا در دریافت محصولات مورد علاقه");
    } finally {
      setLoading(false);
    }
  };

  // Map API product like to the component props format
  const mapFavoriteToProps = (favorite: ProductLike) => {
    const product = favorite.product;

    // Get the first variation's price if available, otherwise fall back to product price
    const firstVariation = product.product_variations?.[0];
    const price = firstVariation?.Price || product.price || 0;

    // Calculate discounted price if discount is available
    const discountedPrice =
      product.discount && product.discount > 0
        ? (price * (100 - product.discount)) / 100
        : undefined;

    // Get the category title if available
    const categoryTitle =
      product.product_main_category?.title ||
      product.product_main_category?.Title ||
      "دسته‌بندی";

    // Get product image and prepend the base URL if the image URL doesn't already have it
    let productImage =
      product.CoverImage?.url ||
      product.images?.[0]?.url ||
      "/images/placeholders/product-placeholder.png";

    // Add base URL only for relative URLs (not for absolute URLs or local placeholder images)
    if (
      productImage &&
      productImage.startsWith("/") &&
      !productImage.startsWith("/images")
    ) {
      productImage = `${IMAGE_BASE_URL}${productImage}`;
    }

    return {
      id: product.id,
      title: product.title || "محصول",
      category: categoryTitle,
      likedCount: 0, // This might not be available in the API
      price: price,
      discountedPrice: discountedPrice,
      discount: product.discount || 0,
      image: productImage,
    };
  };

  return (
    <div
      className="flex min-h-[60vh] bg-white overflow-hidden container mx-auto gap-10 lg:p-0 px-4"
      dir="rtl"
    >
      <UserSidebar />

      <main className="flex-1 overflow-y-auto flex flex-col gap-3">
        <BreadCrumb
          onClick={() => {}}
          hasBackButton={false}
          currentTitle="محصولات مورد علاقه"
          icon={<SortIcon className="w-5 h-5" />}
          nextStepTitle="مرتب سازی"
        />

        <div className="w-full flex flex-col gap-5">
          {loading ? (
            <div className="flex justify-center p-8">
              <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-pink-500"></div>
            </div>
          ) : error ? (
            <div className="bg-gray-50 rounded-lg p-8 text-center">
              <p className="text-gray-600">{error}</p>
            </div>
          ) : favorites.length === 0 ? (
            <div className="bg-gray-50 rounded-lg p-8 text-center">
              <p className="text-gray-600">
                محصولی در لیست علاقه‌مندی‌ها وجود ندارد.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {favorites.map((favorite) => (
                <ProductSmallCard
                  key={favorite.id}
                  {...mapFavoriteToProps(favorite)}
                  className="md:!w-full h-full"
                />
              ))}
            </div>
          )}

          {pageCount > 1 && (
            <div className="flex justify-center mt-4">
              <div className="flex items-center gap-2">
                {page > 1 && (
                  <button
                    onClick={() => setPage(page - 1)}
                    className="px-3 py-1 border border-gray-300 rounded-md hover:bg-gray-50 text-sm"
                  >
                    قبلی
                  </button>
                )}
                <span className="text-sm text-gray-600">
                  صفحه {page} از {pageCount}
                </span>
                {page < pageCount && (
                  <button
                    onClick={() => setPage(page + 1)}
                    className="px-3 py-1 border border-gray-300 rounded-md hover:bg-gray-50 text-sm"
                  >
                    بعدی
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
