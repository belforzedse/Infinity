"use client";

import ContentWrapper from "@/components/SuperAdmin/Layout/ContentWrapper";
import Link from "next/link";
import { FiImage, FiMenu } from "react-icons/fi";

const sections = [
  {
    title: "هویت بصری",
    description: "هویت بصری سایت خود را بسازید",
    href: "/super-admin/customization/visual-identity",
    icon: <FiImage className="h-8 w-8" />,
    tone: "from-amber-50 to-slate-50",
  },
  {
    title: "شخصی‌سازی",
    description: "رنگ‌ها، بنرها، اسلایدرها و عناصر بصری سایت را مدیریت کنید.",
    href: "/super-admin/customization/personalization",
    icon: <FiMenu className="h-8 w-8" />,
    tone: "from-sky-50 to-slate-50",
  },
];

export default function CustomizationHubPage() {
  return (
    <ContentWrapper title="شخصی‌سازی">
      <section className="rounded-3xl border border-slate-200 bg-gradient-to-br from-slate-50 via-white to-[#E8F3F4] p-6 shadow-sm">
        <div className="flex flex-col gap-2">
          <span className="text-sm font-semibold text-[#4F8E92]">مرکز شخصی‌سازی</span>
          <h1 className="text-2xl font-semibold text-slate-900">سایت خود را شکل دهید</h1>
          <p className="text-sm text-slate-600">
            ظاهر، رفتار و تجربه کاربری سایت را از اینجا مدیریت و بهینه کنید.
          </p>
        </div>
      </section>

      <section className="mt-6 grid gap-4 md:grid-cols-2">
        {sections.map((section) => (
          <Link
            key={section.title}
            href={section.href}
            className="group rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-md"
          >
            <div className={`flex items-center justify-between rounded-2xl bg-gradient-to-br ${section.tone} p-4`}>
              <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-white text-slate-700 shadow-sm">
                {section.icon}
              </div>
              <span className="text-xs text-slate-400">بروید</span>
            </div>
            <div className="mt-4">
              <h2 className="text-lg font-semibold text-slate-900">{section.title}</h2>
              <p className="mt-2 text-sm text-slate-600">{section.description}</p>
            </div>
          </Link>
        ))}
      </section>
    </ContentWrapper>
  );
}
