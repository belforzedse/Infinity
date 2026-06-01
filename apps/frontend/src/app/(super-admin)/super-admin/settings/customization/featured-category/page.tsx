"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-hot-toast";
import FeaturedCategorySection from "@/components/Home/FeaturedCategorySection";
import CustomizationPreviewSection from "@/components/SuperAdmin/CustomizationPreviewSection";
import DropdownField from "@/components/SuperAdmin/UpsertPage/ContentWrapper/Fields/DropdownField";
import ImageUploadField from "@/components/SuperAdmin/UpsertPage/ContentWrapper/Fields/ImageUploadField";
import { EditorSection } from "@/components/SuperAdmin/HeroSliderEditor/editors/EditorSection";
import { SizeRangeControl } from "@/components/SuperAdmin/HeroSliderEditor/editors/SizeRangeControl";
import { resolveColorForInput } from "@/components/SuperAdmin/HeroSliderEditor/utils";
import { getSuperAdminSettings } from "@/services/super-admin/settings/get";
import { updateSuperAdminSettings } from "@/services/super-admin/settings/update";
import type { SuperAdminSettings } from "@/types/super-admin/settings";
import type { ProductSmallCardProps } from "@/components/Product/SmallCard";
import logger from "@/utils/logger";
import { fetchFeaturedCategoryOptions } from "./config";

type PreviewMode = "desktop" | "mobile";

const FEATURED_PLACEHOLDER_PRODUCTS: ProductSmallCardProps[] = Array.from(
  { length: 6 },
  (_, i) => ({
    id: -(i + 1),
    slug: "",
    title: "محصول نمونه",
    category: "",
    likedCount: 0,
    price: 0,
    image: "/images/placeholders/image-placeholder.svg",
    isAvailable: true,
  }),
);

