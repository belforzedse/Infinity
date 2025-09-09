"use client";

import { UpsertPageConfigType } from "@/components/SuperAdmin/UpsertPage/ContentWrapper/index";
import { Footer } from "@/types/super-admin/footer";

type NestedFooter = {
  "first.header": string;
  "first.links": string;
  "second.header": string;
  "second.links": string;
  "third.header": string;
  "third.links": string;
  "contactUs.phone": string;
  "contactUs.whatsapp": string;
  "contactUs.instagram": string;
  "contactUs.telegram": string;
  customerSupport: string;
} & Footer;

export const config: UpsertPageConfigType<NestedFooter> = {
  headTitle: "ویرایش فوتر",
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
      title: "ستون اول",
      sections: [
        {
          fields: [
            {
              name: "first.header",
              type: "text",
              label: "عنوان",
              colSpan: 12,
              mobileColSpan: 12,
            },
            {
              name: "first.links",
              type: "json",
              label: "لینک‌ها",
              colSpan: 12,
              mobileColSpan: 12,
              helper: () => (
                <span className="text-sm text-actions-primary">
                  هر لینک باید دارای فیلدهای title و url باشد. به طور مثال:
                  {`[{"title": "فروشگاه", "url": "/plp"}, {"title": "درباره ما", "url": "/about"}]`}
                </span>
              ),
            },
          ],
        },
      ],
    },
    {
      title: "ستون دوم",
      sections: [
        {
          fields: [
            {
              name: "second.header",
              type: "text",
              label: "عنوان",
              colSpan: 12,
              mobileColSpan: 12,
            },
            {
              name: "second.links",
              type: "json",
              label: "لینک‌ها",
              colSpan: 12,
              mobileColSpan: 12,
              helper: () => (
                <span className="text-sm text-actions-primary">
                  هر لینک باید دارای فیلدهای title و url باشد. به طور مثال:
                  {`[{"title": "خرید شلوار", "url": "/plp/pants"}, {"title": "خرید پیراهن", "url": "/plp/shirts"}]`}
                </span>
              ),
            },
          ],
        },
      ],
    },
    {
      title: "ستون سوم",
      sections: [
        {
          fields: [
            {
              name: "third.header",
              type: "text",
              label: "عنوان",
              colSpan: 12,
              mobileColSpan: 12,
            },
            {
              name: "third.links",
              type: "json",
              label: "لینک‌ها",
              colSpan: 12,
              mobileColSpan: 12,
              helper: () => (
                <span className="text-sm text-actions-primary">
                  هر لینک باید دارای فیلدهای title و url باشد. به طور مثال:
                  {`[{"title": "سوالات متداول", "url": "/faq"}, {"title": "تماس با ما", "url": "/contact"}]`}
                </span>
              ),
            },
          ],
        },
      ],
    },
    {
      title: "اطلاعات تماس",
      sections: [
        {
          fields: [
            {
              name: "contactUs.phone",
              type: "text",
              label: "شماره تلفن",
              colSpan: 6,
              mobileColSpan: 12,
            },
            {
              name: "contactUs.whatsapp",
              type: "text",
              label: "واتساپ",
              colSpan: 6,
              mobileColSpan: 12,
            },
            {
              name: "contactUs.instagram",
              type: "text",
              label: "اینستاگرام",
              colSpan: 6,
              mobileColSpan: 12,
            },
            {
              name: "contactUs.telegram",
              type: "text",
              label: "تلگرام",
              colSpan: 6,
              mobileColSpan: 12,
            },
          ],
        },
      ],
    },
    {
      title: "پشتیبانی مشتری",
      sections: [
        {
          fields: [
            {
              name: "customerSupport",
              type: "multiline-text",
              label: "متن پشتیبانی مشتری",
              colSpan: 12,
              mobileColSpan: 12,
              rows: 3,
            },
          ],
        },
      ],
    },
  ],
};
