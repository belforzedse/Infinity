"use client";

import type { UpsertPageConfigType } from "@/components/SuperAdmin/UpsertPage/ContentWrapper";
import type { categoryResponseType } from "@/services/super-admin/product/category/getAll";
import { getAllCategories } from "@/services/super-admin/product/category/getAll";

export type ProductCategoryForm = {
  id: string;
  Title: string;
  Slug: string;
  Parent: string;
  createdAt: Date;
  updatedAt: Date;
};

type ConfigOptions = {
  mode: "create" | "edit";
  excludeId?: number;
};

const createParentOptionsFetcher =
  (excludeId?: number) =>
  async (): Promise<
    Array<{
      label: string;
      value: string;
    }>
  > => {
    try {
      const response = await getAllCategories();
      // Handle Strapi paginated response structure
      // response.data contains the array of categories
      const categories = (response as any)?.data as categoryResponseType[];

      if (!Array.isArray(categories)) {
        console.warn("Categories is not an array:", categories);
        return [];
      }

      return categories
        .filter((category) => category.id !== excludeId)
        .map((category) => ({
          label: category.attributes.Title ?? "-",
          value: category.id.toString(),
        }));
    } catch (error) {
      // Silently fail - don't show error toast for dropdown options
      // This prevents multiple error messages when the form loads
      console.error("Failed to fetch parent categories (silent):", error);
      // Return empty array instead of throwing, so form still loads
      return [];
    }
  };

export const getCategoryFormConfig = (
  options: ConfigOptions,
): UpsertPageConfigType<ProductCategoryForm> => {
  const { mode, excludeId } = options;

  return {
    headTitle: mode === "create" ? "افزودن دسته‌بندی" : "ویرایش دسته‌بندی",
    addButton:
      mode === "edit"
        ? {
            text: "افزودن دسته‌بندی جدید",
            path: "/super-admin/products/categories/add",
          }
        : undefined,
    actionButtons: ({ onSubmit, onCancel, isLoading }) => (
      <>
        <button
          type="button"
          className="text-sm flex-1 rounded-xl bg-slate-200 px-5 py-2 text-slate-500 md:flex-none"
          onClick={onCancel}
          disabled={isLoading}
        >
          بیخیال شدن
        </button>
        <button
          type="button"
          className="text-sm flex-1 rounded-xl bg-actions-primary px-5 py-2 text-white md:flex-none"
          onClick={onSubmit}
          disabled={isLoading}
        >
          {isLoading ? "در حال ذخیره..." : "ذخیره"}
        </button>
      </>
    ),
    config: [
      {
        title: "اطلاعات دسته‌بندی",
        sections: [
          {
            fields: [
              {
                name: "Title",
                type: "text",
                label: "نام",
                colSpan: 12,
                mobileColSpan: 12,
              },
              {
                name: "Slug",
                type: "text",
                label: "نامک",
                colSpan: 12,
                mobileColSpan: 12,
              },
              {
                name: "Parent",
                type: "dropdown",
                label: "دسته والد (اختیاری)",
                colSpan: 12,
                mobileColSpan: 12,
                placeholder: "بدون والد",
                options: [],
                fetchOptions: createParentOptionsFetcher(excludeId),
              },
            ],
          },
        ],
      },
    ],
  };
};

export const createEmptyCategoryFormData = (): ProductCategoryForm => ({
  id: "",
  Title: "",
  Slug: "",
  Parent: "",
  createdAt: new Date(),
  updatedAt: new Date(),
});
