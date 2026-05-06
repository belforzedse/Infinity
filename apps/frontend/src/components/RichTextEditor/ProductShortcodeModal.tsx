"use client";

import React, { useState, useEffect, useCallback } from "react";
import Modal from "@/components/Kits/Modal";
import Tabs from "@/components/Kits/Tabs";
import type { TabItem } from "@/types/Tabs";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { searchProducts, type ProductSearchItem } from "@/services/product/search";
import { getProductBySlug } from "@/services/product/product";
import { IMAGE_BASE_URL } from "@/constants/api";
import { useDebouncedCallback } from "use-debounce";
import SearchSuggestionCard from "@/components/Search/SearchSuggestionCard";
import BlogProductCarousel from "@/components/Blog/BlogProductCarousel";
import { extractProductSlugsFromUrls } from "@/utils/blogShortcodes";
import { Search, Check, Link as LinkIcon } from "lucide-react";
import { faNum } from "@/utils/faNum";

interface ProductShortcodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onInsert: (shortcode: string) => void;
}

interface SelectableProduct extends ProductSearchItem {
  selected: boolean;
}

// Convert ProductDetail to ProductSearchItem format
const convertProductDetailToSearchItem = (productDetail: any): ProductSearchItem => {
  const attrs = productDetail.attributes || productDetail;
  const firstVariation = attrs.product_variations?.data?.[0];

  return {
    id: productDetail.id,
    attributes: {
      Title: attrs.Title || "",
      Slug: attrs.Slug,
      Description: attrs.Description || "",
      product_main_category: attrs.product_main_category,
      product_variations: attrs.product_variations,
      CoverImage: attrs.CoverImage,
    },
    Title: attrs.Title || "",
    Slug: attrs.Slug,
  };
};

