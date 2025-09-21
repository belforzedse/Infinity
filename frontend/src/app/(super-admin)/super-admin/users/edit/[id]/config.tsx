"use client";

import type { UpsertPageConfigType } from "@/components/SuperAdmin/UpsertPage/ContentWrapper";
import type { User } from "./page";
import EditIcon from "@/components/SuperAdmin/UpsertPage/Icons/EditIcon";
import { apiClient } from "@/services";
import { STRAPI_TOKEN } from "@/constants/api";

// Function to fetch roles from the API
const fetchRoles = async (
  _searchTerm: string,
  _formData?: any,
): Promise<Array<{ label: string; value: string }>> => {
  try {
    const response = await apiClient.get("/local-user-roles", {
      headers: {
        Authorization: `Bearer ${STRAPI_TOKEN}`,
      },
    });

    const data = response as {
      data: Array<{
        id: number;
        attributes: {
          Title: string;
          createdAt: string;
          updatedAt: string;
        };
      }>;
    };

    return data.data.map((role) => ({
      label: role.attributes.Title,
      value: role.id.toString(),
    }));
  } catch (error) {
    console.error("Error fetching roles:", error);
    return [];
  }
};

export const config: UpsertPageConfigType<User> = {
  headTitle: "ویرایش کاربر",
  showTimestamp: false,
  addButton: {
    text: "افزودن کاربر جدید",
    path: "/super-admin/users/add",
  },
  isActiveBox: {
    key: "isActive",
    header: "وضیعت حساب کاربری",
    label: (value: boolean) => (value ? "حساب فعال" : "حساب غیرفعال"),
  },
  actionButtons: (props) => (
    <>
      <button
        className="text-sm flex-1 rounded-xl bg-slate-200 px-5 py-2 text-slate-500 md:flex-none"
        onClick={props.onCancel}
        disabled={props.isLoading}
      >
        بیخیال شدن
      </button>

      <button
        className="text-sm flex-1 rounded-xl bg-actions-primary px-5 py-2 text-white md:flex-none"
        onClick={props.onSubmit}
        disabled={props.isLoading}
      >
        {props.isLoading ? "در حال ذخیره..." : "ذخیره"}
      </button>
    </>
  ),
  config: [
    {
      title: "مشخصات کاربر",
      iconButton: (
        <button className="flex h-8 w-8 items-center justify-center rounded-md bg-slate-100">
          <EditIcon />
        </button>
      ),
      sections: [
        {
          fields: [
            {
              name: "firstname",
              type: "text",
              label: "نام",
              colSpan: 6,
              mobileColSpan: 12,
            },
            {
              name: "lastname",
              type: "text",
              label: "نام خانوادگی",
              colSpan: 6,
              mobileColSpan: 12,
            },
            {
              name: "phone",
              type: "copy-text",
              label: "شماره تماس",
              colSpan: 6,
              mobileColSpan: 12,
            },
            {
              name: "nationalCode",
              type: "text",
              label: "کدملی",
              colSpan: 6,
              mobileColSpan: 12,
            },
            {
              name: "password",
              type: "password-with-btn",
              label: "کلمه عبور",
              colSpan: 9,
              mobileColSpan: 12,
            },
            {
              name: "role",
              type: "dropdown",
              label: "نقش",
              colSpan: 3,
              mobileColSpan: 12,
              fetchOptions: fetchRoles,
              placeholder: "انتخاب نقش",
            },
          ],
        },
      ],
    },
    {
      title: "اطلاعات جزئی",
      iconButton: (
        <button className="flex h-8 w-8 items-center justify-center rounded-md bg-slate-100">
          <EditIcon />
        </button>
      ),
      sections: [
        {
          fields: [
            {
              name: "birthDate",
              type: "date",
              label: "تاریخ تولد",
              colSpan: 6,
              mobileColSpan: 12,
            },
            {
              name: "gender",
              type: "dropdown",
              label: "جنسیت",
              colSpan: 6,
              mobileColSpan: 12,
              options: [
                {
                  label: "مرد",
                  value: "male",
                },
                {
                  label: "زن",
                  value: "female",
                },
              ],
            },
            {
              name: "bio",
              type: "multiline-text",
              label: "بیوگرافی",
              colSpan: 12,
              mobileColSpan: 12,
            },
          ],
        },
      ],
    },
  ],
};
