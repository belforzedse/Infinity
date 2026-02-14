"use client";

import type { HeroSlotConfig } from "@/types/super-admin/heroSlider";

type Props = {
  slotKey: string;
  slot: HeroSlotConfig | null;
  /** Kept for API compatibility; inline editing is in TemplatePreview. */
  onChange?: (next: HeroSlotConfig) => void;
};

/**
 * Legacy panel kept for backward compatibility with old imports.
 * Inline slot editing is now handled in TemplatePreview popovers.
 */
export default function SlotPanel({ slotKey, slot, onChange: _onChange }: Props) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-4">
      <h2 className="text-sm font-semibold text-slate-800">ویرایش اسلات</h2>
      {!slot ? (
        <p className="mt-3 text-sm text-slate-500">برای ویرایش، یک اسلات را از پیش‌نمایش انتخاب کنید.</p>
      ) : (
        <p className="mt-3 text-sm text-slate-600">
          ویرایش اسلات <span className="font-semibold">{slotKey}</span> به‌صورت درجا در پیش‌نمایش انجام می‌شود.
        </p>
      )}
    </section>
  );
}
