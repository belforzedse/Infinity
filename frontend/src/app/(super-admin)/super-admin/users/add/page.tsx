"use client";

import ContentWrapper from "@/components/SuperAdmin/Layout/ContentWrapper";
import Link from "next/link";

export default function UsersAddDisabledPage() {
  return (
    <ContentWrapper title="مدیریت کاربران" hasPagination={false} hasRecycleBin={false}>
      <div className="flex flex-col items-center justify-center gap-4 rounded-2xl border border-dashed border-neutral-300 bg-white p-8 text-center">
        <h1 className="text-xl font-semibold text-neutral-800">ایجاد کاربر جدید غیرفعال است</h1>
        <p className="max-w-xl text-sm text-neutral-600">
          طبق سیاست جدید، اضافه کردن کاربران فقط از طریق پنل یا سرویس‌های داخلی انجام می‌شود. برای اعمال
          تغییرات روی کاربران فعلی می‌توانید از صفحه ویرایش استفاده کنید.
        </p>
        <Link
          href="/super-admin/users"
          className="rounded-lg bg-actions-primary px-6 py-2 text-sm font-medium text-white hover:bg-actions-primary/90"
        >
          بازگشت به لیست کاربران
        </Link>
      </div>
    </ContentWrapper>
  );
}
