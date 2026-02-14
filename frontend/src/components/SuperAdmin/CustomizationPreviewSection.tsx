"use client";

import type { ReactNode } from "react";
import { Pencil, PanelLeftClose, PanelRight } from "lucide-react";
import CustomizationEditorPanel from "./CustomizationEditorPanel";

export type EmptyStateConfig = {
  icon?: ReactNode;
  title: string;
  description: string;
};

export type EditorPanelConfig = {
  content: ReactNode;
  collapsed: boolean;
  onCollapseToggle: () => void;
  badge?: ReactNode;
  emptyMessage?: string;
};

type Props = {
  title?: string;
  badge?: ReactNode;
  empty?: EmptyStateConfig | null;
  browserFrame?: boolean;
  editorPanel?: EditorPanelConfig | null;
  children: ReactNode;
};

function DefaultEmptyIcon() {
  return (
    <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100">
      <Pencil className="h-8 w-8 text-slate-400" aria-hidden />
    </div>
  );
}

export function BrowserChrome({ children }: { children: ReactNode }) {
  return (
    <div className="flex flex-col overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
      <div className="flex shrink-0 items-center gap-2 border-b border-slate-200 bg-slate-50 px-3 py-2">
        <div className="flex gap-1.5">
          <div className="h-2.5 w-2.5 rounded-full bg-slate-300" />
          <div className="h-2.5 w-2.5 rounded-full bg-slate-300" />
          <div className="h-2.5 w-2.5 rounded-full bg-slate-300" />
        </div>
        <div className="flex-1 rounded-md bg-white px-3 py-1.5 text-[11px] text-slate-400">
          infinitycolor.co
        </div>
      </div>
      <div className="min-h-[280px] max-h-[min(72vh,680px)] flex-1 overflow-auto bg-white p-4">
        {children}
      </div>
    </div>
  );
}

export default function CustomizationPreviewSection({
  title = "پیش‌نمایش قالب",
  badge,
  empty,
  browserFrame = true,
  editorPanel,
  children,
}: Props) {
  const hasPanel = editorPanel != null;

  const previewContent = empty ? (
    <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-slate-200 bg-slate-50/50 py-16 px-6 text-center">
      {empty.icon ?? <DefaultEmptyIcon />}
      <p className="mb-2 text-sm font-medium text-slate-700">{empty.title}</p>
      <p className="max-w-sm text-xs text-slate-500">{empty.description}</p>
    </div>
  ) : (
    <div className="min-w-[320px] w-full max-w-full overflow-hidden rounded-xl border border-slate-200 bg-slate-50 p-3">
      {browserFrame ? (
        <BrowserChrome>{children}</BrowserChrome>
      ) : (
        <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
          {children}
        </div>
      )}
    </div>
  );

  const mainContent = hasPanel ? (
    <div
      className={`flex flex-col gap-4 overflow-x-hidden ${hasPanel ? "xl:flex-row" : ""}`}
    >
      <div className="min-w-0 flex-1 space-y-3 xl:min-w-[420px]">
        {previewContent}
      </div>
      <CustomizationEditorPanel
        isCollapsed={editorPanel.collapsed}
        emptyMessage={editorPanel.emptyMessage}
      >
        {editorPanel.content}
      </CustomizationEditorPanel>
    </div>
  ) : (
    previewContent
  );

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-4">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-sm font-semibold text-slate-800">{title}</h2>
        <div className="flex items-center gap-2">
          {badge != null && badge}
          {editorPanel?.badge != null && editorPanel.badge}
          {hasPanel && (
            <button
              type="button"
              onClick={editorPanel!.onCollapseToggle}
              className="rounded-lg p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-700"
              title={
                editorPanel!.collapsed ? "نمایش پنل ویرایش" : "بستن پنل ویرایش"
              }
              aria-label={
                editorPanel!.collapsed ? "نمایش پنل ویرایش" : "بستن پنل ویرایش"
              }
            >
              {editorPanel!.collapsed ? (
                <PanelRight className="h-4 w-4" aria-hidden />
              ) : (
                <PanelLeftClose className="h-4 w-4" aria-hidden />
              )}
            </button>
          )}
        </div>
      </div>

      {mainContent}
    </section>
  );
}
