import { useEffect, useState } from "react";
import { getProductCategories, type ProductCategorySummary } from "@/services/product/categories";

interface UseProductCategoriesOptions {
  parentOnly?: boolean;
  mainOnly?: boolean;
  /** When provided, only categories whose name includes one of these substrings are returned. */
  allowedNameSubstrings?: readonly string[];
  initial?: ProductCategorySummary[];
}

export const useProductCategories = (options: UseProductCategoriesOptions = {}) => {
  const { parentOnly = false, mainOnly = false, allowedNameSubstrings, initial } = options;
  const [categories, setCategories] = useState<ProductCategorySummary[]>(initial ?? []);
  const [isLoading, setIsLoading] = useState(!initial);

  useEffect(() => {
    if (initial) return;
    let isMounted = true;

    const fetchCategories = async () => {
      try {
        setIsLoading(true);
        const data = await getProductCategories({
          parentOnly,
          mainOnly,
          allowedNameSubstrings,
        });
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
  }, [initial, parentOnly, mainOnly, allowedNameSubstrings]);

  return { categories, isLoading };
};

export default useProductCategories;
