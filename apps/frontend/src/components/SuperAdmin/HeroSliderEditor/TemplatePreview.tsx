"use client";

import { ImageIcon } from "lucide-react";
import BannerImage from "@/components/Hero/Banners/BannerImage";
import ImageUploadField from "@/components/SuperAdmin/UpsertPage/ContentWrapper/Fields/ImageUploadField";
import type { HeroSlideConfig, HeroSlotLink } from "@/types/super-admin/heroSliderV3";

const HERO_BANNER_WIDTH = 1360;
const HERO_BANNER_HEIGHT = 581;
const HERO_PLACEHOLDER = "/images/placeholders/HeroEditorMainVisualSlot.png";

type Props = {
  slide: HeroSlideConfig | null;
  onChangeSlide: (next: HeroSlideConfig) => void;
};

function linkFromHref(href: string): HeroSlotLink | null {
  const normalized = href.trim();
  if (!normalized) return null;
  return {
    type: /^https?:\/\//i.test(normalized) ? "external" : "internal",
    href: normalized,
  };
}

export default function TemplatePreview({ slide, onChangeSlide }: Props) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-4">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="text-sm font-semibold text-slate-800">پیش‌نمایش بنر هیرو</h2>
          <p className="mt-1 text-xs text-slate-500">
            هر اسلاید فقط یک تصویر بزرگ با نسبت ۱۳۶۰×۵۸۱ دارد.
          </p>
        </div>
        <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-medium text-slate-600">
          نسخه ساده‌شده
        </span>
      </div>

      {!slide ? (
        <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-slate-200 bg-slate-50/50 px-6 py-16 text-center">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100">
            <ImageIcon className="h-8 w-8 text-slate-400" aria-hidden />
          </div>
          <p className="mb-2 text-sm font-medium text-slate-700">هنوز اسلایدی وجود ندارد</p>
          <p className="max-w-sm text-xs text-slate-500">
            برای شروع، از دکمه «افزودن اسلاید» یک بنر اضافه کنید.
          </p>
        </div>
      ) : (
        <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_340px]">
          <div className="min-w-0 rounded-xl border border-slate-200 bg-slate-50 p-3">
            <div className="overflow-hidden rounded-[20px] bg-white shadow-sm lg:rounded-[34px]">
              <div className="relative aspect-[1360/581] w-full overflow-hidden rounded-[inherit] bg-[#f9f1ee]">
                <BannerImage
                  src={slide.imageUrl || HERO_PLACEHOLDER}
                  alt={slide.imageAlt || "پیش‌نمایش بنر هیرو"}
                  width={HERO_BANNER_WIDTH}
                  height={HERO_BANNER_HEIGHT}
                  sizes="(max-width: 1360px) 100vw, 1360px"
                  className="block h-full w-full object-cover"
                />
              </div>
            </div>
          </div>

          <div className="space-y-4 rounded-xl border border-slate-200 bg-white p-3">
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                محتوای اسلاید
              </h3>
              <p className="mt-1 text-xs text-slate-500">
                تصویر باید به‌صورت بنر کامل و آماده نمایش آپلود شود.
              </p>
            </div>

            <div>
              <p className="mb-1 text-xs text-slate-600">تصویر بنر</p>
              <ImageUploadField
                value={slide.imageUrl}
                onChange={(imageUrl) => onChangeSlide({ ...slide, imageUrl })}
              />
            </div>

            <label className="text-xs text-slate-600">
              متن جایگزین تصویر
              <input
                type="text"
                value={slide.imageAlt}
                onChange={(event) => onChangeSlide({ ...slide, imageAlt: event.target.value })}
                className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm"
              />
            </label>

            <label className="text-xs text-slate-600">
              لینک مقصد اختیاری
              <input
                type="text"
                placeholder="/products یا https://..."
                value={slide.link?.href || ""}
                onChange={(event) =>
                  onChangeSlide({ ...slide, link: linkFromHref(event.target.value) })
                }
                className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm"
              />
            </label>
          </div>
        </div>
      )}
    </section>
  );
}
