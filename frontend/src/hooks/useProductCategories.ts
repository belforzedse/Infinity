import { useEffect, useState } from "react";
import { getProductCategories, type ProductCategorySummary } from "@/services/product/categories";

interface UseProductCategoriesOptions {
  parentOnly?: boolean;
  initial?: ProductCategorySummary[];
}

export const useProductCategories = (options: UseProductCategoriesOptions = {}) => {
  const { parentOnly = false, initial } = options;
  const [categories, setCategories] = useState<ProductCategorySummary[]>(initial ?? []);
  const [isLoading, setIsLoading] = useState(!initial);

  useEffect(() => {
    if (initial) return;
    let isMounted = true;

    const fetchCategories = async () => {
      try {
        setIsLoading(true);
        const data = await getProductCategories({ parentOnly });
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
  }, [initial, parentOnly]);

  return { categories, isLoading };
};

export default useProductCategories;
