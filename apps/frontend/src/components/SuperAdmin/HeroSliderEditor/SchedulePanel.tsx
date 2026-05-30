"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import {
  HERO_SCHEDULE_TIMEZONE,
  type HeroSlotConfig,
  type HeroSlotLink,
  type HeroSlideSchedule,
  type HeroTracking,
} from "@/types/super-admin/heroSlider";

type Props = {
  schedule: HeroSlideSchedule;
  onChange: (schedule: HeroSlideSchedule) => void;
  autoplayEligible: boolean;
  onAutoplayEligibleChange: (value: boolean) => void;
  isActive: boolean;
  onActiveChange: (value: boolean) => void;
  order: number;
  onOrderChange: (value: number) => void;
  globalAutoplayIntervalMs: number;
  onGlobalAutoplayIntervalChange: (value: number) => void;
  selectedSlotKey: string | null;
  selectedSlot: HeroSlotConfig | null;
  slotLink: HeroSlotLink | null;
  onSlotLinkChange: (value: HeroSlotLink | null) => void;
  slotTracking: HeroTracking;
  onSlotTrackingChange: (value: HeroTracking) => void;
};

const TEHRAN_OFFSET_MINUTES = 210;
const SLOT_LABELS: Record<string, string> = {
  topLeftTextBanner: "تیتر",
  primaryBanner: "تیتر",
  rightBanner: "تصویر اصلی",
  heroBanner: "تصویر اصلی",
  bottomActionBannerLeft: "کارت ۱",
  bottomActionBannerRight: "کارت ۲",
};

