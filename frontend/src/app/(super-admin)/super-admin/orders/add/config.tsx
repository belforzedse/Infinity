"use client";

import type { UpsertPageConfigType } from "@/components/SuperAdmin/UpsertPage/ContentWrapper/index";
import { type Order } from "./page";
import { apiClient } from "@/services";
import { STRAPI_TOKEN } from "@/constants/api";

export const config: UpsertPageConfigType<Order> = {
  headTitle: "ساخت سفارش جدید",
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
      title: "ساخت سفارش جدید",
      sections: [
        {
          fields: [
            {
              name: "orderDate",
              type: "date",
              label: "تاریخ سفارش",
              colSpan: 4,
              mobileColSpan: 12,
            },
            {
              name: "orderStatus",
              type: "dropdown",
              label: "وضعیت سفارش",
              colSpan: 4,
              mobileColSpan: 12,
              options: [
                {
                  label: "در حال پرداخت",
                  value: "Paying",
                },
                {
                  label: "شروع شده",
                  value: "Started",
                },
                {
                  label: "در حال ارسال",
                  value: "Shipment",
                },
                {
                  label: "تکمیل شده",
                  value: "Done",
                },
                {
                  label: "مرجوع شده",
                  value: "Returned",
                },
                {
                  label: "لغو شده",
                  value: "Cancelled",
                },
              ],
            },
            {
              name: "userId",
              type: "dropdown",
              label: "مشتری",
              colSpan: 4,
              mobileColSpan: 12,
              fetchOptions: async () => {
                const res = await apiClient.get(
                  "/local-users?filters[IsActive][$eq]=true&filters[user_role][id][$eq]=1&pagination[pageSize]=100",
                  {
                    headers: {
                      Authorization: `Bearer ${STRAPI_TOKEN}`,
                    },
                  },
                );

                return (res as any).data.map((user: any) => ({
                  label: user.attributes.Phone,
                  value: user.id,
                }));
              },
            },
          ],
        },
        {
          header: {
            title: "صورت حساب",
          },
          fields: [
            {
              name: "description",
              type: "multiline-text",
              rows: 5,
              colSpan: 12,
              mobileColSpan: 12,
            },
          ],
        },
      ],
    },
  ],
};
