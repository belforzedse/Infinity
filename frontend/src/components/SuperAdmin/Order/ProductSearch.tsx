"use client";

import React, { useEffect, useState } from "react";
import { apiClient } from "@/services";
import { API_BASE_URL, IMAGE_BASE_URL, ENDPOINTS } from "@/constants/api";
import { motion } from "framer-motion";
import SearchIcon from "@/components/Search/Icons/SearchIcon";

type Product = {
  id: number;
  Title: string;
  Description: string;
  Price: number;
  ProductSKU?: string;
  product_main_category?: {
    Title: string;
  };
  product_variations?: Array<{
    id: number;
    Price: number;
    DiscountPrice?: number;
    ProductSKU?: string;
    product_variation_color?: {
      Title: string;
    };
    product_variation_size?: {
      Title: string;
    };
    product_variation_model?: {
      Title: string;
    };
    product_stock?: {
      Count: number;
    };
  }>;
  CoverImage?: any;
  image?: string;
};

type OrderItem = {
  id: number;
  productId: number;
  productVariationId?: number;
  productName: string;
  productCode: string;
  price: number;
  quantity: number;
  color?: string;
  size?: string;
  image?: string;
};

interface ProductSearchProps {
  onProductSelect: (product: Product, variation?: any) => void;
  selectedItems: OrderItem[];
}

