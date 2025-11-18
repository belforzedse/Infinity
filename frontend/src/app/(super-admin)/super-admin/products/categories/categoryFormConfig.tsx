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
  async (searchTerm?: string, formData?: any): Promise<
    Array<{
      label: string;
      value: string;
    }>
  > => {
    try {
      const response = await getAllCategories();
      // Handle Strapi paginated response structure
      // getAllCategories returns PaginatedResponse<categoryResponseType>
      // which has structure: { data: categoryResponseType[], meta: {...} }
      const categories = response?.data as categoryResponseType[];

      // Debug log in development
      if (process.env.NODE_ENV === "development") {
        console.log("getAllCategories response:", response);
        console.log("Categories array:", categories);
        console.log("Is array?", Array.isArray(categories));
      }

      if (!Array.isArray(categories)) {
        console.warn("Categories is not an array:", categories, "Response:", response);
        return [];
      }

      if (categories.length === 0) {
        console.warn("Categories array is empty");
        return [];
      }

      const options = categories
        .filter((category) => {
          // Exclude the current category being edited
          if (excludeId && category.id === excludeId) {
            return false;
          }
          return true;
        })
        .map((category) => {
          const label = category.attributes?.Title ?? "-";
          const value = String(category.id); // Ensure it's a string

          // Debug log in development
          if (process.env.NODE_ENV === "development") {
            console.log("Mapping category:", { id: category.id, label, value, attributes: category.attributes });
          }

          return { label, value };
        })
        .filter((opt) => opt.label && opt.value); // Filter out invalid options

      // Debug log in development
      if (process.env.NODE_ENV === "development") {
        console.log("Parent category options fetched:", options.length, "options", options);
      }

      return options;
    } catch (error) {
      // Log error for debugging but don't show toast
      console.error("Failed to fetch parent categories:", error);
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
