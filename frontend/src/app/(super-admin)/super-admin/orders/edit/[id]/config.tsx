"use client";

import { UpsertPageConfigType } from "@/components/SuperAdmin/UpsertPage/ContentWrapper/index";
import { type Order } from "./page";
import Link from "next/link";
import ArrowLeftIcon from "@/components/SuperAdmin/UpsertPage/Icons/ArrowLeftIcon";
import EditIcon from "@/components/SuperAdmin/UpsertPage/Icons/EditIcon";

export const config: UpsertPageConfigType<Order> = {
  headTitle: "ویرایش سفارش",
  addButton: {
    text: "افزودن سفارش  جدید",
    path: "/super-admin/orders/add",
  },
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
      title: (data) => `جزئیات سفارش شماره ${data.id}#`,
      sections: [
        {
          fields: [
            {
              name: "orderDate",
              type: "date",
              label: "تاریخ سفارش",
              colSpan: 4,
              mobileColSpan: 12,
              readOnly: true,
            },
            {
              name: "createdAt",
              type: "date",
              label: "زمان ثبت (دقیق)",
              colSpan: 4,
              mobileColSpan: 12,
              readOnly: true,
            },
            {
              name: "updatedAt",
              type: "date",
              label: "آخرین بروزرسانی",
              colSpan: 4,
              mobileColSpan: 12,
              readOnly: true,
            },
            {
              name: "orderStatus",
              type: "dropdown",
              label: "وضعیت سفارش",
              colSpan: 4,
              mobileColSpan: 12,
              options: [
                {
                  label: "در حال پرداخت",
                  value: "Paying",
                },
                {
                  label: "شروع شده",
                  value: "Started",
                },
                {
                  label: "در حال ارسال",
                  value: "Shipment",
                },
                {
                  label: "تکمیل شده",
                  value: "Done",
                },
                {
                  label: "مرجوع شده",
                  value: "Returned",
                },
                {
                  label: "لغو شده",
                  value: "Cancelled",
                },
              ],
            },
            {
              name: "userName",
              type: "text",
              label: "مشتری",
              colSpan: 4,
              readOnly: true,
              mobileColSpan: 12,
              labelAction: (data) => (
                <Link
                  href={`/super-admin/users/edit/${data.userId}`}
                  className="flex items-center gap-1 text-sm text-actions-link"
                >
                  <span>پروفایل</span>
                  <span>{">"}</span>
                </Link>
              ),
            },
          ],
        },
        {
          header: {
            title: "صورت حساب",
            iconButton: (
              <button className="w-8 h-8 bg-slate-100 rounded-md flex justify-center items-center">
                <EditIcon />
              </button>
            ),
          },
          fields: [
            {
              name: "description",
              type: "multiline-text",
              rows: 5,
              colSpan: 12,
              mobileColSpan: 12,
            },
          ],
        },
        {
          header: { title: "پرداخت و ارسال" },
          fields: [
            {
              name: "paymentGateway",
              type: "copy-text",
              label: "درگاه پرداخت",
              colSpan: 6,
              mobileColSpan: 12,
              readOnly: true,
            },
            {
              name: "shipping",
              type: "copy-text",
              label: "هزینه ارسال",
              colSpan: 6,
              mobileColSpan: 12,
              readOnly: true,
            },
            {
              name: "address",
              type: "multiline-text",
              label: "آدرس ارسال",
              rows: 3,
              colSpan: 9,
              mobileColSpan: 12,
              readOnly: true,
            },
            {
              name: "postalCode",
              type: "copy-text",
              label: "کدپستی",
              colSpan: 3,
              mobileColSpan: 12,
              readOnly: true,
            },
          ],
        },
        {
          fields: [
            {
              name: "phoneNumber",
              type: "copy-text",
              label: "شماره تماس",
              colSpan: 5,
              mobileColSpan: 12,
              readOnly: true,
            },
          ],
        },
      ],
    },
  ],
};