function utcToTehranInput(value?: string): string {
  if (!value) return "";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "";

  const tehranMs = parsed.getTime() + TEHRAN_OFFSET_MINUTES * 60 * 1000;
  const tehran = new Date(tehranMs);

  const yyyy = tehran.getUTCFullYear();
  const mm = String(tehran.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(tehran.getUTCDate()).padStart(2, "0");
  const hh = String(tehran.getUTCHours()).padStart(2, "0");
  const min = String(tehran.getUTCMinutes()).padStart(2, "0");

  return `${yyyy}-${mm}-${dd}T${hh}:${min}`;
}

function tehranInputToUtc(value: string): string | undefined {
  const trimmed = value.trim();
  if (!trimmed) return undefined;

  const parsed = new Date(`${trimmed}:00+03:30`);
  if (Number.isNaN(parsed.getTime())) return undefined;
  return parsed.toISOString();
}

function clampIntervalMs(value: number): number {
  if (!Number.isFinite(value)) return 600000;
  return Math.min(Math.max(value, 3000), 3600000);
}

function isSlotDisabled(selectedSlotKey: string | null): boolean {
  return !selectedSlotKey;
}

export default function SchedulePanel({
  schedule,
  onChange,
  autoplayEligible,
  onAutoplayEligibleChange,
  isActive,
  onActiveChange,
  order,
  onOrderChange,
  globalAutoplayIntervalMs,
  onGlobalAutoplayIntervalChange,
  selectedSlotKey,
  selectedSlot,
  slotLink,
  onSlotLinkChange,
  slotTracking,
  onSlotTrackingChange,
}: Props) {
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const slotDisabled = isSlotDisabled(selectedSlotKey);
  const hideLinkInAdvanced =
    selectedSlot?.kind === "card" && (selectedSlot.buttonLabel?.trim() ?? "") !== "";
  const selectedSlotLabel = selectedSlotKey
    ? SLOT_LABELS[selectedSlotKey] || selectedSlotKey
    : "بدون اسلات";

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-4">
      <h2 className="text-sm font-semibold text-slate-800">تنظیمات اسلاید</h2>
      <p className="mt-1 text-xs text-slate-500">کنترل نمایش و رفتار اسلاید.</p>

      <div className="mt-4 space-y-4">
        <div className="space-y-3 rounded-xl border border-slate-100 bg-slate-50 p-3">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500">تنظیمات اصلی</h3>

          <label className="flex items-center justify-between rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700">
            <span>نمایش این اسلاید</span>
            <input
              type="checkbox"
              checked={isActive}
              onChange={(event) => onActiveChange(event.target.checked)}
              className="h-4 w-4"
            />
          </label>

          <label className="flex items-center justify-between rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700">
            <span>قابل پخش خودکار</span>
            <input
              type="checkbox"
              checked={autoplayEligible}
              onChange={(event) => onAutoplayEligibleChange(event.target.checked)}
              className="h-4 w-4"
            />
          </label>

          <label className="text-xs text-slate-600">
            ترتیب
            <input
              type="number"
              value={order}
              onChange={(event) => onOrderChange(Number(event.target.value) || 0)}
              className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm"
            />
          </label>

          <label className="text-xs text-slate-600">
            فاصله پخش خودکار سراسری (میلی‌ثانیه)
            <input
              type="number"
              min={3000}
              max={3600000}
              step={1000}
              value={globalAutoplayIntervalMs}
              onChange={(event) =>
                onGlobalAutoplayIntervalChange(clampIntervalMs(Number(event.target.value)))
              }
              className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm"
            />
          </label>
        </div>

        <div className="rounded-xl border border-slate-200">
          <button
            type="button"
            onClick={() => setAdvancedOpen((prev) => !prev)}
            className="flex w-full items-center justify-between px-4 py-3 text-right text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            <span>تنظیمات پیشرفته</span>
            {advancedOpen ? (
              <ChevronUp className="h-4 w-4 text-slate-500" />
            ) : (
              <ChevronDown className="h-4 w-4 text-slate-500" />
            )}
          </button>
          {advancedOpen && (
            <div className="grid gap-4 border-t border-slate-200 p-4 xl:grid-cols-2">
        <div className="space-y-3 rounded-xl border border-slate-100 bg-slate-50 p-3">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500">زمان‌بندی</h3>
          <p className="text-xs text-slate-500">منطقه زمانی: {HERO_SCHEDULE_TIMEZONE}</p>

          <label className="text-xs text-slate-600">
            شروع (تهران)
            <input
              type="datetime-local"
              value={utcToTehranInput(schedule.startAtUtc)}
              onChange={(event) =>
                onChange({
                  timezone: HERO_SCHEDULE_TIMEZONE,
                  startAtUtc: tehranInputToUtc(event.target.value),
                  endAtUtc: schedule.endAtUtc,
                })
              }
              className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm"
            />
          </label>

          <label className="text-xs text-slate-600">
            پایان (تهران)
            <input
              type="datetime-local"
              value={utcToTehranInput(schedule.endAtUtc)}
              onChange={(event) =>
                onChange({
                  timezone: HERO_SCHEDULE_TIMEZONE,
                  startAtUtc: schedule.startAtUtc,
                  endAtUtc: tehranInputToUtc(event.target.value),
                })
              }
              className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm"
            />
          </label>

          <button
            type="button"
            onClick={() =>
              onChange({
                timezone: HERO_SCHEDULE_TIMEZONE,
              })
            }
            className="text-xs text-slate-500 underline"
          >
            پاک کردن بازه زمان‌بندی
          </button>
        </div>

        <div className="space-y-3 rounded-xl border border-slate-100 bg-slate-50 p-3">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            تنظیمات غیر بصری اسلات ({selectedSlotLabel})
          </h3>

          {!hideLinkInAdvanced ? (
            <>
              <label className="text-xs text-slate-600">
                نوع لینک
                <select
                  disabled={slotDisabled}
                  value={slotLink?.type || "internal"}
                  onChange={(event) =>
                    onSlotLinkChange({
                      type: event.target.value === "external" ? "external" : "internal",
                      href: slotLink?.href || "/",
                    })
                  }
                  className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm disabled:bg-slate-100"
                >
                  <option value="internal">داخلی</option>
                  <option value="external">خارجی</option>
                </select>
              </label>

              <label className="text-xs text-slate-600">
                آدرس لینک
                <input
                  disabled={slotDisabled}
                  type="text"
                  placeholder="/route یا https://..."
                  value={slotLink?.href || ""}
                  onChange={(event) =>
                    onSlotLinkChange(
                      event.target.value.trim()
                        ? {
                            type: slotLink?.type || "internal",
                            href: event.target.value,
                          }
                        : null,
                    )
                  }
                  className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm disabled:bg-slate-100"
                />
              </label>

              <button
                type="button"
                disabled={slotDisabled}
                onClick={() => onSlotLinkChange(null)}
                className="text-xs text-slate-500 underline disabled:opacity-50"
              >
                حذف لینک
              </button>
            </>
          ) : null}

          <label className="text-xs text-slate-600">
            کمپین رهگیری
            <input
              disabled={slotDisabled}
              type="text"
              value={slotTracking.campaign}
              onChange={(event) =>
                onSlotTrackingChange({
                  ...slotTracking,
                  campaign: event.target.value,
                })
              }
              className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm disabled:bg-slate-100"
            />
          </label>

          <div className="grid grid-cols-3 gap-2">
            <label className="text-xs text-slate-600">
              منبع
              <input
                disabled={slotDisabled}
                type="text"
                value={slotTracking.source}
                onChange={(event) =>
                  onSlotTrackingChange({
                    ...slotTracking,
                    source: event.target.value,
                  })
                }
                className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-2 py-2 text-sm disabled:bg-slate-100"
              />
            </label>
            <label className="text-xs text-slate-600">
              رسانه
              <input
                disabled={slotDisabled}
                type="text"
                value={slotTracking.medium}
                onChange={(event) =>
                  onSlotTrackingChange({
                    ...slotTracking,
                    medium: event.target.value,
                  })
                }
                className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-2 py-2 text-sm disabled:bg-slate-100"
              />
            </label>
            <label className="text-xs text-slate-600">
              محتوا
              <input
                disabled={slotDisabled}
                type="text"
                value={slotTracking.content}
                onChange={(event) =>
                  onSlotTrackingChange({
                    ...slotTracking,
                    content: event.target.value,
                  })
                }
                className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-2 py-2 text-sm disabled:bg-slate-100"
              />
            </label>
          </div>

        </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
