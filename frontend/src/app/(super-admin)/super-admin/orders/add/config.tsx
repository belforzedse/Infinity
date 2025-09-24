"use client";

import type { UpsertPageConfigType } from "@/components/SuperAdmin/UpsertPage/ContentWrapper/index";
import { type Order } from "./page";
import EditIcon from "@/components/SuperAdmin/UpsertPage/Icons/EditIcon";
import EditableFieldLabel from "@/components/SuperAdmin/Order/EditableFieldLabel";

type FieldStates = {
  userName: { isAutoFilled: boolean; isEditable: boolean };
  phoneNumber: { isAutoFilled: boolean; isEditable: boolean };
  email: { isAutoFilled: boolean; isEditable: boolean };
  address: { isAutoFilled: boolean; isEditable: boolean };
  postalCode: { isAutoFilled: boolean; isEditable: boolean };
  subtotal: { isAutoFilled: boolean; isEditable: boolean };
  discount: { isAutoFilled: boolean; isEditable: boolean };
  tax: { isAutoFilled: boolean; isEditable: boolean };
  total: { isAutoFilled: boolean; isEditable: boolean };
  shipping: { isAutoFilled: boolean; isEditable: boolean };
};

export const createConfig = (
  fieldStates: FieldStates,
  toggleFieldEdit: (fieldName: keyof FieldStates) => void
): UpsertPageConfigType<Order> => ({
  headTitle: "ساخت سفارش جدید",
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
        ثبت سفارش
      </button>
    </>
  ),
  config: [
    {
      title: (data) => `جزئیات سفارش جدید`,
      sections: [
        {
          fields: [
            {
              name: "orderDate",
              type: "date",
              label: "تاریخ سفارش",
              colSpan: 4,
              mobileColSpan: 12,
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
              labelAction: fieldStates.userName.isAutoFilled ? () => (
                <div className="flex items-center gap-2">
                  <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded">
                    خودکار
                  </span>
                  <button
                    type="button"
                    onClick={() => toggleFieldEdit('userName')}
                    className="flex h-6 w-6 items-center justify-center rounded-md bg-slate-100 hover:bg-slate-200 transition-colors"
                    title="ویرایش"
                  >
                    <EditIcon className="h-3 w-3" />
                  </button>
                </div>
              ) : undefined,
              colSpan: 4,
              readOnly: fieldStates.userName.isAutoFilled && !fieldStates.userName.isEditable,
              mobileColSpan: 12,
            },
          ],
        },
        {
          header: {
            title: "صورت حساب",
            iconButton: (
              <button className="flex h-8 w-8 items-center justify-center rounded-md bg-slate-100">
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
              name: "shipping",
              type: "text",
              label: "هزینه ارسال",
              labelAction: fieldStates.shipping.isAutoFilled ? () => (
                <div className="flex items-center gap-2">
                  <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded">
                    خودکار
                  </span>
                  <button
                    type="button"
                    onClick={() => toggleFieldEdit('shipping')}
                    className="flex h-6 w-6 items-center justify-center rounded-md bg-slate-100 hover:bg-slate-200 transition-colors"
                    title="ویرایش"
                  >
                    <EditIcon className="h-3 w-3" />
                  </button>
                </div>
              ) : undefined,
              colSpan: 6,
              mobileColSpan: 12,
              readOnly: fieldStates.shipping.isAutoFilled && !fieldStates.shipping.isEditable,
            },
            {
              name: "address",
              type: "multiline-text",
              label: "آدرس ارسال",
              labelAction: fieldStates.address.isAutoFilled ? () => (
                <div className="flex items-center gap-2">
                  <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded">
                    خودکار
                  </span>
                  <button
                    type="button"
                    onClick={() => toggleFieldEdit('address')}
                    className="flex h-6 w-6 items-center justify-center rounded-md bg-slate-100 hover:bg-slate-200 transition-colors"
                    title="ویرایش"
                  >
                    <EditIcon className="h-3 w-3" />
                  </button>
                </div>
              ) : undefined,
              rows: 3,
              colSpan: 9,
              mobileColSpan: 12,
              readOnly: fieldStates.address.isAutoFilled && !fieldStates.address.isEditable,
            },
            {
              name: "postalCode",
              type: "text",
              label: "کدپستی",
              labelAction: fieldStates.postalCode.isAutoFilled ? () => (
                <div className="flex items-center gap-2">
                  <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded">
                    خودکار
                  </span>
                  <button
                    type="button"
                    onClick={() => toggleFieldEdit('postalCode')}
                    className="flex h-6 w-6 items-center justify-center rounded-md bg-slate-100 hover:bg-slate-200 transition-colors"
                    title="ویرایش"
                  >
                    <EditIcon className="h-3 w-3" />
                  </button>
                </div>
              ) : undefined,
              colSpan: 3,
              mobileColSpan: 12,
              readOnly: fieldStates.postalCode.isAutoFilled && !fieldStates.postalCode.isEditable,
            },
          ],
        },
        {
          fields: [
            {
              name: "phoneNumber",
              type: "text",
              label: "شماره تماس",
              labelAction: fieldStates.phoneNumber.isAutoFilled ? () => (
                <div className="flex items-center gap-2">
                  <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded">
                    خودکار
                  </span>
                  <button
                    type="button"
                    onClick={() => toggleFieldEdit('phoneNumber')}
                    className="flex h-6 w-6 items-center justify-center rounded-md bg-slate-100 hover:bg-slate-200 transition-colors"
                    title="ویرایش"
                  >
                    <EditIcon className="h-3 w-3" />
                  </button>
                </div>
              ) : undefined,
              colSpan: 6,
              mobileColSpan: 12,
              readOnly: fieldStates.phoneNumber.isAutoFilled && !fieldStates.phoneNumber.isEditable,
            },
            {
              name: "email",
              type: "text",
              label: "ایمیل",
              labelAction: fieldStates.email.isAutoFilled ? () => (
                <div className="flex items-center gap-2">
                  <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded">
                    خودکار
                  </span>
                  <button
                    type="button"
                    onClick={() => toggleFieldEdit('email')}
                    className="flex h-6 w-6 items-center justify-center rounded-md bg-slate-100 hover:bg-slate-200 transition-colors"
                    title="ویرایش"
                  >
                    <EditIcon className="h-3 w-3" />
                  </button>
                </div>
              ) : undefined,
              colSpan: 6,
              mobileColSpan: 12,
              readOnly: fieldStates.email.isAutoFilled && !fieldStates.email.isEditable,
            },
          ],
        },
        {
          header: { title: "خلاصه مالی" },
          fields: [
            {
              name: "subtotal",
              type: "text",
              label: "جمع اقلام",
              labelAction: fieldStates.subtotal.isAutoFilled ? () => (
                <div className="flex items-center gap-2">
                  <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded">
                    محاسبه شده
                  </span>
                  <button
                    type="button"
                    onClick={() => toggleFieldEdit('subtotal')}
                    className="flex h-6 w-6 items-center justify-center rounded-md bg-slate-100 hover:bg-slate-200 transition-colors"
                    title="ویرایش"
                  >
                    <EditIcon className="h-3 w-3" />
                  </button>
                </div>
              ) : undefined,
              colSpan: 3,
              mobileColSpan: 6,
              readOnly: fieldStates.subtotal.isAutoFilled && !fieldStates.subtotal.isEditable,
            },
            {
              name: "discount",
              type: "text",
              label: "تخفیف",
              labelAction: fieldStates.discount.isAutoFilled ? () => (
                <div className="flex items-center gap-2">
                  <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded">
                    خودکار
                  </span>
                  <button
                    type="button"
                    onClick={() => toggleFieldEdit('discount')}
                    className="flex h-6 w-6 items-center justify-center rounded-md bg-slate-100 hover:bg-slate-200 transition-colors"
                    title="ویرایش"
                  >
                    <EditIcon className="h-3 w-3" />
                  </button>
                </div>
              ) : undefined,
              colSpan: 3,
              mobileColSpan: 6,
              readOnly: fieldStates.discount.isAutoFilled && !fieldStates.discount.isEditable,
            },
            {
              name: "tax",
              type: "text",
              label: "مالیات",
              labelAction: fieldStates.tax.isAutoFilled ? () => (
                <div className="flex items-center gap-2">
                  <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded">
                    محاسبه شده
                  </span>
                  <button
                    type="button"
                    onClick={() => toggleFieldEdit('tax')}
                    className="flex h-6 w-6 items-center justify-center rounded-md bg-slate-100 hover:bg-slate-200 transition-colors"
                    title="ویرایش"
                  >
                    <EditIcon className="h-3 w-3" />
                  </button>
                </div>
              ) : undefined,
              colSpan: 3,
              mobileColSpan: 6,
              readOnly: fieldStates.tax.isAutoFilled && !fieldStates.tax.isEditable,
            },
            {
              name: "total",
              type: "text",
              label: "مبلغ کل",
              labelAction: fieldStates.total.isAutoFilled ? () => (
                <div className="flex items-center gap-2">
                  <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded">
                    محاسبه شده
                  </span>
                  <button
                    type="button"
                    onClick={() => toggleFieldEdit('total')}
                    className="flex h-6 w-6 items-center justify-center rounded-md bg-slate-100 hover:bg-slate-200 transition-colors"
                    title="ویرایش"
                  >
                    <EditIcon className="h-3 w-3" />
                  </button>
                </div>
              ) : undefined,
              colSpan: 3,
              mobileColSpan: 6,
              readOnly: fieldStates.total.isAutoFilled && !fieldStates.total.isEditable,
            },
          ],
        },
      ],
    },
  ],
});
