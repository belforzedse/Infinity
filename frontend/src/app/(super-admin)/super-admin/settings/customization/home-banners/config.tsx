"use client";

import type { UpsertPageConfigType } from "@/components/SuperAdmin/UpsertPage/ContentWrapper";
import type { SuperAdminSettings } from "@/types/super-admin/settings";

export const config: UpsertPageConfigType<SuperAdminSettings> = {
  headTitle: "بنرهای صفحه اصلی",
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
      title: "بنرهای تبلیغاتی قبل از بلاگ",
      sections: [
        {
          header: {
            title: "بنر اول",
          },
          fields: [
            {
              name: "homeBannerOneImage",
              type: "image",
              label: "تصویر پس‌زمینه",
              colSpan: 12,
              mobileColSpan: 12,
              placeholder: "https://...",
              helper: () => "پیشنهاد: تصویر حداقل 1200×600 با کیفیت بالا.",
            },
            {
              name: "homeBannerOneTitle",
              type: "text",
              label: "عنوان",
              colSpan: 8,
              mobileColSpan: 12,
            },
            {
              name: "homeBannerOneTitleColor",
              type: "color",
              label: "رنگ عنوان",
              colSpan: 4,
              mobileColSpan: 12,
              placeholder: "#FFFFFF",
              helper: () => "برای شفافیت بهتر روی تصویر، رنگ روشن انتخاب کنید.",
            },
            {
              name: "homeBannerOneButtonText",
              type: "text",
              label: "متن دکمه",
              colSpan: 6,
              mobileColSpan: 12,
            },
            {
              name: "homeBannerOneButtonColor",
              type: "color",
              label: "رنگ دکمه",
              colSpan: 6,
              mobileColSpan: 12,
              placeholder: "#111827",
              helper: () => "رنگ دکمه بهتر است با تصویر کنتراست داشته باشد.",
            },
            {
              name: "homeBannerOneButtonHref",
              type: "text",
              label: "لینک دکمه",
              colSpan: 12,
              mobileColSpan: 12,
              placeholder: "/category/new",
            },
          ],
        },
        {
          header: {
            title: "بنر دوم",
          },
          fields: [
            {
              name: "homeBannerTwoImage",
              type: "image",
              label: "تصویر پس‌زمینه",
              colSpan: 12,
              mobileColSpan: 12,
              placeholder: "https://...",
              helper: () => "پیشنهاد: تصویر حداقل 1200×600 با کیفیت بالا.",
            },
            {
              name: "homeBannerTwoTitle",
              type: "text",
              label: "عنوان",
              colSpan: 8,
              mobileColSpan: 12,
            },
            {
              name: "homeBannerTwoTitleColor",
              type: "color",
              label: "رنگ عنوان",
              colSpan: 4,
              mobileColSpan: 12,
              placeholder: "#FFFFFF",
              helper: () => "برای شفافیت بهتر روی تصویر، رنگ روشن انتخاب کنید.",
            },
            {
              name: "homeBannerTwoButtonText",
              type: "text",
              label: "متن دکمه",
              colSpan: 6,
              mobileColSpan: 12,
            },
            {
              name: "homeBannerTwoButtonColor",
              type: "color",
              label: "رنگ دکمه",
              colSpan: 6,
              mobileColSpan: 12,
              placeholder: "#111827",
              helper: () => "رنگ دکمه بهتر است با تصویر کنتراست داشته باشد.",
            },
            {
              name: "homeBannerTwoButtonHref",
              type: "text",
              label: "لینک دکمه",
              colSpan: 12,
              mobileColSpan: 12,
              placeholder: "/category/new",
            },
          ],
        },
      ],
    },
  ],
};
