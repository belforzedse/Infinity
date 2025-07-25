"use client";

import { UpsertPageConfigType } from "@/components/SuperAdmin/UpsertPage/ContentWrapper/index";
import { Navigation, NavigationCategory } from "@/types/super-admin/navigation";
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
        className="flex-1 px-5 py-2 text-sm text-slate-500 bg-slate-200 rounded-xl md:flex-none"
        onClick={props.onCancel}
      >
        بیخیال شدن
      </button>

      <button
        className="flex-1 px-5 py-2 text-sm text-white bg-actions-primary rounded-xl md:flex-none"
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
                  دسته بندی‌های انتخاب شده در منوی ناوبری دسکتاپ و موبایل نمایش
                  داده می‌شوند. ترتیب آیتم‌ها مهم است.
                </span>
              ),
            },
          ],
        },
      ],
    },
  ],
};
