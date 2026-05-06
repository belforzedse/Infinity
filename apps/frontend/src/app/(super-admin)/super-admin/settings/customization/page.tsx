"use client";

import ContentWrapper from "@/components/SuperAdmin/Layout/ContentWrapper";
import Link from "next/link";
import { FiGrid, FiImage, FiMenu } from "react-icons/fi";

const tiles = [
  {
    title: "منوی ناوبری",
    description: "مدیریت ترتیب و نمایش دسته‌بندی‌ها در منوی سایت.",
    href: "/super-admin/settings/customization/navbar",
    icon: <FiMenu className="h-5 w-5" />,
  },
  {
    title: "بنرهای صفحه اصلی",
    description: "دو بنر تبلیغاتی قبل از بخش بلاگ را مدیریت کنید.",
    href: "/super-admin/settings/customization/home-banners",
    icon: <FiImage className="h-5 w-5" />,
  },
  {
    title: "دسته‌بندی ویژه صفحه اصلی",
    description: "بنر و محصولات بخش «شاید بپسندید» را تنظیم کنید.",
    href: "/super-admin/settings/customization/featured-category",
    icon: <FiGrid className="h-5 w-5" />,
  },
  {
    title: "اسلایدر هیرو",
    description: "محتوای اسلایدر هیرو صفحه اصلی را در قالب ثابت مدیریت کنید.",
    href: "/super-admin/settings/customization/hero-slider",
    icon: <FiImage className="h-5 w-5" />,
  },
];

export default function SettingsCustomizationPage() {
  return (
    <ContentWrapper title="سفارشی‌سازی">
      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-semibold text-slate-900">تجربه کاربری را شکل دهید</h1>
            <p className="mt-2 text-sm text-slate-600">
              تنظیمات ظاهری و تجربه کاربری را از اینجا مدیریت کنید. موارد جدید در آینده اضافه می‌شوند.
            </p>
          </div>
          <div className="hidden h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-pink-100 to-amber-50 text-pink-600 md:flex">
            <FiMenu className="h-8 w-8" />
          </div>
        </div>
      </section>

      <section className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {tiles.map((tile) => (
          <Link
            key={tile.title}
            href={tile.href}
            className="group rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-pink-50 text-pink-600">
                {tile.icon}
              </div>
              <div>
                <h2 className="text-base font-semibold text-slate-900">{tile.title}</h2>
                <p className="mt-1 text-sm text-slate-600">{tile.description}</p>
              </div>
            </div>
          </Link>
        ))}
      </section>
    </ContentWrapper>
  );
}
