"use client";

import React, { useEffect, useState } from "react";
import { apiClient } from "@/services";
import { API_BASE_URL, IMAGE_BASE_URL, ENDPOINTS } from "@/constants/api";
import SearchIcon from "@/components/Search/Icons/SearchIcon";

export type ProductVariation = {
  id: number;
  Price: number;
  DiscountPrice?: number;
  ProductSKU?: string;
  product_variation_color?: {
    id?: number;
    Title: string;
    data?: {
      id?: number;
      attributes?: {
        Title: string;
      };
    };
  };
  product_variation_size?: {
    id?: number;
    Title: string;
    data?: {
      id?: number;
      attributes?: {
        Title: string;
      };
    };
  };
  product_variation_model?: {
    id?: number;
    Title: string;
    data?: {
      id?: number;
      attributes?: {
        Title: string;
      };
    };
  };
  product_stock?: {
    Count: number;
    data?: {
      attributes?: {
        Count: number;
      };
    };
  };
};

export type Product = {
  id: number;
  Title: string;
  Description: string;
  Price: number;
  ProductSKU?: string;
  product_main_category?: {
    Title: string;
  };
  product_variations?: ProductVariation[];
  CoverImage?: any;
  image?: string;
};

export type OrderItem = {
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
  // IDs for backend relations
  productColorId?: number;
  productSizeId?: number;
  productModelId?: number;
};

interface ProductSearchProps {
  onProductSelect: (product: Product, variation?: ProductVariation) => void;
  selectedItems: OrderItem[];
  enableVariationSelection?: boolean;
}