const ProductShortcodeModal: React.FC<ProductShortcodeModalProps> = ({
  isOpen,
  onClose,
  onInsert,
}) => {
  const [activeTab, setActiveTab] = useState("1");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchProductsList, setSearchProductsList] = useState<SelectableProduct[]>([]);
  const [isLoadingSearch, setIsLoadingSearch] = useState(false);
  const [urlInput, setUrlInput] = useState("");
  const [urlLoading, setUrlLoading] = useState(false);
  const [urlError, setUrlError] = useState<string | null>(null);
  const [selectedProducts, setSelectedProducts] = useState<Map<number, SelectableProduct>>(new Map());

  const tabs: TabItem[] = [
    { key: "1", value: "جستجو و افزودن" },
    { key: "2", value: "افزودن از URL" },
    { key: "3", value: "پیش‌نمایش" },
  ];

  // Reset state when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setSearchQuery("");
      setSearchProductsList([]);
      setUrlInput("");
      setUrlError(null);
      setActiveTab("1");
    } else {
      // Clear selections when modal closes
      setSelectedProducts(new Map());
    }
  }, [isOpen]);

  // Search products
  const debouncedSearch = useDebouncedCallback(async (query: string) => {
    if (!query.trim()) {
      setSearchProductsList([]);
      return;
    }

    setIsLoadingSearch(true);
    try {
      const response = await searchProducts(query, 1, 20);
      const selectableProducts: SelectableProduct[] = (response.data || []).map((product) => {
        const existing = selectedProducts.get(product.id);
        return {
          ...product,
          selected: existing?.selected || false,
        };
      });
      setSearchProductsList(selectableProducts);
    } catch (error) {
      console.error("Error searching products:", error);
      setSearchProductsList([]);
    } finally {
      setIsLoadingSearch(false);
    }
  }, 500);

  useEffect(() => {
    debouncedSearch(searchQuery);
  }, [searchQuery, debouncedSearch]);

  // Toggle product selection
  const toggleProductSelection = (product: ProductSearchItem) => {
    setSelectedProducts((prev) => {
      const newMap = new Map(prev);
      const existing = newMap.get(product.id);

      if (existing) {
        // Toggle selection
        newMap.set(product.id, { ...existing, selected: !existing.selected });
      } else {
        // Add new product
        newMap.set(product.id, { ...product, selected: true });
      }

      return newMap;
    });

    // Also update search list if product is in it
    setSearchProductsList((prev) =>
      prev.map((p) =>
        p.id === product.id ? { ...p, selected: !p.selected } : p,
      ),
    );
  };

  // Handle URL extraction
  const handleUrlExtract = async () => {
    if (!urlInput.trim()) {
      setUrlError("لطفا URL محصول را وارد کنید");
      return;
    }

    setUrlLoading(true);
    setUrlError(null);

    try {
      const slugs = extractProductSlugsFromUrls(urlInput);

      if (slugs.length === 0) {
        setUrlError("نتوانستیم slug محصول را از URL استخراج کنیم");
        setUrlLoading(false);
        return;
      }

      // Fetch products by slugs
      const productPromises = slugs.map((slug) => getProductBySlug(slug));
      const results = await Promise.allSettled(productPromises);

      const fetchedProducts: ProductSearchItem[] = [];
      const errors: string[] = [];

      results.forEach((result, index) => {
        if (result.status === "fulfilled" && result.value.data) {
          const productItem = convertProductDetailToSearchItem(result.value.data);
          fetchedProducts.push(productItem);
        } else {
          errors.push(`محصول با slug "${slugs[index]}" یافت نشد`);
        }
      });

      if (errors.length > 0 && fetchedProducts.length === 0) {
        setUrlError(errors.join("، "));
      } else {
        // Add fetched products to selection
        fetchedProducts.forEach((product) => {
          setSelectedProducts((prev) => {
            const newMap = new Map(prev);
            if (!newMap.has(product.id)) {
              newMap.set(product.id, { ...product, selected: true });
            }
            return newMap;
          });
        });

        if (errors.length > 0) {
          setUrlError(`برخی محصولات یافت نشدند: ${errors.join("، ")}`);
        } else {
          setUrlError(null);
          setUrlInput(""); // Clear input on success
        }
      }
    } catch (error) {
      console.error("Error extracting products from URLs:", error);
      setUrlError("خطا در استخراج محصولات از URL");
    } finally {
      setUrlLoading(false);
    }
  };

  // Get selected products array
  const getSelectedProductsArray = (): SelectableProduct[] => {
    return Array.from(selectedProducts.values()).filter((p) => p.selected);
  };

  // Generate shortcode with quoted identifiers for Persian slugs
  const generateShortcode = (): string => {
    const selected = getSelectedProductsArray();
    if (selected.length === 0) {
      return "";
    }

    const identifiers = selected.map((product) => {
      const slug = product.attributes?.Slug || product.Slug;
      const identifier = slug || product.id.toString();

      // Quote all non-numeric identifiers to handle Persian slugs safely
      // Pure numeric IDs (like "123") don't need quotes
      const isNumeric = /^\d+$/.test(identifier);

      if (isNumeric) {
        // Unquoted numeric ID
        return identifier;
      } else {
        // Quote non-numeric identifiers (slugs, including Persian)
        // Escape quotes in the identifier
        const escaped = identifier.replace(/"/g, '\\"');
        return `"${escaped}"`;
      }
    });

    return `[products:${identifiers.join(",")}]`;
  };

  // Handle insert
  const handleInsert = () => {
    const shortcode = generateShortcode();
    if (!shortcode) {
      return;
    }

    onInsert(shortcode);
    onClose();
  };

  // Helper functions for product data
  const getImageUrl = (product: ProductSearchItem): string => {
    let coverImage: any = null;
    if (product.attributes?.CoverImage?.data) {
      coverImage = product.attributes.CoverImage.data;
    } else if (product.CoverImage) {
      coverImage = (product.CoverImage as any).data || product.CoverImage;
    }

    if (!coverImage) return "";
    const url = coverImage.formats?.thumbnail?.url || coverImage.attributes?.url || coverImage.url;
    if (!url) return "";
    if (url.startsWith("http")) return url;
    return `${IMAGE_BASE_URL}${url}`;
  };

  const getProductTitle = (product: ProductSearchItem): string => {
    return product.attributes?.Title || product.Title || "";
  };

  const getProductCategory = (product: ProductSearchItem): string => {
    if (product.attributes?.product_main_category?.data?.attributes?.Title) {
      return product.attributes.product_main_category.data.attributes.Title;
    }
    if ((product.product_main_category as any)?.data?.attributes?.Title) {
      return (product.product_main_category as any).data.attributes.Title;
    }
    if ((product.product_main_category as any)?.Title) {
      return (product.product_main_category as any).Title;
    }
    return "";
  };

  const getProductPrice = (product: ProductSearchItem): number | undefined => {
    const variations = product.attributes?.product_variations?.data || product.product_variations;
    if (!variations || !Array.isArray(variations) || variations.length === 0) {
      return undefined;
    }

    const firstVariation = variations[0];
    // Handle both nested (attributes.Price) and flat (Price) formats
    const price = 'attributes' in firstVariation
      ? firstVariation.attributes?.Price
      : 'Price' in firstVariation
        ? firstVariation.Price
        : undefined;

    if (typeof price === "number") return price;
    if (typeof price === "string") {
      const parsed = parseFloat(price);
      return isNaN(parsed) ? undefined : parsed;
    }
    return undefined;
  };

  const getProductDiscountPrice = (product: ProductSearchItem): number | undefined => {
    const variations = product.attributes?.product_variations?.data || product.product_variations;
    if (!variations || !Array.isArray(variations) || variations.length === 0) {
      return undefined;
    }

    const firstVariation = variations[0];
    // Handle both nested (attributes.DiscountPrice) and flat (DiscountPrice) formats
    const discountPrice = 'attributes' in firstVariation
      ? firstVariation.attributes?.DiscountPrice
      : 'DiscountPrice' in firstVariation
        ? firstVariation.DiscountPrice
        : undefined;

    if (typeof discountPrice === "number") return discountPrice;
    if (typeof discountPrice === "string") {
      const parsed = parseFloat(discountPrice);
      return isNaN(parsed) ? undefined : parsed;
    }
    return undefined;
  };

  const getProductDiscount = (product: ProductSearchItem): number | undefined => {
    const price = getProductPrice(product);
    const discountPrice = getProductDiscountPrice(product);
    if (!price || !discountPrice || price <= discountPrice) {
      return undefined;
    }
    return Math.round(((price - discountPrice) / price) * 100);
  };

  const isProductAvailable = (product: ProductSearchItem): boolean => {
    const variations = product.attributes?.product_variations?.data || product.product_variations;
    if (!variations || !Array.isArray(variations)) {
      return false;
    }

    return variations.some((v: any) => {
      const stock = v.attributes?.product_stock?.data?.attributes?.Count ||
                   v.product_stock?.Count;
      return typeof stock === "number" && stock > 0;
    });
  };

  const selectedCount = getSelectedProductsArray().length;
  const selectedProductsArray = getSelectedProductsArray();
  const shortcodeIdentifiers = selectedProductsArray.map((p) => {
    const slug = p.attributes?.Slug || p.Slug;
    // Use slug only if it exists and is not empty
    if (slug && slug.trim().length > 0) {
      return slug;
    }
    // Fallback to ID if no slug
    return p.id.toString();
  });

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="افزودن کاروسل محصولات" className="max-w-4xl">
      <Tabs tabs={tabs} tabsClassName="!bg-transparent">
        {/* Tab 1: Search & Add */}
        <div className="space-y-4">
          <div>
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="جستجوی محصولات (نام محصول)"
              rightElement={<Search className="h-4 w-4 text-neutral-400" />}
              dir="rtl"
            />
          </div>

          <div className="max-h-[400px] overflow-y-auto rounded-xl border border-neutral-200 bg-white">
            {isLoadingSearch ? (
              <div className="py-8 text-center text-sm text-neutral-500">در حال جستجو...</div>
            ) : searchProductsList.length === 0 ? (
              <div className="py-8 text-center text-sm text-neutral-500">
                {searchQuery.trim()
                  ? "محصولی یافت نشد"
                  : "برای جستجوی محصولات، نام محصول را وارد کنید"}
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {searchProductsList.map((product, index) => {
                  const imageUrl = getImageUrl(product);
                  const title = getProductTitle(product);
                  const category = getProductCategory(product);
                  const price = getProductPrice(product);
                  const discountPrice = getProductDiscountPrice(product);
                  const discount = getProductDiscount(product);
                  const isAvailable = isProductAvailable(product);
                  const isSelected = product.selected;

                  return (
                    <div
                      key={product.id}
                      className={`relative ${isSelected ? "bg-pink-50" : ""}`}
                    >
                      <div className="absolute left-3 top-1/2 -translate-y-1/2 z-10">
                        <div
                          className={`flex h-5 w-5 items-center justify-center rounded border ${
                            isSelected
                              ? "border-pink-500 bg-pink-500"
                              : "border-neutral-300 bg-white"
                          }`}
                        >
                          {isSelected && <Check className="h-3 w-3 text-white" />}
                        </div>
                      </div>
                      <SearchSuggestionCard
                        id={product.id}
                        title={title}
                        price={price}
                        discountPrice={discountPrice}
                        discount={discount}
                        category={category}
                        image={imageUrl}
                        isAvailable={isAvailable}
                        onClick={() => toggleProductSelection(product)}
                        index={index}
                        isActive={isSelected}
                        query={searchQuery}
                      />
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Tab 2: Add by URL */}
        <div className="space-y-4">
          <div>
            <label className="mb-2 block text-sm font-medium text-neutral-700">
              URL محصول (می‌توانید چند URL را با کاما یا خط جدید جدا کنید)
            </label>
            <textarea
              value={urlInput}
              onChange={(e) => {
                setUrlInput(e.target.value);
                setUrlError(null);
              }}
              placeholder="https://new.infinitycolor.co/pdp/product-slug&#10;یا&#10;/pdp/product-slug"
              className="w-full rounded-lg border border-neutral-200 bg-white p-3 text-sm text-neutral-800 focus:border-pink-500 focus:outline-none focus:ring-1 focus:ring-pink-500"
              rows={4}
              dir="ltr"
            />
            {urlError && (
              <p className="mt-2 text-sm text-red-600">{urlError}</p>
            )}
          </div>

          <Button
            type="button"
            variant="primary"
            onClick={handleUrlExtract}
            disabled={urlLoading || !urlInput.trim()}
            className="w-full"
          >
            {urlLoading ? "در حال استخراج..." : "استخراج و افزودن محصولات"}
          </Button>

          {selectedCount > 0 && (
            <div className="rounded-lg border border-neutral-200 bg-neutral-50 p-3">
              <p className="text-sm text-neutral-600">
                <span className="font-medium text-pink-600">{selectedCount}</span> محصول انتخاب شده
              </p>
            </div>
          )}
        </div>

        {/* Tab 3: Preview */}
        <div className="space-y-4">
          {selectedCount === 0 ? (
            <div className="py-12 text-center text-sm text-neutral-500">
              هیچ محصولی انتخاب نشده است. لطفا از تب‌های دیگر محصولات را انتخاب کنید.
            </div>
          ) : shortcodeIdentifiers.length === 0 ? (
            <div className="py-12 text-center text-sm text-neutral-500">
              خطا در تولید شناسه‌های محصول
            </div>
          ) : (
            <div className="rounded-lg border border-neutral-200 bg-white p-4">
              <h3 className="mb-4 text-sm font-medium text-neutral-700">پیش‌نمایش کاروسل:</h3>
              <div className="mb-2 text-xs text-neutral-500">
                شناسه‌ها: {shortcodeIdentifiers.join(", ")}
              </div>
              <BlogProductCarousel identifiers={shortcodeIdentifiers} showErrors={true} />
            </div>
          )}
        </div>
      </Tabs>

      {/* Footer Actions */}
      <div className="mt-6 flex items-center justify-between border-t border-neutral-200 pt-4">
        <div className="text-sm text-neutral-600">
          {selectedCount > 0 ? (
            <span className="font-medium text-pink-600">{selectedCount} محصول انتخاب شده</span>
          ) : (
            <span>هیچ محصولی انتخاب نشده</span>
          )}
        </div>
        <div className="flex gap-3">
          <Button type="button" variant="outline" onClick={onClose}>
            انصراف
          </Button>
          <Button
            type="button"
            variant="primary"
            onClick={handleInsert}
            disabled={selectedCount === 0}
          >
            افزودن ({selectedCount})
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default ProductShortcodeModal;
