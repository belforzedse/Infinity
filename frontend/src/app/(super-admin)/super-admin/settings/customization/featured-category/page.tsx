"use client";

import { useEffect, useMemo, useState } from "react";
import { toast } from "react-hot-toast";
import UpsertPageContentWrapper from "@/components/SuperAdmin/UpsertPage/ContentWrapper";
import { getSuperAdminSettings } from "@/services/super-admin/settings/get";
import { updateSuperAdminSettings } from "@/services/super-admin/settings/update";
import type { SuperAdminSettings } from "@/types/super-admin/settings";
import resolveAssetUrl from "@/utils/resolveAssetUrl";
import { config } from "./config";

function FeaturedCategoryPreview({ data }: { data: SuperAdminSettings }) {
  const bannerImage = useMemo(
    () => resolveAssetUrl(data.homeFeaturedCategoryBannerImage?.trim() || ""),
    [data.homeFeaturedCategoryBannerImage],
  );

  const categorySlug = data.homeFeaturedCategorySlug?.trim();
  const categoryHref = categorySlug ? `/plp?category=${encodeURIComponent(categorySlug)}` : "#";

  return (
    <div className="rounded-3xl border border-slate-200 bg-gradient-to-br from-white via-slate-50 to-pink-50/30 p-6">
      <div className="mb-4 flex items-center justify-between">
        <span className="text-lg font-semibold text-slate-800">پیش‌نمایش بخش شاید بپسندید</span>
        <span className="rounded-full bg-white px-3 py-1 text-xs font-medium text-pink-600 shadow-sm">
          Featured Category
        </span>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-4">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-2xl text-slate-900">شاید بپسندید</h3>
          <span className="text-sm text-slate-600">
            مشاهده همه <span className="mr-1">←</span>
          </span>
        </div>

        <div className="space-y-3">
          <div
            className="h-40 overflow-hidden rounded-2xl border border-slate-100 bg-slate-100"
            style={{
              backgroundImage: bannerImage ? `url(${bannerImage})` : undefined,
              backgroundSize: "cover",
              backgroundPosition: "center",
            }}
          >
            {!bannerImage && (
              <div className="flex h-full items-center justify-center text-sm text-slate-500">
                تصویر بنر انتخاب نشده است
              </div>
            )}
          </div>

          <div className="grid gap-2 sm:grid-cols-2">
            {Array.from({ length: 6 }).map((_, index) => (
              <div
                key={index}
                className="h-16 rounded-xl border border-slate-200 bg-slate-50"
              />
            ))}
          </div>
        </div>

        <div className="mt-3 rounded-xl bg-slate-50 p-2 text-xs text-slate-500">
          لینک دسته‌بندی: <span className="font-mono">{categoryHref}</span>
        </div>
      </div>
    </div>
  );
}

export default function FeaturedCategorySettingsPage() {
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
      footer={(formData) => <FeaturedCategoryPreview data={formData} />}
      onSubmit={async (formData) => {
        try {
          await updateSuperAdminSettings({
            homeFeaturedCategorySlug: formData.homeFeaturedCategorySlug,
            homeFeaturedCategoryBannerImage: formData.homeFeaturedCategoryBannerImage,
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
