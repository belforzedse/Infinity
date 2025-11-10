"use client";

import type {
  UpsertPageConfigType,
} from "@/components/SuperAdmin/UpsertPage/ContentWrapper/index";
import UpsertPageContentWrapper from "@/components/SuperAdmin/UpsertPage/ContentWrapper/index";
import { apiClient } from "@/services";
import toast from "react-hot-toast";
import type { ReactElement } from "react";
import EditIcon from "@/components/SuperAdmin/UpsertPage/Icons/EditIcon";

type User = {
  id: string | number;
  firstname: string;
  lastname: string;
  phone: string;
  role: number;
  password: string;
  nationalCode: string;
  birthDate: Date;
  gender: string;
  bio: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
};

interface ActionButtonProps {
  onCancel: () => void;
  onSubmit: () => void;
  isLoading?: boolean;
}

// Function to fetch roles from the API
const fetchRoles = async (
  _searchTerm: string,
  _formData?: any,
): Promise<Array<{ label: string; value: string }>> => {
  try {
    const response = await apiClient.get("/local-user-roles");

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

const config: UpsertPageConfigType<User> = {
  headTitle: "ساخت کاربر جدید",
  showTimestamp: false,
  isActiveBox: {
    key: "isActive",
    header: "وضیعت حساب کاربری",
    label: (value: boolean) => (value ? "حساب فعال" : "حساب غیرفعال"),
  },
  actionButtons: (props: ActionButtonProps): ReactElement => (
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
        {props.isLoading ? "در حال ساخت..." : "ساخت کاربر"}
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
              name: "role",
              type: "dropdown",
              label: "نقش",
              colSpan: 6,
              mobileColSpan: 12,
              fetchOptions: fetchRoles,
              placeholder: "انتخاب نقش",
            },
            {
              name: "password",
              type: "password",
              label: "کلمه عبور",
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

export default function Page() {
  const initialData: User = {
    id: "",
    firstname: "",
    lastname: "",
    phone: "",
    role: 0, // Default to user role
    password: "",
    nationalCode: "",
    birthDate: new Date(),
    gender: "male",
    bio: "",
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  return (
    <UpsertPageContentWrapper
      config={config}
      data={initialData}
      onSubmit={async (data: User) => {
        try {
          // Validate required fields
          if (!data.firstname || !data.lastname || !data.phone || !data.role || !data.password) {
            toast.error("لطفا فیلدهای ضروری را پر کنید");
            return;
          }

          // 1. Create the user first
          try {
            const userResponse = await apiClient.post<{ id: number }>(
              "/sp/local-users",
              {
                firstName: data.firstname,
                lastName: data.lastname,
                phone: data.phone,
                role: data.role,
                isActive: data.isActive,
                password: data.password,
                birthDate: (data.birthDate as any).value,
                gender: data.gender === "male",
                bio: data.bio,
                nationalCode: data.nationalCode,
              },
            );

            if (!userResponse.data || !userResponse.data.id) {
              toast.error("خطا در ایجاد کاربر");
              return;
            }
          } catch (userError) {
            console.error("Error creating user:", userError);
            toast.error("خطا در ایجاد کاربر");
            return;
          }

          toast.success("کاربر با موفقیت ایجاد شد");

          // Reset form or redirect
          window.location.href = "/super-admin/users";
        } catch (error) {
          console.error("Error creating user:", error);
          toast.error("خطا در ایجاد کاربر");
        }
      }}
    />
  );
}
