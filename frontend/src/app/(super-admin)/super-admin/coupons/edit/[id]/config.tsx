"use client";

import type { UpsertPageConfigType } from "@/components/SuperAdmin/UpsertPage/ContentWrapper/index";
import { type Coupon } from "./page";
import { apiClient } from "@/services";

export const config: UpsertPageConfigType<Coupon> = {
  headTitle: "ویرایش کد تخفیف",
  addButton: {
    text: "کد تخفیف جدید",
    path: "/super-admin/coupons/add",
  },
  isActiveBox: {
    key: "isActive",
    header: "وضیعت کد تخفیف",
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
  showTimestamp: true,
  config: [
    {
      title: "قانون تخفیف",
      sections: [
        {
          fields: [
            {
              name: "code",
              type: "text",
              label: "کد تخفیف",
              colSpan: 4,
              mobileColSpan: 12,
            },
            {
              name: "type",
              type: "dropdown",
              label: "نوع تخفیف",
              colSpan: 4,
              mobileColSpan: 12,
              options: [
                {
                  label: "درصدی",
                  value: "Discount",
                },
                {
                  label: "مبلغی",
                  value: "Cash",
                },
              ],
            },
            {
              name: "amount",
              type: "text",
              label: "میزان تخفیف",
              colSpan: 4,
              mobileColSpan: 12,
            },
            {
              name: "limit",
              type: "text",
              label: "محدودیت استفاده",
              colSpan: 6,
              mobileColSpan: 12,
            },
            {
              name: "maxAmount",
              type: "text",
              label: "سقف مبلغی تخفیف",
              colSpan: 6,
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
              fetchTerms: async (searchTerm, category) => {
                if (category === "product") {
                  const res = await apiClient.get(
                    `/product-variations?filters[SKU][$containsi]=${searchTerm}`,
                  );

                  return (res as any).data.map((product: any) => ({
                    label: product.attributes.SKU,
                    value: product.id,
                  }));
                } else {
                  const res = await apiClient.get(
                    `/local-users?filters[Phone][$containsi]=${searchTerm}`,
                  );

                  return (res as any).data.map((user: any) => ({
                    label: user.attributes.Phone,
                    value: user.id,
                  }));
                }
              },
              options: [
                {
                  label: "کاربر",
                  value: "user",
                },
                {
                  label: "محصول",
                  value: "product",
                },
              ],
            },
          ],
        },
      ],
    },
  ],
};
