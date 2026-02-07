"use client";

import { useEffect, useMemo, useState } from "react";
import { toast } from "react-hot-toast";
import UpsertPageContentWrapper from "@/components/SuperAdmin/UpsertPage/ContentWrapper";
import { getSuperAdminSettings } from "@/services/super-admin/settings/get";
import { updateSuperAdminSettings } from "@/services/super-admin/settings/update";
import type { SuperAdminSettings } from "@/types/super-admin/settings";
import resolveAssetUrl from "@/utils/resolveAssetUrl";
import { config } from "./config";

const getSafeTitleColor = (value?: string) => value?.trim() || "#ffffff";
const getSafeButtonColor = (value?: string) => value?.trim() || "#111827";

function HomeBannersPreview({ data }: { data: SuperAdminSettings }) {
  const banners = useMemo(
    () => [
      {
        id: "one",
        label: "بنر اول",
        imageUrl: data.homeBannerOneImage?.trim(),
        title: data.homeBannerOneTitle?.trim(),
        titleColor: getSafeTitleColor(data.homeBannerOneTitleColor),
        buttonText: data.homeBannerOneButtonText?.trim(),
        buttonColor: getSafeButtonColor(data.homeBannerOneButtonColor),
        buttonHref: data.homeBannerOneButtonHref?.trim(),
      },
      {
        id: "two",
        label: "بنر دوم",
        imageUrl: data.homeBannerTwoImage?.trim(),
        title: data.homeBannerTwoTitle?.trim(),
        titleColor: getSafeTitleColor(data.homeBannerTwoTitleColor),
        buttonText: data.homeBannerTwoButtonText?.trim(),
        buttonColor: getSafeButtonColor(data.homeBannerTwoButtonColor),
        buttonHref: data.homeBannerTwoButtonHref?.trim(),
      },
    ],
    [data],
  );

  return (
    <div className="rounded-3xl border border-slate-200 bg-gradient-to-br from-white via-slate-50 to-pink-50/40 p-6">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex flex-col">
          <span className="text-lg font-semibold text-slate-800">پیش‌نمایش زنده</span>
          <span className="text-sm text-slate-500">
            این پیش‌نمایش به صورت زنده با هر تغییر بروزرسانی می‌شود.
          </span>
        </div>
        <span className="rounded-full bg-white px-3 py-1 text-xs font-medium text-pink-600 shadow-sm">
          Home Banners
        </span>
      </div>

      <div className="grid gap-5">
        {banners.map((banner) => {
          const hasImage = Boolean(banner.imageUrl);
          const background = hasImage
            ? `url(${resolveAssetUrl(banner.imageUrl)})`
            : "linear-gradient(135deg, #fdf2f8 0%, #f1f5f9 100%)";
          const titleText = banner.title || "عنوان بنر اینجا قرار می‌گیرد";
          const buttonText = banner.buttonText || "مشاهده بیشتر";
          const buttonHref = banner.buttonHref || "#";

          return (
            <div
              key={banner.id}
              className="relative h-[452px] overflow-hidden rounded-[34px] border border-white/60 bg-slate-100 shadow-sm"
              style={{
                backgroundImage: background,
                backgroundSize: "cover",
                backgroundPosition: "center",
              }}
            >
              <div className="absolute left-4 top-4 rounded-full bg-white/80 px-3 py-1 text-xs font-medium text-slate-700 shadow-sm">
                {banner.label}
              </div>
              <div className="absolute inset-0 bg-gradient-to-t from-black/15 via-black/5 to-transparent" />
              <div className="relative z-10 flex h-full flex-col items-center justify-start gap-4 px-6 pt-10 text-center md:pt-14">
                <h3
                  className="text-3xl font-medium leading-tight md:text-[44px]"
                  style={{ color: banner.titleColor }}
                >
                  {titleText}
                </h3>
                <div className="flex flex-col items-center gap-1.5">
                  <a
                    href={buttonHref}
                    className="inline-flex items-center text-sm font-medium transition hover:opacity-80 md:text-lg"
                    style={{ color: banner.buttonColor }}
                  >
                    {buttonText}
                    <span className="ml-1 text-xl">←</span>
                  </a>
                  <span className="max-w-full truncate text-xs text-white/90" dir="ltr">
                    {banner.buttonHref || "لینک دکمه تنظیم نشده"}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function HomeBannersSettingsPage() {
  const [data, setData] = useState<SuperAdminSettings | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      try {
        const settings = await getSuperAdminSettings();
        setData(settings);
      } catch (error) {
        console.error(error);
        toast.error("خطا در دریافت تنظیمات");
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, []);

  if (loading) return <div>در حال بارگذاری...</div>;
  if (!data) return <div>تنظیمات یافت نشد</div>;

  return (
    <UpsertPageContentWrapper
      config={config}
      data={data}
      footer={(formData) => <HomeBannersPreview data={formData} />}
      onSubmit={async (formData) => {
        try {
          await updateSuperAdminSettings({
            homeBannerOneImage: formData.homeBannerOneImage,
            homeBannerOneTitle: formData.homeBannerOneTitle,
            homeBannerOneTitleColor: formData.homeBannerOneTitleColor,
            homeBannerOneButtonText: formData.homeBannerOneButtonText,
            homeBannerOneButtonColor: formData.homeBannerOneButtonColor,
            homeBannerOneButtonHref: formData.homeBannerOneButtonHref,
            homeBannerTwoImage: formData.homeBannerTwoImage,
            homeBannerTwoTitle: formData.homeBannerTwoTitle,
            homeBannerTwoTitleColor: formData.homeBannerTwoTitleColor,
            homeBannerTwoButtonText: formData.homeBannerTwoButtonText,
            homeBannerTwoButtonColor: formData.homeBannerTwoButtonColor,
            homeBannerTwoButtonHref: formData.homeBannerTwoButtonHref,
          });
          toast.success("تنظیمات با موفقیت بروزرسانی شد");
          const refreshed = await getSuperAdminSettings();
          setData(refreshed);
        } catch (error) {
          console.error(error);
          toast.error("خطا در ذخیره تنظیمات");
        }
      }}
    />
  );
}