const ProductSearch: React.FC<ProductSearchProps> = ({
  onProductSelect,
  selectedItems,
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  // Debounced product search
  useEffect(() => {
    let mounted = true;
    const controller = new AbortController();

    const q = searchQuery.trim();
    if (q.length < 2) {
      setProducts([]);
      return;
    }

    setLoading(true);
    const timeout = setTimeout(async () => {
      try {
        const url = `${API_BASE_URL}${ENDPOINTS.PRODUCT.SEARCH}?q=${encodeURIComponent(q)}&page=1&pageSize=20`;
        const res = await fetch(url, {
          method: "GET",
          cache: "no-store",
          headers: { Accept: "application/json" },
          signal: controller.signal,
        });

        if (!mounted) return;
        const json = await res.json();

        const items = (json?.data || []).map((raw: any) => {
          const attrs = raw?.attributes ? raw.attributes : raw;
          const id = raw.id;

          // Process image - Enhanced debugging
          const img = attrs?.CoverImage;
          console.log('Product image data:', { id, img }); // Debug log

          let imageUrl = undefined;
          if (img?.data?.attributes) {
            // Strapi v4 format
            const strapiImg = img.data.attributes;
            const thumb = strapiImg.formats?.thumbnail?.url || strapiImg.formats?.small?.url;
            imageUrl = thumb ? `${IMAGE_BASE_URL}${thumb}` : `${IMAGE_BASE_URL}${strapiImg.url}`;
          } else if (img?.formats) {
            // Direct format object
            const thumb = img.formats.thumbnail?.url || img.formats.small?.url;
            imageUrl = thumb ? `${IMAGE_BASE_URL}${thumb}` : (img.url ? `${IMAGE_BASE_URL}${img.url}` : undefined);
          } else if (img?.url) {
            // Direct URL
            imageUrl = `${IMAGE_BASE_URL}${img.url}`;
          }

          console.log('Final image URL:', imageUrl); // Debug log

          return {
            id,
            Title: attrs?.Title || raw?.Title,
            Description: attrs?.Description || raw?.Description,
            Price: attrs?.Price || raw?.Price || 0,
            ProductSKU: attrs?.ProductSKU || raw?.ProductSKU,
            product_main_category: attrs?.product_main_category || raw?.product_main_category,
            product_variations: attrs?.product_variations || raw?.product_variations || [],
            CoverImage: img,
            image: imageUrl,
          };
        });

        setProducts(items);
      } catch (error) {
        if (!mounted) return;
        setProducts([]);
      } finally {
        if (mounted) setLoading(false);
      }
    }, 300);

    return () => {
      mounted = false;
      clearTimeout(timeout);
      controller.abort();
    };
  }, [searchQuery]);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('fa-IR').format(price);
  };

  const isProductSelected = (productId: number, variationId?: number) => {
    return selectedItems.some(item =>
      item.productId === productId &&
      (variationId ? item.productVariationId === variationId : true)
    );
  };

  const handleProductClick = (product: Product) => {
    if (product.product_variations && product.product_variations.length > 0) {
      setSelectedProduct(product);
    } else {
      onProductSelect(product);
    }
  };

  const handleVariationSelect = (product: Product, variation: any) => {
    onProductSelect(product, variation);
    setSelectedProduct(null);
  };

  return (
    <div className="space-y-4">
      {/* Search Input */}
      <div className="relative">
        <motion.div
          className="relative flex w-full items-center justify-between rounded-[28px] border border-slate-200 bg-white py-2 pl-2 pr-4 shadow-sm focus-within:ring-2 focus-within:ring-pink-200"
        >
          <div className="flex w-full items-center justify-between px-2">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="جستجو محصول با نام یا کد..."
              className="text-sm flex-1 bg-transparent text-right text-neutral-600 placeholder-neutral-400 outline-none"
            />

            <motion.div
              className="flex h-10 w-10 items-center justify-center rounded-full bg-pink-500 shadow-sm"
              whileTap={{ scale: 0.95 }}
            >
              <SearchIcon className="h-5 w-5 text-white" />
            </motion.div>
          </div>
        </motion.div>
      </div>

      {/* Results */}
      <div className="space-y-2">
        {loading && (
          <div className="text-center py-8 text-gray-500">
            در حال جستجو...
          </div>
        )}

        {!loading && searchQuery.length >= 2 && products.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            محصولی یافت نشد
          </div>
        )}

        {!loading && products.map((product) => (
          <div
            key={product.id}
            className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors"
          >
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 flex-shrink-0">
                {product.image ? (
                  <img
                    src={product.image}
                    alt={product.Title}
                    className="w-16 h-16 object-cover rounded-md"
                    onError={(e) => {
                      console.log('Image failed to load:', product.image);
                      e.currentTarget.style.display = 'none';
                      e.currentTarget.nextElementSibling?.classList.remove('hidden');
                    }}
                  />
                ) : null}
                <div className={`w-16 h-16 bg-gray-200 rounded-md flex items-center justify-center ${product.image ? 'hidden' : ''}`}>
                  <svg className="w-8 h-8 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
                  </svg>
                </div>
              </div>

              <div className="flex-1">
                <h4 className="font-medium text-gray-900">{product.Title}</h4>
                <p className="text-sm text-gray-600 line-clamp-2">{product.Description}</p>
                <div className="mt-2 flex items-center justify-between">
                  <span className="text-lg font-semibold text-green-600">
                    {formatPrice(product.Price)} تومان
                  </span>
                  {product.product_main_category && (
                    <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                      {product.product_main_category.Title}
                    </span>
                  )}
                </div>
              </div>

              <div className="flex flex-col items-end gap-2">
                <button
                  onClick={() => handleProductClick(product)}
                  disabled={isProductSelected(product.id)}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    isProductSelected(product.id)
                      ? "bg-gray-200 text-gray-500 cursor-not-allowed"
                      : "bg-pink-500 text-white hover:bg-pink-600"
                  }`}
                >
                  {isProductSelected(product.id) ? "انتخاب شده" : "انتخاب"}
                </button>

                {product.product_variations && product.product_variations.length > 0 && (
                  <span className="text-xs text-gray-500">
                    {product.product_variations.length} تنوع
                  </span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Variation Selection Modal */}
      {selectedProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="w-full max-w-2xl max-h-[80vh] overflow-y-auto rounded-lg bg-white p-6">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold">انتخاب تنوع محصول</h3>
              <button
                onClick={() => setSelectedProduct(null)}
                className="text-gray-500 hover:text-gray-700"
              >
                ×
              </button>
            </div>

            <div className="mb-4">
              <h4 className="font-medium">{selectedProduct.Title}</h4>
              <p className="text-sm text-gray-600">{selectedProduct.Description}</p>
            </div>

            <div className="space-y-2">
              {selectedProduct.product_variations?.map((variation) => (
                <div
                  key={variation.id}
                  className="border border-gray-200 rounded-lg p-3 hover:bg-gray-50"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        {variation.product_variation_color && (
                          <span className="text-sm text-gray-600">
                            رنگ: {variation.product_variation_color.Title}
                          </span>
                        )}
                        {variation.product_variation_size && (
                          <span className="text-sm text-gray-600">
                            سایز: {variation.product_variation_size.Title}
                          </span>
                        )}
                      </div>
                      <div className="mt-1 flex items-center gap-2">
                        <span className="font-semibold text-green-600">
                          {formatPrice(variation.Price)} تومان
                        </span>
                        {variation.product_stock && (
                          <span className="text-xs text-gray-500">
                            موجودی: {variation.product_stock.Count}
                          </span>
                        )}
                      </div>
                    </div>

                    <button
                      onClick={() => handleVariationSelect(selectedProduct, variation)}
                      disabled={isProductSelected(selectedProduct.id, variation.id)}
                      className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                        isProductSelected(selectedProduct.id, variation.id)
                          ? "bg-gray-200 text-gray-500 cursor-not-allowed"
                          : "bg-pink-500 text-white hover:bg-pink-600"
                      }`}
                    >
                      {isProductSelected(selectedProduct.id, variation.id) ? "انتخاب شده" : "انتخاب"}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductSearch;