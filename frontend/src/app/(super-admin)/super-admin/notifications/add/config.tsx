"use client";

import { UpsertPageConfigType } from "@/components/SuperAdmin/UpsertPage/ContentWrapper/index";
import { type Notification } from "./page";
import EditIcon from "@/components/SuperAdmin/UpsertPage/Icons/EditIcon";

export const config: UpsertPageConfigType<Notification> = {
  headTitle: "ثبت اعلان جدید",
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
  config: [
    {
      title: "اطلاعات نوتیفیکیشن",
      iconButton: (
        <button className="w-8 h-8 bg-slate-100 rounded-md flex justify-center items-center">
          <EditIcon />
        </button>
      ),
      sections: [
        {
          fields: [
            {
              name: "sendType",
              type: "checkbox",
              label: "نحوه ارسال",
              colSpan: 12,
              mobileColSpan: 12,
              options: [
                {
                  label: "ایمیل",
                  value: "email",
                },
                {
                  label: "پیامک",
                  value: "sms",
                },
                {
                  label: "پوش نوتیفیکیشن",
                  value: "push",
                },
              ],
            },
            {
              name: "type",
              chipsName: "selectedEvent",
              textName: "message",
              type: "radio-text-with-chips",
              label: "نوع",
              colSpan: 12,
              mobileColSpan: 12,
              descriptionPlaceholder:
                "محتوای متنی مورد نظر خود را  اینجا بنویسید",
              options: [
                {
                  label: "آزاد",
                  value: "free",
                },
                {
                  label: "وابسته به رویداد",
                  value: "event",
                  chips: [
                    {
                      label: "رویداد 1",
                      value: "event1",
                    },
                    {
                      label: "رویداد 2",
                      value: "event2",
                    },
                    {
                      label: "رویداد 3",
                      value: "event3",
                    },
                  ],
                },
              ],
            },
            {
              name: "takers",
              type: "tag-text",
              label: "دریافت کننده ها",
              colSpan: 12,
              mobileColSpan: 12,
              options: [
                {
                  label: "ادمین",
                  value: "admin",
                },
                {
                  label: "مشتری‌ها",
                  value: "user",
                },
              ],
            },
          ],
        },
      ],
    },
  ],
};
