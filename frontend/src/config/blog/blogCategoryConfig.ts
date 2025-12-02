import React from "react";
import { UpsertPageConfigType } from "@/components/SuperAdmin/UpsertPage/ContentWrapper";
import { Button } from "@/components/ui/Button";
import { Save, X } from "lucide-react";

export interface BlogCategory {
  id?: number;
  Name: string;
  Slug: string;
  Description?: string;
  createdAt: Date;
  updatedAt: Date;
}

export const blogCategoryConfig: UpsertPageConfigType<BlogCategory> = {
  headTitle: "مدیریت دسته‌بندی بلاگ",
  config: [
    {
      title: "اطلاعات دسته‌بندی",
      sections: [
        {
          fields: [
            {
              type: "text",
              name: "Name",
              label: "نام دسته‌بندی",
              placeholder: "نام دسته‌بندی را وارد کنید",
              mobileColSpan: 12,
              colSpan: 6,
            },
            {
              type: "text",
              name: "Slug",
              label: "نامک (URL)",
              placeholder: "نامک URL را وارد کنید",
              mobileColSpan: 12,
              colSpan: 6,
              helper: () => "نامک برای URL استفاده می‌شود",
            },
            {
              type: "multiline-text",
              name: "Description",
              label: "توضیحات",
              placeholder: "توضیحات دسته‌بندی را وارد کنید",
              mobileColSpan: 12,
              colSpan: 12,
              rows: 4,
            },
          ],
        },
      ],
    },
  ],
  actionButtons: ({ onSubmit, onCancel, isLoading }) => 
    React.createElement(React.Fragment, null,
      React.createElement(Button, {
        type: "button",
        variant: "outline",
        onClick: onCancel,
        disabled: isLoading,
        className: "flex items-center gap-2"
      }, 
        React.createElement(X, { size: 16 }),
        "انصراف"
      ),
      React.createElement(Button, {
        type: "button",
        onClick: onSubmit,
        disabled: isLoading,
        className: "flex items-center gap-2"
      },
        React.createElement(Save, { size: 16 }),
        isLoading ? "در حال ذخیره..." : "ذخیره"
      )
    ),
};
