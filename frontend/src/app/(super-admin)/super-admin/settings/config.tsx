"use client";

import { UpsertPageConfigType } from "@/components/SuperAdmin/UpsertPage/ContentWrapper";
import { SuperAdminSettings } from "@/types/super-admin/settings";

export const config: UpsertPageConfigType<SuperAdminSettings> = {
  headTitle: "تنظیمات سایت",
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
      title: "تنظیمات عمومی",
      sections: [
        {
          fields: [
            {
              name: "filterPublicProductsByTitle",
              type: "checkbox",
              label: "فیلتر نمایش محصولات عمومی (کیف/کفش/صندل/کتونی)",
              colSpan: 12,
              mobileColSpan: 12,
            },
          ],
        },
      ],
    },
  ],
};
