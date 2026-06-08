"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-hot-toast";
import HomePromoBanners, { type HomePromoBanner } from "@/components/Home/PromoBanners";
import CustomizationPreviewSection from "@/components/SuperAdmin/CustomizationPreviewSection";
import ImageUploadField from "@/components/SuperAdmin/UpsertPage/ContentWrapper/Fields/ImageUploadField";
import { EditorSection } from "@/components/SuperAdmin/HeroSliderEditor/editors/EditorSection";
import { SizeRangeControl } from "@/components/SuperAdmin/HeroSliderEditor/editors/SizeRangeControl";
import { resolveColorForInput } from "@/components/SuperAdmin/HeroSliderEditor/utils";
import { getSuperAdminSettings } from "@/services/super-admin/settings/get";
import { updateSuperAdminSettings } from "@/services/super-admin/settings/update";
import type { SuperAdminSettings } from "@/types/super-admin/settings";
import logger from "@/utils/logger";

type PreviewMode = "desktop" | "mobile";

type BannerFieldMap = {
  image: keyof SuperAdminSettings;
  title: keyof SuperAdminSettings;
  titleColor: keyof SuperAdminSettings;
  subtitle: keyof SuperAdminSettings;
  subtitleColor: keyof SuperAdminSettings;
  buttonText: keyof SuperAdminSettings;
  buttonColor: keyof SuperAdminSettings;
  buttonHref: keyof SuperAdminSettings;
  backgroundColor: keyof SuperAdminSettings;
  textSize: keyof SuperAdminSettings;
  fontWeight: keyof SuperAdminSettings;
  textAlign: keyof SuperAdminSettings;
  contentPosition: keyof SuperAdminSettings;
  imageFit: keyof SuperAdminSettings;
  imagePosition: keyof SuperAdminSettings;
  desktopHeight: keyof SuperAdminSettings;
  mobileHeight: keyof SuperAdminSettings;
};

const BANNER_ONE_FIELDS: BannerFieldMap = {
  image: "homeBannerOneImage",
  title: "homeBannerOneTitle",
  titleColor: "homeBannerOneTitleColor",
  subtitle: "homeBannerOneSubtitle",
  subtitleColor: "homeBannerOneSubtitleColor",
  buttonText: "homeBannerOneButtonText",
  buttonColor: "homeBannerOneButtonColor",
  buttonHref: "homeBannerOneButtonHref",
  backgroundColor: "homeBannerOneBackgroundColor",
  textSize: "homeBannerOneTextSize",
  fontWeight: "homeBannerOneFontWeight",
  textAlign: "homeBannerOneTextAlign",
  contentPosition: "homeBannerOneContentPosition",
  imageFit: "homeBannerOneImageFit",
  imagePosition: "homeBannerOneImagePosition",
  desktopHeight: "homeBannerOneDesktopHeight",
  mobileHeight: "homeBannerOneMobileHeight",
};

const BANNER_TWO_FIELDS: BannerFieldMap = {
  image: "homeBannerTwoImage",
  title: "homeBannerTwoTitle",
  titleColor: "homeBannerTwoTitleColor",
  subtitle: "homeBannerTwoSubtitle",
  subtitleColor: "homeBannerTwoSubtitleColor",
  buttonText: "homeBannerTwoButtonText",
  buttonColor: "homeBannerTwoButtonColor",
  buttonHref: "homeBannerTwoButtonHref",
  backgroundColor: "homeBannerTwoBackgroundColor",
  textSize: "homeBannerTwoTextSize",
  fontWeight: "homeBannerTwoFontWeight",
  textAlign: "homeBannerTwoTextAlign",
  contentPosition: "homeBannerTwoContentPosition",
  imageFit: "homeBannerTwoImageFit",
  imagePosition: "homeBannerTwoImagePosition",
  desktopHeight: "homeBannerTwoDesktopHeight",
  mobileHeight: "homeBannerTwoMobileHeight",
};

function textValue(value: unknown): string {
  return typeof value === "string" ? value : "";
}

