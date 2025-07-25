"use client";

import { UpsertPageConfigType } from "@/components/SuperAdmin/UpsertPage/ContentWrapper/index";
import { type PaymentMethod } from "./page";

export const config: UpsertPageConfigType<PaymentMethod> = {
  headTitle: "افزودن درگاه پرداخت",
  actionButtons: (props) => (
    <>
      <button
        className="px-5 py-2 rounded-xl bg-slate-200 text-slate-500 text-sm flex-1 md:flex-none"
        onClick={props.onCancel}
      >
        بیخیال شدن
      </button>

      <button
        className="px-5 py-2 rounded-xl bg-actions-primary text-white text-sm flex-1 md:flex-none"
        onClick={props.onSubmit}
      >
        ذخیره
      </button>
    </>
  ),
  isActiveBox: {
    header: "وضعیت",
    key: "isActive",
    label: (value) => (value ? "درگاه پرداخت فعال" : "درگاه پرداخت غیرفعال"),
  },
  config: [
    {
      title: "اطلاعات درگاه پرداخت",
      sections: [
        {
          fields: [
            {
              name: "name",
              type: "text",
              label: "نام",
              colSpan: 6,
              mobileColSpan: 12,
            },
            {
              name: "accessLevel",
              type: "dropdown",
              label: "دسترسی",
              colSpan: 6,
              mobileColSpan: 12,
              options: [
                {
                  label: "دسترسی همه",
                  value: "all",
                },
                {
                  label: "دسترسی محدود",
                  value: "limited",
                },
              ],
            },
            {
              name: "apiKey",
              type: "text",
              label: "کلید API",
              colSpan: 12,
              mobileColSpan: 12,
            },
            {
              name: "returnUrl",
              type: "text",
              label: "لینک بازگشتی",
              colSpan: 12,
              mobileColSpan: 12,
            },
            {
              name: "description",
              type: "multiline-text",
              label: "توضیحات",
              colSpan: 12,
              mobileColSpan: 12,
              rows: 3,
            },
            {
              name: "configJSON",
              type: "json",
              label: "پیکربندی",
              colSpan: 12,
              mobileColSpan: 12,
              rows: 10,
            },
          ],
        },
      ],
    },
  ],
};