function numberValue(value: unknown, fallback: number): number {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

function TextInput({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}) {
  return (
    <label className="text-xs text-slate-600">
      {label}
      <input
        type="text"
        value={value}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
        className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm"
      />
    </label>
  );
}

function ColorInput({
  label,
  value,
  onChange,
  fallback = "#111827",
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  fallback?: string;
}) {
  return (
    <label className="text-xs text-slate-600">
      {label}
      <input
        type="color"
        value={resolveColorForInput(value, fallback)}
        onChange={(event) => onChange(event.target.value)}
        className="mt-1 h-10 w-full rounded-lg border border-slate-200 bg-white"
      />
    </label>
  );
}

function SelectInput({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: Array<{ label: string; value: string }>;
}) {
  return (
    <label className="text-xs text-slate-600">
      {label}
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}

function pickFeaturedCategorySettings(data: SuperAdminSettings): Partial<SuperAdminSettings> {
  return {
    homeFeaturedCategorySlug: data.homeFeaturedCategorySlug,
    homeFeaturedCategoryBannerImage: data.homeFeaturedCategoryBannerImage,
    homeFeaturedCategoryTitle: data.homeFeaturedCategoryTitle,
    homeFeaturedCategorySubtitle: data.homeFeaturedCategorySubtitle,
    homeFeaturedCategoryCtaText: data.homeFeaturedCategoryCtaText,
    homeFeaturedCategoryCtaHref: data.homeFeaturedCategoryCtaHref,
    homeFeaturedCategoryTextColor: data.homeFeaturedCategoryTextColor,
    homeFeaturedCategoryTextSize: data.homeFeaturedCategoryTextSize,
    homeFeaturedCategoryFontWeight: data.homeFeaturedCategoryFontWeight,
    homeFeaturedCategoryBannerBackgroundColor: data.homeFeaturedCategoryBannerBackgroundColor,
    homeFeaturedCategoryBannerImageFit: data.homeFeaturedCategoryBannerImageFit,
    homeFeaturedCategoryBannerImagePosition: data.homeFeaturedCategoryBannerImagePosition,
    homeFeaturedCategoryDesktopBannerHeight: data.homeFeaturedCategoryDesktopBannerHeight,
    homeFeaturedCategoryMobileBannerHeight: data.homeFeaturedCategoryMobileBannerHeight,
  };
}

export default function FeaturedCategorySettingsPage() {
  const router = useRouter();
  const [data, setData] = useState<SuperAdminSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [previewMode, setPreviewMode] = useState<PreviewMode>("desktop");
  const [panelCollapsed, setPanelCollapsed] = useState(false);

  useEffect(() => {
    const fetch = async () => {
      try {
        const settings = await getSuperAdminSettings();
        setData(settings);
      } catch (error) {
        logger.error("[FeaturedCategorySettings] Failed to fetch settings", { error });
        toast.error("خطا در دریافت تنظیمات");
      } finally {
        setLoading(false);
      }
    };

    fetch();
  }, []);

  const patchData = (patch: Partial<SuperAdminSettings>) => {
    setData((current) => (current ? { ...current, ...patch } : current));
  };

  const save = async () => {
    if (!data) return;

    try {
      setSaving(true);
      const saved = await updateSuperAdminSettings(pickFeaturedCategorySettings(data));
      toast.success("تنظیمات با موفقیت ذخیره شد");
      setData(saved ?? (await getSuperAdminSettings()));
      router.refresh();
    } catch (error) {
      logger.error("[FeaturedCategorySettings] Failed to save settings", { error });
      toast.error("خطا در ذخیره تنظیمات");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div>در حال بارگذاری...</div>;
  if (!data) return <div>تنظیمات یافت نشد</div>;

  const hasPreview = Boolean(data.homeFeaturedCategoryBannerImage?.trim()) &&
    Boolean(data.homeFeaturedCategorySlug?.trim());

  return (
    <div className="mt-0 flex flex-col gap-4 md:mt-7">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-foreground-primary text-3xl">دسته بندی ویژه صفحه اصلی</h1>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => router.back()}
            className="rounded-xl bg-slate-200 px-5 py-2 text-sm text-slate-600"
          >
            بیخیال شدن
          </button>
          <button
            type="button"
            onClick={save}
            disabled={saving}
            className="rounded-xl bg-actions-primary px-5 py-2 text-sm text-white disabled:opacity-60"
          >
            {saving ? "در حال ذخیره..." : "ذخیره"}
          </button>
        </div>
      </div>

      <CustomizationPreviewSection
        title="پیش نمایش قالب"
        browserFrame
        badge={
          <div className="flex rounded-lg border border-slate-200 bg-white p-1 text-xs">
            {(["desktop", "mobile"] as PreviewMode[]).map((mode) => (
              <button
                key={mode}
                type="button"
                onClick={() => setPreviewMode(mode)}
                className={`rounded-md px-3 py-1 ${
                  previewMode === mode ? "bg-slate-900 text-white" : "text-slate-500"
                }`}
              >
                {mode === "desktop" ? "دسکتاپ" : "موبایل"}
              </button>
            ))}
          </div>
        }
        empty={
          hasPreview
            ? undefined
            : {
                title: "بنر و دسته بندی را انتخاب کنید",
                description:
                  "برای مشاهده پیش نمایش، دسته بندی و تصویر بنر بخش ویژه را تنظیم کنید.",
              }
        }
        editorPanel={{
          collapsed: panelCollapsed,
          onCollapseToggle: () => setPanelCollapsed((current) => !current),
          content: (
            <div className="space-y-3">
              <EditorSection title="دسته بندی و محتوا">
                <div className="text-xs text-slate-600">
                  دسته بندی
                  <div className="mt-1">
                    <DropdownField
                      value={data.homeFeaturedCategorySlug}
                      onChange={(value) => patchData({ homeFeaturedCategorySlug: value })}
                      options={[]}
                      fetchOptions={fetchFeaturedCategoryOptions}
                      placeholder="یک دسته بندی انتخاب کنید"
                      formData={data}
                      name="homeFeaturedCategorySlug"
                    />
                  </div>
                </div>
                <TextInput
                  label="عنوان"
                  value={data.homeFeaturedCategoryTitle}
                  placeholder="خالی = شاید بپسندید"
                  onChange={(value) => patchData({ homeFeaturedCategoryTitle: value })}
                />
                <TextInput
                  label="زیرعنوان"
                  value={data.homeFeaturedCategorySubtitle}
                  onChange={(value) => patchData({ homeFeaturedCategorySubtitle: value })}
                />
                <TextInput
                  label="متن CTA"
                  value={data.homeFeaturedCategoryCtaText}
                  placeholder="خالی = مشاهده همه"
                  onChange={(value) => patchData({ homeFeaturedCategoryCtaText: value })}
                />
                <TextInput
                  label="لینک CTA"
                  value={data.homeFeaturedCategoryCtaHref}
                  placeholder="خالی = لینک دسته بندی"
                  onChange={(value) => patchData({ homeFeaturedCategoryCtaHref: value })}
                />
              </EditorSection>

              <EditorSection title="بنر">
                <div>
                  <p className="mb-1 text-xs text-slate-600">تصویر بنر</p>
                  <ImageUploadField
                    value={data.homeFeaturedCategoryBannerImage}
                    onChange={(value) => patchData({ homeFeaturedCategoryBannerImage: value })}
                  />
                </div>
                <ColorInput
                  label="رنگ پس زمینه بنر"
                  value={data.homeFeaturedCategoryBannerBackgroundColor}
                  fallback="#f1f5f9"
                  onChange={(value) =>
                    patchData({ homeFeaturedCategoryBannerBackgroundColor: value })
                  }
                />
                <SelectInput
                  label="نوع برش تصویر"
                  value={data.homeFeaturedCategoryBannerImageFit || "cover"}
                  onChange={(value) =>
                    patchData({
                      homeFeaturedCategoryBannerImageFit:
                        value === "contain" ? "contain" : "cover",
                    })
                  }
                  options={[
                    { label: "پوشش کامل", value: "cover" },
                    { label: "نمایش کامل تصویر", value: "contain" },
                  ]}
                />
                <TextInput
                  label="موقعیت تصویر"
                  value={data.homeFeaturedCategoryBannerImagePosition}
                  placeholder="center یا top right"
                  onChange={(value) =>
                    patchData({ homeFeaturedCategoryBannerImagePosition: value })
                  }
                />
              </EditorSection>

              <EditorSection title="تایپوگرافی و ابعاد">
                <ColorInput
                  label="رنگ متن"
                  value={data.homeFeaturedCategoryTextColor}
                  onChange={(value) => patchData({ homeFeaturedCategoryTextColor: value })}
                />
                <SizeRangeControl
                  label="اندازه عنوان"
                  value={numberValue(data.homeFeaturedCategoryTextSize, 30)}
                  min={20}
                  max={36}
                  unit="px"
                  onChange={(value) => patchData({ homeFeaturedCategoryTextSize: value })}
                />
                <SelectInput
                  label="وزن فونت"
                  value={data.homeFeaturedCategoryFontWeight || "500"}
                  onChange={(value) => patchData({ homeFeaturedCategoryFontWeight: value })}
                  options={[
                    { label: "معمولی", value: "400" },
                    { label: "متوسط", value: "500" },
                    { label: "نیمه ضخیم", value: "600" },
                    { label: "ضخیم", value: "700" },
                  ]}
                />
                <SizeRangeControl
                  label="ارتفاع بنر دسکتاپ"
                  value={numberValue(data.homeFeaturedCategoryDesktopBannerHeight, 340)}
                  min={240}
                  max={460}
                  unit="px"
                  onChange={(value) =>
                    patchData({ homeFeaturedCategoryDesktopBannerHeight: value })
                  }
                />
                <SizeRangeControl
                  label="ارتفاع بنر موبایل"
                  value={numberValue(data.homeFeaturedCategoryMobileBannerHeight, 260)}
                  min={180}
                  max={360}
                  unit="px"
                  onChange={(value) => patchData({ homeFeaturedCategoryMobileBannerHeight: value })}
                />
              </EditorSection>
            </div>
          ),
        }}
      >
        <div className={previewMode === "mobile" ? "mx-auto max-w-[390px]" : undefined}>
          <FeaturedCategorySection
            bannerImageUrl={data.homeFeaturedCategoryBannerImage}
            categorySlug={data.homeFeaturedCategorySlug}
            products={FEATURED_PLACEHOLDER_PRODUCTS}
            title={data.homeFeaturedCategoryTitle}
            subtitle={data.homeFeaturedCategorySubtitle}
            ctaText={data.homeFeaturedCategoryCtaText}
            ctaHref={data.homeFeaturedCategoryCtaHref}
            textColor={data.homeFeaturedCategoryTextColor}
            textSize={data.homeFeaturedCategoryTextSize}
            fontWeight={data.homeFeaturedCategoryFontWeight}
            bannerBackgroundColor={data.homeFeaturedCategoryBannerBackgroundColor}
            bannerImageFit={data.homeFeaturedCategoryBannerImageFit}
            bannerImagePosition={data.homeFeaturedCategoryBannerImagePosition}
            desktopBannerHeight={data.homeFeaturedCategoryDesktopBannerHeight}
            mobileBannerHeight={data.homeFeaturedCategoryMobileBannerHeight}
            previewMode={previewMode}
          />
        </div>
      </CustomizationPreviewSection>
    </div>
  );
}
