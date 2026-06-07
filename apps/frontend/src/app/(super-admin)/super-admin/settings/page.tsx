"use client";

import ContentWrapper from "@/components/SuperAdmin/Layout/ContentWrapper";
import Link from "next/link";
import { FiSettings } from "react-icons/fi";

const quickTiles = [
  {
    title: "تنظیمات عمومی",
    description: "گزینه‌های اصلی سایت مثل فیلتر نمایش محصولات.",
    href: "/super-admin/settings/general",
    icon: <FiSettings className="h-5 w-5" />,
    tone: "from-emerald-50 to-slate-50",
  },
];

export default function SettingsLandingPage() {
  return (
    <ContentWrapper title="تنظیمات">
      <section className="rounded-3xl border border-slate-200 bg-gradient-to-br from-slate-50 via-white to-[#E8F3F4] p-6 shadow-sm">
        <div className="flex flex-col gap-2">
          <span className="text-sm font-semibold text-[#4F8E92]">مرکز تنظیمات</span>
          <h1 className="text-2xl font-semibold text-slate-900">به‌روزرسانی‌های دقیق، نتایج سریع</h1>
          <p className="text-sm text-slate-600">
            بخش‌های مهم تنظیمات را به‌صورت متمرکز مدیریت کنید. از اینجا می‌توانید
            ظاهر سایت و رفتارهای عمومی را با چند کلیک اصلاح کنید.
          </p>
        </div>
        <div className="mt-5 flex flex-wrap gap-3 text-xs text-slate-500">
          <span className="rounded-full bg-white px-3 py-1 shadow-sm">بهینه‌سازی تجربه کاربر</span>
          <span className="rounded-full bg-white px-3 py-1 shadow-sm">مدیریت سریع</span>
          <span className="rounded-full bg-white px-3 py-1 shadow-sm">هماهنگی دسکتاپ و موبایل</span>
        </div>
      </section>

      <section className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {quickTiles.map((tile) => (
          <Link
            key={tile.title}
            href={tile.href}
            className="group rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
          >
            <div className={`flex items-center justify-between rounded-2xl bg-gradient-to-br ${tile.tone} p-3`}>
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-slate-700 shadow-sm">
                {tile.icon}
              </div>
              <span className="text-xs text-slate-400">مشاهده</span>
            </div>
            <div className="mt-4">
              <h2 className="text-base font-semibold text-slate-900">{tile.title}</h2>
              <p className="mt-2 text-sm text-slate-600">{tile.description}</p>
            </div>
          </Link>
        ))}
      </section>

      <section className="mt-6 rounded-2xl border border-dashed border-slate-200 bg-white/70 p-5 text-sm text-slate-600">
        پیشنهاد: تنظیمات ناوبری را مرتب به‌روزرسانی کنید تا کمپین‌های فصلی سریع‌تر دیده شوند.
      </section>
    </ContentWrapper>
  );
}
