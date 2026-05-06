import React from "react";
import { UpsertPageConfigType } from "@/components/SuperAdmin/UpsertPage/ContentWrapper";
import { Button } from "@/components/ui/Button";
import { Save, X } from "lucide-react";

export interface BlogTag {
  id?: number;
  Name: string;
  Slug: string;
  Color?: string;
  createdAt: string;
  updatedAt: string;
}

export const blogTagConfig: UpsertPageConfigType<BlogTag> = {
  headTitle: "مدیریت برچسب بلاگ",
  config: [
    {
      title: "اطلاعات برچسب",
      sections: [
        {
          fields: [
            {
              type: "text",
              name: "Name",
              label: "نام برچسب",
              placeholder: "نام برچسب را وارد کنید",
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
              type: "text",
              name: "Color",
              label: "رنگ برچسب",
              placeholder: "#3B82F6",
              mobileColSpan: 12,
              colSpan: 12,
              helper: () => "رنگ هگز برای نمایش برچسب (اختیاری)",
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