function numberValue(value: unknown, fallback: number): number {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

function buildBanner(data: SuperAdminSettings, id: string, fields: BannerFieldMap): HomePromoBanner {
  return {
    id,
    imageUrl: textValue(data[fields.image]),
    title: textValue(data[fields.title]),
    titleColor: textValue(data[fields.titleColor]),
    subtitle: textValue(data[fields.subtitle]),
    subtitleColor: textValue(data[fields.subtitleColor]),
    buttonText: textValue(data[fields.buttonText]),
    buttonColor: textValue(data[fields.buttonColor]),
    buttonHref: textValue(data[fields.buttonHref]),
    backgroundColor: textValue(data[fields.backgroundColor]),
    textSize: numberValue(data[fields.textSize], 30),
    fontWeight: textValue(data[fields.fontWeight]),
    textAlign: data[fields.textAlign] as HomePromoBanner["textAlign"],
    contentPosition: data[fields.contentPosition] as HomePromoBanner["contentPosition"],
    imageFit: data[fields.imageFit] as HomePromoBanner["imageFit"],
    imagePosition: textValue(data[fields.imagePosition]),
    desktopHeight: numberValue(data[fields.desktopHeight], 220),
    mobileHeight: numberValue(data[fields.mobileHeight], 220),
  };
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
  fallback = "#ffffff",
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

function BannerEditor({
  title,
  data,
  fields,
  onChange,
}: {
  title: string;
  data: SuperAdminSettings;
  fields: BannerFieldMap;
  onChange: (patch: Partial<SuperAdminSettings>) => void;
}) {
  const setField = (field: keyof SuperAdminSettings, value: unknown) =>
    onChange({ [field]: value } as Partial<SuperAdminSettings>);

  return (
    <div className="space-y-3">
      <EditorSection title={title}>
        <div>
          <p className="mb-1 text-xs text-slate-600">تصویر پس زمینه</p>
          <ImageUploadField
            value={textValue(data[fields.image])}
            onChange={(value) => setField(fields.image, value)}
          />
        </div>
        <ColorInput
          label="رنگ پس زمینه"
          value={textValue(data[fields.backgroundColor])}
          fallback="#f1f5f9"
          onChange={(value) => setField(fields.backgroundColor, value)}
        />
        <SelectInput
          label="نوع برش تصویر"
          value={textValue(data[fields.imageFit]) || "cover"}
          onChange={(value) => setField(fields.imageFit, value)}
          options={[
            { label: "پوشش کامل", value: "cover" },
            { label: "نمایش کامل تصویر", value: "contain" },
          ]}
        />
        <TextInput
          label="موقعیت تصویر"
          value={textValue(data[fields.imagePosition])}
          placeholder="center یا top right"
          onChange={(value) => setField(fields.imagePosition, value)}
        />
      </EditorSection>

      <EditorSection title="محتوا">
        <TextInput
          label="عنوان"
          value={textValue(data[fields.title])}
          onChange={(value) => setField(fields.title, value)}
        />
        <TextInput
          label="زیرعنوان"
          value={textValue(data[fields.subtitle])}
          onChange={(value) => setField(fields.subtitle, value)}
        />
        <TextInput
          label="متن CTA"
          value={textValue(data[fields.buttonText])}
          onChange={(value) => setField(fields.buttonText, value)}
        />
        <TextInput
          label="لینک CTA"
          value={textValue(data[fields.buttonHref])}
          placeholder="/plp/category/..."
          onChange={(value) => setField(fields.buttonHref, value)}
        />
      </EditorSection>

      <EditorSection title="تایپوگرافی و چیدمان">
        <ColorInput
          label="رنگ عنوان"
          value={textValue(data[fields.titleColor])}
          onChange={(value) => setField(fields.titleColor, value)}
        />
        <ColorInput
          label="رنگ زیرعنوان"
          value={textValue(data[fields.subtitleColor])}
          onChange={(value) => setField(fields.subtitleColor, value)}
        />
        <ColorInput
          label="رنگ CTA"
          value={textValue(data[fields.buttonColor])}
          fallback="#111827"
          onChange={(value) => setField(fields.buttonColor, value)}
        />
        <SizeRangeControl
          label="اندازه عنوان"
          value={numberValue(data[fields.textSize], 30)}
          min={20}
          max={40}
          unit="px"
          onChange={(value) => setField(fields.textSize, value)}
        />
        <SelectInput
          label="وزن فونت"
          value={textValue(data[fields.fontWeight]) || "500"}
          onChange={(value) => setField(fields.fontWeight, value)}
          options={[
            { label: "معمولی", value: "400" },
            { label: "متوسط", value: "500" },
            { label: "نیمه ضخیم", value: "600" },
            { label: "ضخیم", value: "700" },
          ]}
        />
        <SelectInput
          label="تراز متن"
          value={textValue(data[fields.textAlign]) || "right"}
          onChange={(value) => setField(fields.textAlign, value)}
          options={[
            { label: "راست", value: "right" },
            { label: "وسط", value: "center" },
            { label: "چپ", value: "left" },
          ]}
        />
        <SelectInput
          label="موقعیت محتوا"
          value={textValue(data[fields.contentPosition]) || "top"}
          onChange={(value) => setField(fields.contentPosition, value)}
          options={[
            { label: "بالا", value: "top" },
            { label: "وسط", value: "center" },
            { label: "پایین", value: "bottom" },
          ]}
        />
      </EditorSection>

      <EditorSection title="ابعاد">
        <SizeRangeControl
          label="ارتفاع دسکتاپ"
          value={numberValue(data[fields.desktopHeight], 220)}
          min={160}
          max={320}
          unit="px"
          onChange={(value) => setField(fields.desktopHeight, value)}
        />
        <SizeRangeControl
          label="ارتفاع موبایل"
          value={numberValue(data[fields.mobileHeight], 220)}
          min={160}
          max={340}
          unit="px"
          onChange={(value) => setField(fields.mobileHeight, value)}
        />
      </EditorSection>
    </div>
  );
}

function pickBannerSettings(data: SuperAdminSettings): Partial<SuperAdminSettings> {
  return {
    homeBannerOneImage: data.homeBannerOneImage,
    homeBannerOneTitle: data.homeBannerOneTitle,
    homeBannerOneTitleColor: data.homeBannerOneTitleColor,
    homeBannerOneButtonText: data.homeBannerOneButtonText,
    homeBannerOneButtonColor: data.homeBannerOneButtonColor,
    homeBannerOneButtonHref: data.homeBannerOneButtonHref,
    homeBannerOneSubtitle: data.homeBannerOneSubtitle,
    homeBannerOneSubtitleColor: data.homeBannerOneSubtitleColor,
    homeBannerOneBackgroundColor: data.homeBannerOneBackgroundColor,
    homeBannerOneTextSize: data.homeBannerOneTextSize,
    homeBannerOneFontWeight: data.homeBannerOneFontWeight,
    homeBannerOneTextAlign: data.homeBannerOneTextAlign,
    homeBannerOneContentPosition: data.homeBannerOneContentPosition,
    homeBannerOneImageFit: data.homeBannerOneImageFit,
    homeBannerOneImagePosition: data.homeBannerOneImagePosition,
    homeBannerOneDesktopHeight: data.homeBannerOneDesktopHeight,
    homeBannerOneMobileHeight: data.homeBannerOneMobileHeight,
    homeBannerTwoImage: data.homeBannerTwoImage,
    homeBannerTwoTitle: data.homeBannerTwoTitle,
    homeBannerTwoTitleColor: data.homeBannerTwoTitleColor,
    homeBannerTwoButtonText: data.homeBannerTwoButtonText,
    homeBannerTwoButtonColor: data.homeBannerTwoButtonColor,
    homeBannerTwoButtonHref: data.homeBannerTwoButtonHref,
    homeBannerTwoSubtitle: data.homeBannerTwoSubtitle,
    homeBannerTwoSubtitleColor: data.homeBannerTwoSubtitleColor,
    homeBannerTwoBackgroundColor: data.homeBannerTwoBackgroundColor,
    homeBannerTwoTextSize: data.homeBannerTwoTextSize,
    homeBannerTwoFontWeight: data.homeBannerTwoFontWeight,
    homeBannerTwoTextAlign: data.homeBannerTwoTextAlign,
    homeBannerTwoContentPosition: data.homeBannerTwoContentPosition,
    homeBannerTwoImageFit: data.homeBannerTwoImageFit,
    homeBannerTwoImagePosition: data.homeBannerTwoImagePosition,
    homeBannerTwoDesktopHeight: data.homeBannerTwoDesktopHeight,
    homeBannerTwoMobileHeight: data.homeBannerTwoMobileHeight,
  };
}

export default function HomeBannersSettingsPage() {
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
        logger.error("[HomeBannersSettings] Failed to fetch settings", { error });
        toast.error("خطا در دریافت تنظیمات");
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, []);

  const banners = useMemo(
    () =>
      data
        ? [
            buildBanner(data, "home-banner-one", BANNER_ONE_FIELDS),
            buildBanner(data, "home-banner-two", BANNER_TWO_FIELDS),
          ]
        : [],
    [data],
  );

  const hasVisibleBanner = banners.some((banner) => Boolean(banner.imageUrl?.trim()));

  const patchData = (patch: Partial<SuperAdminSettings>) => {
    setData((current) => (current ? { ...current, ...patch } : current));
  };

  const save = async () => {
    if (!data) return;

    try {
      setSaving(true);
      const saved = await updateSuperAdminSettings(pickBannerSettings(data));
      toast.success("تنظیمات با موفقیت ذخیره شد");
      setData(saved ?? (await getSuperAdminSettings()));
      router.refresh();
    } catch (error) {
      logger.error("[HomeBannersSettings] Failed to save settings", { error });
      toast.error("خطا در ذخیره تنظیمات");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div>در حال بارگذاری...</div>;
  if (!data) return <div>تنظیمات یافت نشد</div>;

  return (
    <div className="mt-0 flex flex-col gap-4 md:mt-7">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-foreground-primary text-3xl">بنرهای صفحه اصلی</h1>
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
          hasVisibleBanner
            ? undefined
            : {
                title: "بنری تنظیم نشده است",
                description: "برای نمایش پیش نمایش، تصویر و عنوان حداقل یک بنر را وارد کنید.",
              }
        }
        editorPanel={{
          collapsed: panelCollapsed,
          onCollapseToggle: () => setPanelCollapsed((current) => !current),
          content: (
            <div className="space-y-3">
              <BannerEditor
                title="بنر اول"
                data={data}
                fields={BANNER_ONE_FIELDS}
                onChange={patchData}
              />
              <BannerEditor
                title="بنر دوم"
                data={data}
                fields={BANNER_TWO_FIELDS}
                onChange={patchData}
              />
            </div>
          ),
        }}
      >
        <div className={previewMode === "mobile" ? "mx-auto max-w-[390px]" : undefined}>
          <HomePromoBanners banners={banners} previewMode={previewMode} />
        </div>
      </CustomizationPreviewSection>
    </div>
  );
}
