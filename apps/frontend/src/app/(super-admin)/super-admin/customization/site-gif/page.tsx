"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-hot-toast";
import SiteGifBanner from "@/components/Home/SiteGifBanner";
import CustomizationPreviewSection from "@/components/SuperAdmin/CustomizationPreviewSection";
import ImageUploadField from "@/components/SuperAdmin/UpsertPage/ContentWrapper/Fields/ImageUploadField";
import { EditorSection } from "@/components/SuperAdmin/HeroSliderEditor/editors/EditorSection";
import { SITE_GIF_DESKTOP_HEIGHT, SITE_GIF_DESKTOP_WIDTH } from "@/constants/site-gif";
import { getSuperAdminSettings } from "@/services/super-admin/settings/get";
import { updateSuperAdminSettings } from "@/services/super-admin/settings/update";
import type { SuperAdminSettings } from "@/types/super-admin/settings";
import logger from "@/utils/logger";

type PreviewMode = "desktop" | "mobile";

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

function pickSiteGifSettings(data: SuperAdminSettings): Partial<SuperAdminSettings> {
  return {
    siteGifEnabled: data.siteGifEnabled,
    siteGifImage: data.siteGifImage,
    siteGifLinkHref: data.siteGifLinkHref,
    siteGifAltText: data.siteGifAltText,
  };
}

export default function SiteGifSettingsPage() {
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
        logger.error("[SiteGifSettings] Failed to fetch settings", { error });
        toast.error("خطا در دریافت تنظیمات");
      } finally {
        setLoading(false);
      }
    };

    void fetch();
  }, []);

  const patchData = (patch: Partial<SuperAdminSettings>) => {
    setData((current) => (current ? { ...current, ...patch } : current));
  };

  const save = async () => {
    if (!data) return;

    try {
      setSaving(true);
      const saved = await updateSuperAdminSettings(pickSiteGifSettings(data));
      toast.success("تنظیمات با موفقیت ذخیره شد");
      setData(saved ?? (await getSuperAdminSettings()));
      router.refresh();
    } catch (error) {
      logger.error("[SiteGifSettings] Failed to save settings", { error });
      toast.error("خطا در ذخیره تنظیمات");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div>در حال بارگذاری...</div>;
  if (!data) return <div>تنظیمات یافت نشد</div>;

  const hasPreview = data.siteGifEnabled && Boolean(data.siteGifImage?.trim());

  return (
    <div className="mt-0 flex flex-col gap-4 md:mt-7">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-foreground-primary text-3xl">گیف سایت</h1>
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
                title: "گیف سایت را فعال و آپلود کنید",
                description:
                  "برای مشاهده پیش نمایش، گیف را فعال کنید و یک تصویر GIF بارگذاری کنید.",
              }
        }
        editorPanel={{
          collapsed: panelCollapsed,
          onCollapseToggle: () => setPanelCollapsed((current) => !current),
          content: (
            <div className="space-y-3">
              <EditorSection title="تنظیمات گیف">
                <label className="flex cursor-pointer items-center gap-2 text-sm text-slate-700">
                  <input
                    type="checkbox"
                    checked={data.siteGifEnabled}
                    onChange={(event) => patchData({ siteGifEnabled: event.target.checked })}
                    className="h-4 w-4 rounded border-slate-300"
                  />
                  نمایش گیف در بالای صفحه اصلی
                </label>

                <ImageUploadField
                  value={data.siteGifImage}
                  onChange={(value) => patchData({ siteGifImage: value })}
                  helper={
                    <>
                      ابعاد پیشنهادی: {SITE_GIF_DESKTOP_WIDTH}×{SITE_GIF_DESKTOP_HEIGHT} پیکسل
                    </>
                  }
                />

                <TextInput
                  label="لینک (اختیاری)"
                  value={data.siteGifLinkHref}
                  placeholder="https://example.com یا /products"
                  onChange={(value) => patchData({ siteGifLinkHref: value })}
                />

                <TextInput
                  label="متن جایگزین (alt)"
                  value={data.siteGifAltText}
                  placeholder="توضیح کوتاه برای دسترس‌پذیری"
                  onChange={(value) => patchData({ siteGifAltText: value })}
                />
              </EditorSection>
            </div>
          ),
        }}
      >
        {hasPreview && (
          <SiteGifBanner
            enabled={data.siteGifEnabled}
            imageUrl={data.siteGifImage}
            linkHref={data.siteGifLinkHref}
            altText={data.siteGifAltText}
            previewMode={previewMode}
          />
        )}
      </CustomizationPreviewSection>
    </div>
  );
}
