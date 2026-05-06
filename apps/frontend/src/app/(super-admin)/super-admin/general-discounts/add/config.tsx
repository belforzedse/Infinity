"use client";

import type { UpsertPageConfigType } from "@/components/SuperAdmin/UpsertPage/ContentWrapper/index";
import { type CouponRule } from "./page";
import { apiClient } from "@/services";

// Define API response types
type ProductVariationResponse = {
  data: Array<{
    id: number;
    attributes: {
      SKU: string;
    };
  }>;
};

type ProductCategoryResponse = {
  data: Array<{
    id: number;
    attributes: {
      Title: string;
    };
  }>;
};

export const config: UpsertPageConfigType<CouponRule> = {
  headTitle: "قانون جدید",
  isActiveBox: {
    key: "isActive",
    header: "وضیعت قانون",
    label: (value) => (value ? "فعال" : "غیرفعال"),
  },
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
      title: "قانون تخفیف",
      sections: [
        {
          fields: [
            {
              name: "type",
              type: "dropdown",
              label: "نوع تخفیف",
              colSpan: 4,
              mobileColSpan: 12,
              options: [
                {
                  label: "تخفیف",
                  value: "Discount",
                },
                {
                  label: "پرداخت نقدی",
                  value: "Cash",
                },
              ],
            },
            {
              name: "amount",
              type: "text",
              label: "میزان",
              colSpan: 4,
              mobileColSpan: 12,
            },
            {
              name: "limitAmount",
              type: "text",
              label: "حداکثر مبلغ",
              colSpan: 4,
              mobileColSpan: 12,
            },
            {
              name: "startDate",
              type: "date",
              label: "شروع",
              colSpan: 6,
              mobileColSpan: 12,
            },
            {
              name: "endDate",
              type: "date",
              label: "انقضا",
              colSpan: 6,
              mobileColSpan: 12,
            },
          ],
        },
        {
          header: {
            title: "شرایط استفاده",
          },
          fields: [
            {
              name: "terms",
              helper: () => (
                <span className="text-sm text-actions-primary">
                  شما می توانید از دسته بندی &quot;محصولات&quot; موارد مد نظر خود را برای اعمال
                  تخفیف از فیلد مقابل انتخاب نمایید.
                </span>
              ),
              type: "terms",
              colSpan: 12,
              mobileColSpan: 12,
              options: [
                {
                  label: "محصول",
                  value: "product",
                },
                {
                  label: "دسته بندی",
                  value: "category",
                },
              ],
              fetchTerms: async (searchTerm: string, category: string) => {
                try {
                  if (category === "product") {
                    const response = await apiClient.get<ProductVariationResponse>(
                      `/product-variations?filters[SKU][$containsi]=${searchTerm}`,
                    );

                    return (response as any).data.map((item: any) => ({
                      label: item.attributes.SKU || `محصول ${item.id}`,
                      value: item.id.toString(),
                    }));
                  } else if (category === "category") {
                    const response = await apiClient.get<ProductCategoryResponse>(
                      `/product-categories?filters[Title][$containsi]=${searchTerm}`,
                    );

                    return (response as any).data.map((item: any) => ({
                      label: item.attributes.Title || `دسته بندی ${item.id}`,
                      value: item.id.toString(),
                    }));
                  }

                  return [];
                } catch (error) {
                  console.error("Error fetching terms:", error);
                  return [];
                }
              },
            },
          ],
        },
      ],
    },
  ],
};
