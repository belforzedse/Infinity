"use client";

import type { HeroSliderMeta, HeroSliderPayload } from "@/types/super-admin/heroSlider";

type Props = {
  draft: HeroSliderPayload;
  published: HeroSliderPayload;
  meta: HeroSliderMeta | null;
  isSavingDraft: boolean;
  isPublishing: boolean;
  onSaveDraft: () => void;
  onPublish: () => void;
  onAddSlide: () => void;
};

export default function PublishBar({
  draft,
  published,
  meta,
  isSavingDraft,
  isPublishing,
  onSaveDraft,
  onPublish,
  onAddSlide,
}: Props) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold text-slate-800">Draft & Publish</h2>
          <p className="mt-1 text-xs text-slate-500">
            Draft slides: {draft.slides.length} | Published slides: {published.slides.length}
          </p>
          {meta?.publishedAt ? (
            <p className="text-xs text-slate-500">
              Last published: {new Date(meta.publishedAt).toLocaleString("fa-IR")}
            </p>
          ) : (
            <p className="text-xs text-amber-600">No published hero payload yet.</p>
          )}
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onAddSlide}
            className="rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
          >
            Add Slide
          </button>
          <button
            type="button"
            onClick={onSaveDraft}
            disabled={isSavingDraft || isPublishing}
            className="rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 disabled:opacity-60"
          >
            {isSavingDraft ? "Saving..." : "Save Draft"}
          </button>
          <button
            type="button"
            onClick={onPublish}
            disabled={isPublishing || isSavingDraft}
            className="rounded-lg bg-pink-500 px-3 py-2 text-sm text-white hover:bg-pink-600 disabled:opacity-60"
          >
            {isPublishing ? "Publishing..." : "Publish"}
          </button>
        </div>
      </div>
    </section>
  );
}
