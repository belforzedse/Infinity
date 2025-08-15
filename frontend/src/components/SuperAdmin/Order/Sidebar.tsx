"use client";
// TODO: Refactor Me!
import { useState } from "react";

export default function SuperAdminOrderSidebar() {
  const [formData, setFormData] = useState({
    message: "",
    type: "sms",
  });

  return (
    <div className="flex gap-3 flex-col  sticky top-5">
      {/* Notification to User */}
      <div className="bg-white rounded-2xl p-5 flex flex-col gap-3">
        <div className="flex flex-col gap-2">
          <div className="flex flex-col">
            <span className="text-lg text-foreground-primary">
              ارسال اعلان به مشتری
            </span>

            <span className="text-sm text-neutral-400">
              ارسال پیامک به شماره 09210059187
            </span>
          </div>

          <div className="w-full border border-neutral-200 rounded-lg overflow-hidden">
            <select
              className={`w-full py-3 px-5 text-sm border-l-[20px] border-transparent`}
              value={formData.type}
              onChange={(e) => {
                setFormData({
                  ...formData,
                  type: e.target.value,
                });
              }}
            >
              <option value="sms">پیامک</option>
              {/* <option value="email">ایمیل</option> */}
            </select>
          </div>

          <textarea
            rows={3}
            placeholder="متن اعلان"
            className={`w-full border border-neutral-200 rounded-lg py-2 px-5 text-sm`}
            value={formData.message}
            onChange={(e) => {
              setFormData({
                ...formData,
                message: e.target.value,
              });
            }}
          />
        </div>

        <div className="flex mt-3 justify-end">
          <button className="py-1 px-2 flex gap-1 bg-actions-primary rounded-md items-center">
            <span className="text-sm text-white">ارسال پیام</span>

            <SendIcon />
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl p-5 flex flex-col gap-3">
        <div className="flex flex-col gap-2">
          <div className="flex flex-col">
            <span className="text-lg text-foreground-primary">فاکتور</span>

            <span className="text-sm text-neutral-400">
              شماره فاکتور: 841649
            </span>
          </div>

          <div className="flex gap-2 w-full">
            <button className="bg-slate-100 rounded-md py-1.5 flex-1 flex gap-1 items-center justify-center">
              <span className="text-sm text-neutral-500">دانلود فاکتور</span>

              <DownloadIcon />
            </button>

            <button className="bg-slate-100 rounded-md py-1.5 flex-1 flex gap-1 items-center justify-center">
              <span className="text-sm text-neutral-500">پرینت فاکتور</span>

              <PrintIcon />
            </button>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl p-5 flex flex-col gap-3">
        <div className="flex justify-between items-center">
          <span className="text-lg text-foreground-primary">یادداشت های سیستم پرداخت</span>
        </div>

        <div className="flex flex-col gap-2">
          <span className="text-sm text-neutral-400">
            رویدادهای درگاه (درخواست، ارجاع، بازگشت) در جزئیات سفارش نمایش داده می‌شود.
          </span>
          <span className="text-xs text-neutral-400">
            برای مشاهده کامل، به بخش جزئیات پرداخت در بدنه صفحه مراجعه کنید.
          </span>
        </div>
      </div>
    </div>
  );
}

function SendIcon() {
  return (
    <svg
      width="12"
      height="13"
      viewBox="0 0 12 13"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M7.46041 10.0894L9.95991 3.34685C10.1459 2.84435 9.65691 2.35535 9.15441 2.54135L2.40891 5.04285C1.83141 5.25685 1.87691 6.08785 2.47391 6.23785L5.50741 6.99985L6.26491 10.0238C6.41441 10.6213 7.24591 10.6674 7.46041 10.0894V10.0894Z"
        stroke="white"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function DownloadIcon() {
  return (
    <svg
      width="21"
      height="21"
      viewBox="0 0 21 21"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M10.2502 14.6667V3"
        stroke="#64748B"
        strokeWidth="1.25"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M17.75 14.6667C17.75 16.5075 16.2575 18 14.4167 18H6.08333C4.2425 18 2.75 16.5075 2.75 14.6667"
        stroke="#64748B"
        strokeWidth="1.25"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M14.4167 10.5L10.2492 14.6675L6.08252 10.5"
        stroke="#64748B"
        strokeWidth="1.25"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function PrintIcon() {
  return (
    <svg
      width="21"
      height="21"
      viewBox="0 0 21 21"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M6.5835 7.16667V3.83333C6.5835 3.37333 6.95683 3 7.41683 3H14.0835C14.5435 3 14.9168 3.37333 14.9168 3.83333V7.16667"
        stroke="#64748B"
        strokeWidth="1.25"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M6.58333 14.6667H4.91667C3.99583 14.6667 3.25 13.9209 3.25 13V8.83335C3.25 7.91252 3.99583 7.16669 4.91667 7.16669H16.5833C17.5042 7.16669 18.25 7.91252 18.25 8.83335V13C18.25 13.9209 17.5042 14.6667 16.5833 14.6667H14.9167"
        stroke="#64748B"
        strokeWidth="1.25"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M6.5835 12H14.9168V17.1667C14.9168 17.6267 14.5435 18 14.0835 18H7.41683C6.95683 18 6.5835 17.6267 6.5835 17.1667V12Z"
        stroke="#64748B"
        strokeWidth="1.25"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M6.5835 9.66667H7.41683"
        stroke="#64748B"
        strokeWidth="1.25"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function PlusIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 20 20"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M10.0001 4.16669V15.8334M4.16675 10H15.8334"
        stroke="#475569"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
