import { useEffect, useState, useCallback } from "react";
import { useAtom, useSetAtom } from "jotai";
import {
  editProductDataAtom,
  productCategoryDataAtom,
  productCategoryDataAtomPagination,
  productDataAtom,
} from "@/atoms/super-admin/products";
import { getAllCategories } from "@/services/super-admin/product/category/getAll";
import type { CategoryData} from "@/services/super-admin/product/category/create";
import { createCategory } from "@/services/super-admin/product/category/create";
import type { categoryResponseType } from "@/services/super-admin/product/category/getAll";
import { usePathname } from "next/navigation";

interface UseProductCategoryProps {
  isEditMode?: boolean;
}

export function useProductCategory(props?: UseProductCategoryProps) {
  const { isEditMode = false } = props || {};

  const [CategoriesData, setCategoriesData] = useAtom(productCategoryDataAtom);
  const setCategoriesDataPagination = useSetAtom(productCategoryDataAtomPagination);
  const [productData, setProductData] = useAtom(isEditMode ? editProductDataAtom : productDataAtom);
  const pathname = usePathname();

  const [categorySearchQuery, setCategorySearchQuery] = useState("");
  const [categoryOptions, setCategoryOptions] = useState<categoryResponseType[]>(CategoriesData || []);

  const [isGetCategoriesLoading, setIsGetCategoriesLoading] = useState(false);
  const [isCreateCategoryLoading, setIsCreateCategoryLoading] = useState(false);

  useEffect(() => {
    setCategoryOptions(CategoriesData || []);
  }, [CategoriesData]);

  useEffect(() => {
    if (!pathname.endsWith("/add") && productData.product_other_categories?.length > 0) {
      const safeCategoriesData = CategoriesData || [];
      setCategoryOptions(
        safeCategoriesData.filter(
          (category) =>
            !productData.product_other_categories.some(
              (selectedCat) => selectedCat.id === category.id,
            ),
        ),
      );
    }
  }, [pathname, productData.product_other_categories, CategoriesData]);

  const fetchAllCategories = useCallback(async () => {
    setIsGetCategoriesLoading(true);
    try {
      const response = await getAllCategories();

      if (process.env.NODE_ENV === "development") {
        console.log("fetchAllCategories: Raw response:", response);
        console.log("fetchAllCategories: Response type:", typeof response);
        console.log("fetchAllCategories: Is array?", Array.isArray(response));
        console.log("fetchAllCategories: Has data property?", response && typeof response === "object" && "data" in response);
      }

      // Handle both cases: direct array or PaginatedResponse object
      let categories: categoryResponseType[] = [];
      let meta = { currentPage: 1, totalPages: 1, totalItems: 0, itemsPerPage: 25 };

      if (Array.isArray(response)) {
        // Response is already an array (direct categories) - this is what we're getting!
        categories = response;
        if (process.env.NODE_ENV === "development") {
          console.log("fetchAllCategories: Response is array, using directly");
        }
      } else if (response && typeof response === "object" && "data" in response) {
        // Response is PaginatedResponse with data and meta
        categories = Array.isArray(response.data) ? response.data : [];
        meta = response.meta || meta;
        if (process.env.NODE_ENV === "development") {
          console.log("fetchAllCategories: Response is PaginatedResponse, extracted data");
        }
      } else {
        if (process.env.NODE_ENV === "development") {
          console.warn("fetchAllCategories: Unexpected response format:", response);
        }
        categories = [];
      }

      if (process.env.NODE_ENV === "development") {
        console.log("fetchAllCategories: Final categories array:", categories);
        console.log("fetchAllCategories: Categories length:", categories.length);
        console.log("fetchAllCategories: About to setCategoriesData with:", categories.length, "items");
      }

      // Set the atom with the categories
      setCategoriesData(categories);
      setCategoriesDataPagination(meta);

      if (process.env.NODE_ENV === "development") {
        console.log("fetchAllCategories: setCategoriesData called with", categories.length, "categories");
      }
    } catch (error) {
      if (process.env.NODE_ENV === "development") {
        console.error("Failed to get product categories:", error);
      }
      setCategoriesData([]);
      // Don't throw error, just log it to prevent crashes
    } finally {
      setIsGetCategoriesLoading(false);
    }
  }, [setCategoriesData, setCategoriesDataPagination]);

  const filteredTags =
    categorySearchQuery === ""
      ? categoryOptions
      : categoryOptions.filter((category) => {
          const query = categorySearchQuery.trim().toLowerCase();
          if (!query) return true;

          const title = (category.attributes.Title || "").toLowerCase();
          const slug = (category.attributes.Slug || "").toLowerCase();

          // Search in both Title and Slug with fuzzy matching
          return title.includes(query) || slug.includes(query);
        });

  const handleSelectOtherCategory = (selectedCategory: categoryResponseType | null) => {
    if (!selectedCategory) {
      return;
    }

    if (
      !productData.product_other_categories.find((cat) => cat.id === selectedCategory.id) &&
      categoryOptions.find((cat) => cat.id === selectedCategory.id)
    ) {
      const updatedCategories = [
        ...(productData as any).product_other_categories,
        selectedCategory,
      ];
      setCategoryOptions(categoryOptions.filter((category) => category.id !== selectedCategory.id));
      setCategorySearchQuery("");
      setProductData({
        ...(productData as any),
        product_other_categories: updatedCategories,
      });
    }
  };

  const createMainCategory = async (category: CategoryData) => {
    try {
      setIsCreateCategoryLoading(true);
      await createCategory(category);
    } finally {
      setIsCreateCategoryLoading(false);
    }
  };

  const removeOtherCategory = (categoryToRemove: categoryResponseType) => {
    const updatedCategories = (productData as any).product_other_categories.filter(
      (category: categoryResponseType) => category.id !== categoryToRemove.id,
    );
    setCategoryOptions([...categoryOptions, categoryToRemove]);
    setProductData({
      ...(productData as any),
      product_other_categories: updatedCategories,
    });
  };

  return {
    selectedCategories: (productData as any).product_other_categories,
    categorySearchQuery,
    categoryOptions,
    filteredTags,
    handleSelectOtherCategory,
    removeOtherCategory,
    setCategorySearchQuery,
    isGetCategoriesLoading,
    setIsGetCategoriesLoading,
    setIsCreateCategoryLoading,
    isCreateCategoryLoading,
    fetchAllCategories,
    createMainCategory,
  };
}
