import { useEffect, useState } from "react";
import { useAtom, useSetAtom } from "jotai";
import {
  editProductDataAtom,
  productCategoryDataAtom,
  productCategoryDataAtomPagination,
  productDataAtom,
} from "@/atoms/super-admin/products";
import { getAllCategories } from "@/services/super-admin/product/cetegory/getAll";
import {
  CategoryData,
  createCategory,
} from "@/services/super-admin/product/cetegory/create";
import { categoryResponseType } from "@/services/super-admin/product/cetegory/getAll";
import { usePathname } from "next/navigation";

interface UseProductCategoryProps {
  isEditMode?: boolean;
}

export function useProductCategory(props?: UseProductCategoryProps) {
  const { isEditMode = false } = props || {};

  const [CategoriesData, setCategoriesData] = useAtom(productCategoryDataAtom);
  const setCategoriesDataPagination = useSetAtom(
    productCategoryDataAtomPagination
  );
  const [productData, setProductData] = useAtom(
    isEditMode ? editProductDataAtom : productDataAtom
  );
  const pathname = usePathname();

  const [categorySearchQuery, setCategorySearchQuery] = useState("");
  const [categoryOptions, setCategoryOptions] =
    useState<categoryResponseType[]>(CategoriesData);

  const [isGetCategoriesLoading, setIsGetCategoriesLoading] = useState(false);
  const [isCreateCategoryLoading, setIsCreateCategoryLoading] = useState(false);

  useEffect(() => {
    setCategoryOptions(CategoriesData);
  }, [CategoriesData]);

  useEffect(() => {
    if (
      !pathname.endsWith("/add") &&
      productData.product_other_categories?.length > 0
    ) {
      setCategoryOptions(
        CategoriesData.filter(
          (category) =>
            !productData.product_other_categories.some(
              (selectedCat) => selectedCat.id === category.id
            )
        )
      );
    }
  }, [pathname, productData.product_other_categories, CategoriesData]);

  const fetchAllCategories = async () => {
    setIsGetCategoriesLoading(true);
    try {
      const categories = await getAllCategories();
      setCategoriesData((categories as any).data);
      setCategoriesDataPagination((categories as any).meta);
    } finally {
      setIsGetCategoriesLoading(false);
    }
  };

  const filteredTags =
    categorySearchQuery === ""
      ? categoryOptions
      : categoryOptions.filter((category) =>
          category.attributes.Title.replace(/\s/g, "")
            .toLowerCase()
            .includes(categorySearchQuery.replace(/\s/g, "").toLowerCase())
        );

  const handleSelectOtherCategory = (
    selectedCategory: categoryResponseType | null
  ) => {
    if (!selectedCategory) {
      return;
    }

    if (
      !productData.product_other_categories.find(
        (cat) => cat.id === selectedCategory.id
      ) &&
      categoryOptions.find((cat) => cat.id === selectedCategory.id)
    ) {
      const updatedCategories = [
        ...(productData as any).product_other_categories,
        selectedCategory,
      ];
      setCategoryOptions(
        categoryOptions.filter(
          (category) => category.id !== selectedCategory.id
        )
      );
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
    const updatedCategories = (
      productData as any
    ).product_other_categories.filter(
      (category: categoryResponseType) => category.id !== categoryToRemove.id
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
