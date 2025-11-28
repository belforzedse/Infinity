import React from "react";
import { UpsertPageConfigType } from "@/components/SuperAdmin/UpsertPage/ContentWrapper";
import { Button } from "@/components/ui/Button";
import { Save, X } from "lucide-react";

export interface BlogPost {
  id?: number;
  Title: string;
  Slug: string;
  Content: string;
  Excerpt?: string;
  Status: "Draft" | "Published" | "Scheduled";
  PublishedAt?: string;
  ViewCount?: number;
  MetaTitle?: string;
  MetaDescription?: string;
  Keywords?: string;
  FeaturedImage?: any;
  blog_category?: any;
  blog_tags?: any[];
  blog_author?: any;
  createdAt: Date;
  updatedAt: Date;
}

export const blogPostConfig: UpsertPageConfigType<BlogPost> = {
  headTitle: "مدیریت پست بلاگ",
  config: [
    {
      title: "اطلاعات اصلی",
      sections: [
        {
          fields: [
            {
              type: "text",
              name: "Title",
              label: "عنوان پست",
              placeholder: "عنوان پست را وارد کنید",
              mobileColSpan: 12,
              colSpan: 8,
            },
            {
              type: "text",
              name: "Slug",
              label: "نامک (URL)",
              placeholder: "نامک URL را وارد کنید",
              mobileColSpan: 12,
              colSpan: 4,
              helper: () => "نامک برای URL استفاده می‌شود",
            },
            {
              type: "dropdown",
              name: "Status",
              label: "وضعیت",
              options: [
                { label: "پیش‌نویس", value: "Draft" },
                { label: "منتشر شده", value: "Published" },
                { label: "زمان‌بندی شده", value: "Scheduled" },
              ],
              mobileColSpan: 12,
              colSpan: 4,
            },
            {
              type: "dropdown",
              name: "blog_category",
              label: "دسته‌بندی",
              options: [], // Will be populated dynamically
              mobileColSpan: 12,
              colSpan: 4,
            },
            {
              type: "dropdown",
              name: "blog_author",
              label: "نویسنده",
              options: [], // Will be populated dynamically
              mobileColSpan: 12,
              colSpan: 4,
            },
          ],
        },
      ],
    },
    {
      title: "محتوای پست",
      sections: [
        {
          fields: [
            {
              type: "multiline-text",
              name: "Excerpt",
              label: "خلاصه پست",
              placeholder: "خلاصه‌ای از پست را وارد کنید",
              mobileColSpan: 12,
              colSpan: 12,
              rows: 3,
            },
            {
              type: "richtext",
              name: "Content",
              label: "محتوای پست",
              placeholder: "محتوای کامل پست را وارد کنید",
              mobileColSpan: 12,
              colSpan: 12,
            },
          ],
        },
      ],
    },
    {
      title: "تنظیمات SEO",
      sections: [
        {
          fields: [
            {
              type: "text",
              name: "MetaTitle",
              label: "عنوان متا",
              placeholder: "عنوان متا برای SEO",
              mobileColSpan: 12,
              colSpan: 6,
              helper: () => "حداکثر 60 کاراکتر",
            },
            {
              type: "multiline-text",
              name: "MetaDescription",
              label: "توضیحات متا",
              placeholder: "توضیحات متا برای SEO",
              mobileColSpan: 12,
              colSpan: 6,
              rows: 3,
              helper: () => "حداکثر 160 کاراکتر",
            },
            {
              type: "text",
              name: "Keywords",
              label: "کلمات کلیدی",
              placeholder: "کلمات کلیدی را با کاما جدا کنید",
              mobileColSpan: 12,
              colSpan: 12,
            },
          ],
        },
      ],
    },
    {
      title: "تنظیمات انتشار",
      sections: [
        {
          fields: [
            {
              type: "date",
              name: "PublishedAt",
              label: "تاریخ انتشار",
              mobileColSpan: 12,
              colSpan: 6,
            },
            {
              type: "text",
              name: "ViewCount",
              label: "تعداد بازدید",
              placeholder: "0",
              mobileColSpan: 12,
              colSpan: 6,
              readOnly: true,
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
