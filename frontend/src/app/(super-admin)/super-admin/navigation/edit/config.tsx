"use client";

import type { UpsertPageConfigType } from "@/components/SuperAdmin/UpsertPage/ContentWrapper/index";
import type { Navigation, NavigationCategory } from "@/types/super-admin/navigation";
import { getProductCategories } from "@/services/super-admin/navigation/getProductCategories";

// Form data interface that handles both string and array types for product_categories
interface NavigationFormData extends Omit<Navigation, "product_categories"> {
  product_categories: NavigationCategory[] | string;
}

export const config: UpsertPageConfigType<NavigationFormData> = {
  headTitle: "ویرایش ناوبری",
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
      title: "مدیریت دسته بندی‌های منوی ناوبری",
      sections: [
        {
          fields: [
            {
              name: "product_categories",
              type: "categories-list",
              label: "دسته بندی‌های منوی ناوبری",
              colSpan: 12,
              mobileColSpan: 12,
              fetchCategories: getProductCategories,
              helper: () => (
                <span className="text-sm text-actions-primary">
                  دسته بندی‌های انتخاب شده در منوی ناوبری دسکتاپ و موبایل نمایش داده می‌شوند. ترتیب
                  آیتم‌ها مهم است.
                </span>
              ),
            },
          ],
        },
      ],
    },
  ],
};