const ProductSearch: React.FC<ProductSearchProps> = ({
  onProductSelect,
  selectedItems,
  enableVariationSelection = true,
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

          // Process image
          const img = attrs?.CoverImage;

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

          // Calculate price from variations and normalize variation structure
          const rawVariations = attrs?.product_variations?.data || attrs?.product_variations || [];
          const variations = Array.isArray(rawVariations) ? rawVariations.map((v: any) => {
            // Normalize variation structure - handle both Strapi format and flattened format
            const vAttrs = v?.attributes || v;
            const variationId = v?.id || vAttrs?.id;

            // Normalize stock structure
            const stock = vAttrs?.product_stock?.data?.attributes
              || vAttrs?.product_stock?.data
              || vAttrs?.product_stock
              || v?.product_stock;

            // Normalize color, size, model structures - preserve IDs
            const colorData = vAttrs?.product_variation_color?.data;
            const colorAttrs = colorData?.attributes || colorData;
            const colorRaw = vAttrs?.product_variation_color || v?.product_variation_color;
            const color = colorAttrs || colorRaw;

            const sizeData = vAttrs?.product_variation_size?.data;
            const sizeAttrs = sizeData?.attributes || sizeData;
            const sizeRaw = vAttrs?.product_variation_size || v?.product_variation_size;
            const size = sizeAttrs || sizeRaw;

            const modelData = vAttrs?.product_variation_model?.data;
            const modelAttrs = modelData?.attributes || modelData;
            const modelRaw = vAttrs?.product_variation_model || v?.product_variation_model;
            const model = modelAttrs || modelRaw;

            // Extract IDs - try multiple possible structures
            const colorId = colorData?.id || colorRaw?.id || color?.id;
            const sizeId = sizeData?.id || sizeRaw?.id || size?.id;
            const modelId = modelData?.id || modelRaw?.id || model?.id;

            return {
              id: variationId,
              Price: parseFloat(vAttrs?.Price || 0),
              DiscountPrice: vAttrs?.DiscountPrice ? parseFloat(vAttrs.DiscountPrice) : undefined,
              ProductSKU: vAttrs?.SKU || vAttrs?.ProductSKU,
              product_variation_color: color ? {
                ...color,
                id: colorId || color.id,
                Title: color.Title || colorAttrs?.Title || colorRaw?.Title,
              } : undefined,
              product_variation_size: size ? {
                ...size,
                id: sizeId || size.id,
                Title: size.Title || sizeAttrs?.Title || sizeRaw?.Title,
              } : undefined,
              product_variation_model: model ? {
                ...model,
                id: modelId || model.id,
                Title: model.Title || modelAttrs?.Title || modelRaw?.Title,
              } : undefined,
              product_stock: stock,
            };
          }) : [];

          let computedPrice = 0;
          if (variations.length > 0) {
            const prices = variations
              .map((v) => v.Price)
              .filter((p) => !isNaN(p) && p > 0);
            computedPrice = prices.length > 0 ? Math.min(...prices) : 0;
          }

          return {
            id,
            Title: attrs?.Title || raw?.Title,
            Description: attrs?.Description || raw?.Description,
            Price: computedPrice,
            ProductSKU: attrs?.ProductSKU || raw?.ProductSKU,
            product_main_category: attrs?.product_main_category || raw?.product_main_category,
            product_variations: variations,
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
    if (enableVariationSelection && product.product_variations?.length) {
      setSelectedProduct(product);
      return;
    }
    onProductSelect(product);
  };

  const handleVariationSelect = (product: Product, variation: ProductVariation) => {
    onProductSelect(product, variation);
    setSelectedProduct(null);
  };

  return (
    <div className="space-y-4">
      {/* Search Input */}
      <div className="relative">
        <div className="relative flex w-full items-center justify-between rounded-[28px] border border-slate-200 bg-white py-2 pl-2 pr-4 shadow-sm focus-within:ring-2 focus-within:ring-infinity-primary-lighter/60">
          <div className="flex w-full items-center justify-between px-2">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="جستجو محصول با نام یا کد..."
              className="text-sm flex-1 bg-transparent text-right text-neutral-600 placeholder-neutral-400 outline-none"
            />

            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-infinity-primary shadow-sm">
              <SearchIcon className="h-5 w-5 text-white" />
            </div>
          </div>
        </div>
      </div>

      {/* Results */}
      <div className="space-y-2">
        {loading && (
          <div className="text-center py-8 text-slate-500">
            در حال جستجو...
          </div>
        )}

        {!loading && searchQuery.length >= 2 && products.length === 0 && (
          <div className="text-center py-8 text-slate-500">
            محصولی یافت نشد
          </div>
        )}

        {!loading && products.map((product) => (
          <div
            key={product.id}
            className="border border-slate-200 rounded-lg p-4 hover:bg-slate-50 transition-colors"
          >
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 flex-shrink-0">
                {product.image ? (
                  <img
                    src={product.image}
                    alt={product.Title}
                    className="w-16 h-16 object-cover rounded-md"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                      e.currentTarget.nextElementSibling?.classList.remove('hidden');
                    }}
                  />
                ) : null}
                <div className={`w-16 h-16 bg-slate-200 rounded-md flex items-center justify-center ${product.image ? 'hidden' : ''}`}>
                  <svg className="w-8 h-8 text-slate-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
                  </svg>
                </div>
              </div>

              <div className="flex-1">
                <h4 className="font-medium text-slate-900">{product.Title}</h4>
                <p className="text-sm text-slate-600 line-clamp-2">{product.Description}</p>
                <div className="mt-2 flex items-center justify-between">
                  <span className="text-lg font-semibold text-green-600">
                    {formatPrice(product.Price)} تومان
                  </span>
                  {product.product_main_category && (
                    <span className="text-xs text-slate-500 bg-slate-100 px-2 py-1 rounded">
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
                      ? "bg-slate-200 text-slate-500 cursor-not-allowed"
                      : "bg-infinity-primary text-white hover:bg-infinity-primary"
                  }`}
                >
                  {isProductSelected(product.id) ? "انتخاب شده" : "انتخاب"}
                </button>

                {product.product_variations && product.product_variations.length > 0 && (
                  <span className="text-xs text-slate-500">
                    {product.product_variations.length} تنوع
                  </span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {enableVariationSelection && selectedProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="w-full max-w-2xl max-h-[80vh] overflow-y-auto rounded-lg bg-white p-6">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold">انتخاب تنوع محصول</h3>
              <button
                onClick={() => setSelectedProduct(null)}
                className="text-slate-500 hover:text-slate-700"
              >
                ×
              </button>
            </div>

            <div className="mb-4">
              <h4 className="font-medium">{selectedProduct.Title}</h4>
              <p className="text-sm text-slate-600">{selectedProduct.Description}</p>
            </div>

            <div className="space-y-2">
              {selectedProduct.product_variations?.map((variation) => {
                // Extract stock count from different possible structures
                const stockCount = variation.product_stock?.data?.attributes?.Count
                  ?? variation.product_stock?.Count
                  ?? 0;
                const hasStock = stockCount > 0;
                const isDisabled = !hasStock || isProductSelected(selectedProduct.id, variation.id);

                return (
                  <div
                    key={variation.id}
                    className={`border rounded-lg p-3 ${
                      hasStock ? "border-slate-200 hover:bg-slate-50" : "border-red-200 bg-red-50"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          {variation.product_variation_color && (
                            <span className="text-sm text-slate-600">
                              رنگ: {variation.product_variation_color.Title}
                            </span>
                          )}
                          {variation.product_variation_size && (
                            <span className="text-sm text-slate-600">
                              سایز: {variation.product_variation_size.Title}
                            </span>
                          )}
                        </div>
                        <div className="mt-1 flex items-center gap-2">
                          <span className="font-semibold text-green-600">
                            {formatPrice(variation.Price)} تومان
                          </span>
                          <span className={`text-xs ${hasStock ? "text-slate-500" : "text-red-600 font-medium"}`}>
                            موجودی: {stockCount}
                          </span>
                          {!hasStock && (
                            <span className="text-xs text-red-600 font-medium">
                              (ناموجود)
                            </span>
                          )}
                        </div>
                      </div>

                      <button
                        onClick={() => handleVariationSelect(selectedProduct, variation)}
                        disabled={isDisabled}
                        className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                          isDisabled
                            ? "bg-slate-200 text-slate-500 cursor-not-allowed"
                            : "bg-infinity-primary text-white hover:bg-infinity-primary"
                        }`}
                      >
                        {isProductSelected(selectedProduct.id, variation.id) ? "انتخاب شده" : "انتخاب"}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductSearch;
