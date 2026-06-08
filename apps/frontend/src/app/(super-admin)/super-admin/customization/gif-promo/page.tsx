"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-hot-toast";
import CustomizationPreviewSection from "@/components/SuperAdmin/CustomizationPreviewSection";
import ImageUploadField from "@/components/SuperAdmin/UpsertPage/ContentWrapper/Fields/ImageUploadField";
import { EditorSection } from "@/components/SuperAdmin/HeroSliderEditor/editors/EditorSection";
import { getSuperAdminSettings } from "@/services/super-admin/settings/get";
import { updateSuperAdminSettings } from "@/services/super-admin/settings/update";
import type { SuperAdminSettings } from "@/types/super-admin/settings";
import resolveAssetUrl from "@/utils/resolveAssetUrl";
import logger from "@/utils/logger";

function pickGifPromoSettings(data: SuperAdminSettings): Partial<SuperAdminSettings> {
  return {
    homeGifPromoEnabled: data.homeGifPromoEnabled,
    homeGifPromoSlot1Image: data.homeGifPromoSlot1Image,
    homeGifPromoSlot2Image: data.homeGifPromoSlot2Image,
  };
}

function GifPreview({ imageUrl, label }: { imageUrl: string; label: string }) {
  const trimmed = imageUrl.trim();
  if (!trimmed) {
    return (
      <div className="flex h-[280px] items-center justify-center rounded-[24px] border border-dashed border-slate-300 bg-slate-50 text-sm text-slate-500">
        {label}
      </div>
    );
  }

  return (
    <div className="relative h-[360px] overflow-hidden rounded-[24px] bg-slate-100 md:h-[480px]">
      {/* eslint-disable-next-line @next/next/no-img-element -- GIF animation requires native img */}
      <img src={resolveAssetUrl(trimmed)} alt={label} className="h-full w-full object-cover" />
    </div>
  );
}

export default function GifPromoCustomizationPage() {
  const router = useRouter();
  const [data, setData] = useState<SuperAdminSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [panelCollapsed, setPanelCollapsed] = useState(false);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        setData(await getSuperAdminSettings());
      } catch (error) {
        logger.error("[GifPromoCustomization] Failed to fetch settings", { error });
        toast.error("خطا در دریافت تنظیمات");
      } finally {
        setLoading(false);
      }
    };

    void fetchSettings();
  }, []);

  const patchData = (patch: Partial<SuperAdminSettings>) => {
    setData((current) => (current ? { ...current, ...patch } : current));
  };

  const save = async () => {
    if (!data) return;

    try {
      setSaving(true);
      const saved = await updateSuperAdminSettings(pickGifPromoSettings(data));
      toast.success("تنظیمات با موفقیت ذخیره شد");
      setData(saved ?? (await getSuperAdminSettings()));
      router.refresh();
    } catch (error) {
      logger.error("[GifPromoCustomization] Failed to save settings", { error });
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
        <h1 className="text-foreground-primary text-3xl">کمپین گیف صفحه اصلی</h1>
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
        title="پیش نمایش گیف ها"
        browserFrame
        empty={
          data.homeGifPromoSlot1Image.trim() || data.homeGifPromoSlot2Image.trim()
            ? undefined
            : {
                title: "گیف های کمپین را آپلود کنید",
                description: "برای هر اسلات یک فایل GIF متحرک انتخاب کنید.",
              }
        }
        editorPanel={{
          collapsed: panelCollapsed,
          onCollapseToggle: () => setPanelCollapsed((current) => !current),
          content: (
            <div className="space-y-3">
              <EditorSection title="تنظیمات بخش">
                <label className="flex cursor-pointer items-center gap-2 text-sm text-slate-700">
                  <input
                    type="checkbox"
                    checked={data.homeGifPromoEnabled}
                    onChange={(event) =>
                      patchData({ homeGifPromoEnabled: event.target.checked })
                    }
                    className="h-4 w-4 rounded border-slate-300"
                  />
                  نمایش بخش کمپین گیف در صفحه اصلی
                </label>
              </EditorSection>

              <EditorSection title="گیف اسلات ۱">
                <ImageUploadField
                  value={data.homeGifPromoSlot1Image}
                  onChange={(value) => patchData({ homeGifPromoSlot1Image: value })}
                  helper={<>ابعاد پیشنهادی: 329.5×564 پیکسل</>}
                />
                <button
                  type="button"
                  onClick={() => patchData({ homeGifPromoSlot1Image: "" })}
                  className="text-sm rounded-lg border border-red-100 px-3 py-2 text-red-600 hover:bg-red-50"
                >
                  حذف گیف اسلات ۱
                </button>
              </EditorSection>

              <EditorSection title="گیف اسلات ۲">
                <ImageUploadField
                  value={data.homeGifPromoSlot2Image}
                  onChange={(value) => patchData({ homeGifPromoSlot2Image: value })}
                  helper={<>ابعاد پیشنهادی: 329.5×564 پیکسل</>}
                />
                <button
                  type="button"
                  onClick={() => patchData({ homeGifPromoSlot2Image: "" })}
                  className="text-sm rounded-lg border border-red-100 px-3 py-2 text-red-600 hover:bg-red-50"
                >
                  حذف گیف اسلات ۲
                </button>
              </EditorSection>
            </div>
          ),
        }}
      >
        <div className="grid gap-4 md:grid-cols-2">
          <GifPreview imageUrl={data.homeGifPromoSlot1Image} label="اسلات ۱" />
          <GifPreview imageUrl={data.homeGifPromoSlot2Image} label="اسلات ۲" />
        </div>
      </CustomizationPreviewSection>
    </div>
  );
}
