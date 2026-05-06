"use client";

import type { UpsertPageConfigType } from "@/components/SuperAdmin/UpsertPage/ContentWrapper";
import {
  getAllCategories,
  type categoryResponseType,
} from "@/services/super-admin/product/category/getAll";
import type { SuperAdminSettings } from "@/types/super-admin/settings";

const fetchFeaturedCategoryOptions = async (
  searchTerm: string,
): Promise<Array<{ label: string; value: string }>> => {
  try {
    const response = await getAllCategories();
    let categories: categoryResponseType[] = [];
    const normalizedResponse: unknown = response;

    if (Array.isArray(normalizedResponse)) {
      categories = normalizedResponse as categoryResponseType[];
    } else if (normalizedResponse && typeof normalizedResponse === "object") {
      const root = normalizedResponse as { data?: unknown };
      if (Array.isArray(root.data)) {
        categories = root.data as categoryResponseType[];
      } else if (root.data && typeof root.data === "object") {
        const nested = root.data as { data?: unknown };
        if (Array.isArray(nested.data)) {
          categories = nested.data as categoryResponseType[];
        }
      }
    }

    const normalized = categories
      .map((category: categoryResponseType) => ({
        label: category.attributes?.Title?.trim() || category.attributes?.Slug?.trim() || "",
        value: category.attributes?.Slug?.trim() || "",
      }))
      .filter((category: { label: string; value: string }) => category.label && category.value);

    const query = searchTerm.trim().toLowerCase();
    const filtered = query
      ? normalized.filter(
          (category: { label: string; value: string }) =>
            category.label.toLowerCase().includes(query) ||
            category.value.toLowerCase().includes(query),
        )
      : normalized;

    return filtered.sort(
      (a: { label: string; value: string }, b: { label: string; value: string }) =>
        a.label.localeCompare(b.label, "fa"),
    );
  } catch {
    return [];
  }
};

export const config: UpsertPageConfigType<SuperAdminSettings> = {
  headTitle: "دسته‌بندی ویژه صفحه اصلی",
  showTimestamp: true,
  actionButtons: (props) => (
    <>
      <button
        className="text-sm flex-1 rounded-xl bg-slate-200 px-5 py-2 text-slate-500 md:flex-none"
        onClick={props.onCancel}
      >
        بیخیال شدن
      </button>

      <button
        className="text-sm flex-1 rounded-xl bg-actions-primary px-5 py-2 text-white md:flex-none"
        onClick={props.onSubmit}
      >
        ذخیره
      </button>
    </>
  ),
  config: [
    {
      title: "تنظیمات بخش شاید بپسندید",
      sections: [
        {
          fields: [
            {
              name: "homeFeaturedCategorySlug",
              type: "dropdown",
              label: "دسته‌بندی",
              colSpan: 12,
              mobileColSpan: 12,
              placeholder: "یک دسته‌بندی انتخاب کنید",
              options: [],
              fetchOptions: fetchFeaturedCategoryOptions,
              helper: () => "این دسته‌بندی برای محصولات و لینک «مشاهده همه» استفاده می‌شود.",
            },
            {
              name: "homeFeaturedCategoryBannerImage",
              type: "image",
              label: "تصویر بنر",
              colSpan: 12,
              mobileColSpan: 12,
              placeholder: "https://...",
              helper: () => "پیشنهاد: تصویر افقی با نسبت 16:9 و حداقل 1200×675.",
            },
          ],
        },
      ],
    },
  ],
};
