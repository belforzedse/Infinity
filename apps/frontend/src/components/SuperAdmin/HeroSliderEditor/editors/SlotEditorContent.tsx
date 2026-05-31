"use client";

import { useEffect } from "react";
import type { HeroSlotConfig } from "@/types/super-admin/heroSlider";
import { CardEditor } from "./CardEditor";
import { HeadlineEditor } from "./HeadlineEditor";
import { MainVisualEditor } from "./MainVisualEditor";

export type ActiveHeroTextField = "title" | "subtitle" | "buttonLabel";

export type ActiveHeroTextFocusRequest = {
  field: ActiveHeroTextField;
  requestId: number;
};

type SlotEditorContentProps = {
  slot: HeroSlotConfig;
  onChange: (next: HeroSlotConfig) => void;
  onClose?: () => void;
  activeTextField?: ActiveHeroTextFocusRequest | null;
};

function getActiveLabel(field: ActiveHeroTextField | undefined): string | null {
  if (field === "title") return "عنوان";
  if (field === "subtitle") return "زیرعنوان";
  if (field === "buttonLabel") return "متن دکمه";
  return null;
}

export function SlotEditorContent({
  slot,
  onChange,
  onClose,
  activeTextField,
}: SlotEditorContentProps) {
  useEffect(() => {
    if (!activeTextField) return;

    window.requestAnimationFrame(() => {
      document.querySelectorAll("[data-hero-editor-active='true']").forEach((node) => {
        if (node instanceof HTMLElement) {
          delete node.dataset.heroEditorActive;
        }
      });

      const target = document.querySelector<HTMLInputElement | HTMLTextAreaElement>(
        `[data-hero-editor-field="${activeTextField.field}"]`,
      );
      if (!target) return;

      target.dataset.heroEditorActive = "true";
      target.scrollIntoView?.({ block: "center", behavior: "smooth" });
      target.focus();
      target.select();
    });
  }, [activeTextField]);

  const activeLabel = getActiveLabel(activeTextField?.field);

  return (
    <div className="flex h-full flex-col">
      <div className="mb-3 flex shrink-0 items-center justify-between gap-3">
        <div className="flex flex-col gap-1">
          <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            ویرایش اسلات
          </span>
          {activeLabel ? (
            <span className="rounded-md bg-pink-50 px-2 py-1 text-[11px] font-medium text-pink-700">
              در حال ویرایش متن: {activeLabel}
            </span>
          ) : null}
        </div>
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
      <style>{`
        [data-hero-editor-active="true"] {
          border-color: rgb(236, 72, 153) !important;
          background: rgb(253, 242, 248) !important;
          box-shadow: 0 0 0 3px rgba(236, 72, 153, 0.22) !important;
        }
      `}</style>
      <div className="min-h-0 flex-1 overflow-y-auto">
        {slot.kind === "headline" ? <HeadlineEditor slot={slot} onChange={onChange} /> : null}
        {slot.kind === "mainVisual" ? <MainVisualEditor slot={slot} onChange={onChange} /> : null}
        {slot.kind === "card" ? <CardEditor slot={slot} onChange={onChange} /> : null}
      </div>
    </div>
  );
}
