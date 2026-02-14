"use client";

import type { HeroSlotConfig } from "@/types/super-admin/heroSlider";
import { CardEditor } from "./CardEditor";
import { HeadlineEditor } from "./HeadlineEditor";
import { MainVisualEditor } from "./MainVisualEditor";

type SlotEditorContentProps = {
  slot: HeroSlotConfig;
  onChange: (next: HeroSlotConfig) => void;
  onClose?: () => void;
};

export function SlotEditorContent({ slot, onChange, onClose }: SlotEditorContentProps) {
  return (
    <div className="flex h-full flex-col">
      <div className="mb-3 flex shrink-0 items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
          ویرایش اسلات
        </span>
        {onClose ? (
          <button
            type="button"
            onClick={onClose}
            className="rounded-md px-2 py-1 text-xs text-slate-500 hover:bg-slate-100"
          >
            بستن
          </button>
        ) : null}
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto">
        {slot.kind === "headline" ? (
          <HeadlineEditor slot={slot} onChange={onChange} />
        ) : null}
        {slot.kind === "mainVisual" ? (
          <MainVisualEditor slot={slot} onChange={onChange} />
        ) : null}
        {slot.kind === "card" ? <CardEditor slot={slot} onChange={onChange} /> : null}
      </div>
    </div>
  );
}
