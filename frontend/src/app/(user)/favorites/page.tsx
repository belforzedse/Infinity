"use client";

import { useCallback, useEffect, useState, useMemo } from "react";
import { useAtom } from "jotai";
import ProductSmallCard from "@/components/Product/SmallCard";
import type { ProductLike } from "@/services/product/product-like";
import ProductLikeService from "@/services/product/product-like";
import { IMAGE_BASE_URL } from "@/constants/api";
import UserContainer from "@/components/layout/UserContainer";
import UserSidebar from "@/components/User/Sidebar";
import AccountQuickLinks from "@/components/User/Account/QuickLinks";
import { likedProductsAtom } from "@/hooks/useProductLike";

export default function FavoritesPage() {
  const [favorites, setFavorites] = useState<ProductLike[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [pageCount, setPageCount] = useState(1);
  const pageSize = 12;

  // Subscribe to global liked products atom for optimistic updates
  const [likedProducts] = useAtom(likedProductsAtom);

  const fetchFavorites = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await ProductLikeService.getUserFavorites(page, pageSize);

      const productLikes = Array.isArray(response.data) ? response.data : [];
      setFavorites(productLikes);
      setPageCount(response.meta?.pagination?.pageCount || 1);
    } catch (err: any) {
      console.error("Error fetching favorites:", err);
      setError(err.message || "خطا در دریافت محصولات مورد علاقه");
    } finally {
      setLoading(false);
    }
  }, [page, pageSize]);

  useEffect(() => {
    fetchFavorites();
  }, [fetchFavorites]);

  // Filter favorites based on global liked products atom for optimistic updates
  const visibleFavorites = useMemo(() => {
    const likedProductIds = new Set(
      likedProducts.map((lp) => lp.product?.id?.toString()).filter(Boolean)
    );

    // Only show favorites that are still in the liked products atom
    // This provides instant updates when items are added/removed
    return favorites.filter((favorite) => {
      const productId = favorite.product?.id?.toString();
      return productId && likedProductIds.has(productId);
    });
  }, [favorites, likedProducts]);

  const mapFavoriteToProps = (favorite: ProductLike) => {
    const product = favorite.product;

    const status =
      (product as any)?.Status ||
      (product as any)?.attributes?.Status;
    const removedAt =
      (product as any)?.removedAt ||
      (product as any)?.attributes?.removedAt;

    if (status && status !== "Active") {
      return null;
    }
    if (removedAt) {
      return null;
    }

    const firstVariation = product.product_variations?.[0];
    const price = firstVariation?.Price || product.price || 0;

    const discountedPrice =
      product.discount && product.discount > 0
        ? (price * (100 - product.discount)) / 100
        : undefined;

    const categoryTitle =
      product.product_main_category?.title || product.product_main_category?.Title || "دسته‌بندی";

    let productImage =
      product.CoverImage?.url ||
      product.images?.[0]?.url ||
      "/images/placeholders/product-placeholder.png";

    if (productImage && productImage.startsWith("/") && !productImage.startsWith("/images")) {
      productImage = `${IMAGE_BASE_URL}${productImage}`;
    }

    const title =
      product.title ||
      product.Title ||
      product.attributes?.Title ||
      product.attributes?.title ||
      "محصول";

    return {
      id: product.id,
      title,
      category: categoryTitle,
      likedCount: 0,
      price: price,
      discountedPrice,
      discount: product.discount || 0,
      image: productImage,
    };
  };

  return (
    <UserContainer className="flex flex-col gap-6 py-6 lg:py-10" dir="rtl">
      <div className="flex flex-col gap-6 lg:flex-row lg:gap-8">
        <aside className="hidden w-full max-w-[240px] flex-shrink-0 lg:block">
          <UserSidebar />
        </aside>

        <main className="flex flex-1 flex-col gap-6">
          <AccountQuickLinks />

          <div className="flex flex-col gap-2">
            <h1 className="text-2xl font-semibold text-foreground-primary lg:text-3xl">
              علاقه‌مندی‌ها
            </h1>
            <p className="text-sm text-slate-500 lg:text-base">
              لیست محصولات مورد علاقه خود را مرور کنید و خریدتان را تکمیل کنید.
            </p>
          </div>

          <section className="flex flex-col gap-5 rounded-2xl border border-slate-200 bg-white px-4 py-4 shadow-sm lg:px-6 lg:py-6">
            {loading ? (
              <div className="flex justify-center p-8">
                <div className="h-10 w-10 animate-spin rounded-full border-b-2 border-t-2 border-pink-500"></div>
              </div>
            ) : error ? (
              <div className="rounded-lg bg-gray-50 p-8 text-center">
                <p className="text-gray-600">{error}</p>
              </div>
            ) : visibleFavorites.length === 0 ? (
              <div className="rounded-lg bg-gray-50 p-8 text-center">
                <p className="text-gray-600">محصولی در لیست علاقه‌مندی‌ها وجود ندارد.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                {visibleFavorites.map((favorite) => {
                  const mapped = mapFavoriteToProps(favorite);
                  if (!mapped) return null;
                  return (
                    <ProductSmallCard
                      key={favorite.id}
                      {...mapped}
                      className="h-full md:!w-full"
                    />
                  );
                })}
              </div>
            )}

            {pageCount > 1 && (
              <div className="mt-4 flex justify-center">
                <div className="flex items-center gap-2">
                  {page > 1 && (
                    <button
                      onClick={() => setPage(page - 1)}
                      className="text-sm rounded-md border border-gray-300 px-3 py-1 hover:bg-gray-50"
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
                      className="text-sm rounded-md border border-gray-300 px-3 py-1 hover:bg-gray-50"
                    >
                      بعدی
                    </button>
                  )}
                </div>
              </div>
            )}
          </section>
        </main>
      </div>
    </UserContainer>
  );
}

