import { useEffect, useState } from "react";
import { getProductCategories, type ProductCategorySummary } from "@/services/product/categories";

interface UseProductCategoriesOptions {
  parentOnly?: boolean;
  mainOnly?: boolean;
  /** When true, only categories marked as featured in Strapi (carousel / bottom nav sheet). */
  featuredOnly?: boolean;
  /** When provided, only categories whose name includes one of these substrings are returned. */
  allowedNameSubstrings?: readonly string[];
  initial?: ProductCategorySummary[];
  enabled?: boolean;
}

const categoryRequestCache = new Map<string, Promise<ProductCategorySummary[]>>();
const categoryDataCache = new Map<string, ProductCategorySummary[]>();

const getCategoryCacheKey = (options: Omit<UseProductCategoriesOptions, "initial" | "enabled">) =>
  JSON.stringify({
    parentOnly: options.parentOnly ?? false,
    mainOnly: options.mainOnly ?? false,
    featuredOnly: options.featuredOnly ?? null,
    allowedNameSubstrings: options.allowedNameSubstrings ?? [],
  });

export const useProductCategories = (options: UseProductCategoriesOptions = {}) => {
  const {
    parentOnly = false,
    mainOnly = false,
    featuredOnly,
    allowedNameSubstrings,
    initial,
    enabled = true,
  } = options;
  const cacheKey = getCategoryCacheKey({ parentOnly, mainOnly, featuredOnly, allowedNameSubstrings });
  const cached = categoryDataCache.get(cacheKey);
  const [categories, setCategories] = useState<ProductCategorySummary[]>(initial ?? cached ?? []);
  const [isLoading, setIsLoading] = useState(enabled && !initial && !cached);

  useEffect(() => {
    if (initial) return;
    if (!enabled) return;
    const cachedData = categoryDataCache.get(cacheKey);
    if (cachedData) {
      setCategories(cachedData);
      setIsLoading(false);
      return;
    }
    let isMounted = true;

    const fetchCategories = async () => {
      try {
        setIsLoading(true);
        let request = categoryRequestCache.get(cacheKey);
        if (!request) {
          request = getProductCategories({
            parentOnly,
            mainOnly,
            featuredOnly,
            allowedNameSubstrings,
          });
          categoryRequestCache.set(cacheKey, request);
        }
        const data = await request;
        categoryDataCache.set(cacheKey, data);
        if (!isMounted) return;
        setCategories(data);
      } catch (error) {
        if (!isMounted) return;
        setCategories([]);
      } finally {
        if (!isMounted) return;
        setIsLoading(false);
      }
    };

    fetchCategories();

    return () => {
      isMounted = false;
    };
  }, [initial, enabled, cacheKey, parentOnly, mainOnly, featuredOnly, allowedNameSubstrings]);

  return { categories, isLoading };
};

export default useProductCategories;
