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
      
      // Debug log in development
      if (process.env.NODE_ENV === "development") {
        console.log("getAllCategories raw response:", response);
        console.log("Response type:", typeof response);
        console.log("Is array?", Array.isArray(response));
        console.log("Has data property?", response && typeof response === 'object' && 'data' in response);
        if (response && typeof response === 'object' && 'data' in response) {
          console.log("response.data:", (response as any).data);
          console.log("response.data is array?", Array.isArray((response as any).data));
        }
      }
      
      // getAllCategories returns PaginatedResponse<categoryResponseType>
      // which is { data: categoryResponseType[], meta: {...} }
      // So response.data should be the array of categories
      let categories: categoryResponseType[] = [];
      
      // Handle the response structure: response is { data: [...], meta: {...} }
      if (response && typeof response === 'object') {
        // Check if response has a 'data' property
        if ('data' in response) {
          const data = (response as any).data;
          if (Array.isArray(data)) {
            categories = data;
          } else if (data && typeof data === 'object' && 'data' in data && Array.isArray(data.data)) {
            // Nested data structure: { data: { data: [...], meta: {...} } }
            categories = data.data;
          }
        } else {
          // Response might be the array directly (shouldn't happen but handle it)
          console.warn("Response doesn't have 'data' property:", response);
        }
      } else if (Array.isArray(response)) {
        // If response is directly an array, use it
        categories = response;
      }

      // Debug log in development
      if (process.env.NODE_ENV === "development") {
        console.log("Categories array after parsing:", categories);
        console.log("Is array?", Array.isArray(categories));
        console.log("Categories length:", categories.length);
        if (categories.length > 0) {
          console.log("First category:", categories[0]);
        }
      }

      if (!Array.isArray(categories) || categories.length === 0) {
        if (process.env.NODE_ENV === "development") {
          console.warn("Categories is not an array or is empty:", categories, "Response:", response);
        }
        return [];
      }

      const options = categories
        .filter((category) => {
          // Exclude the current category being edited
          if (excludeId && category.id === excludeId) {
            return false;
          }
          // Only include categories that have a valid Title
          if (!category.attributes?.Title) {
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
        .filter((opt) => opt.label && opt.value && opt.label !== "-"); // Filter out invalid options

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
