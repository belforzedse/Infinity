"use client";

import type { ReactNode } from "react";

const PANEL_WIDTH = 320;

type Props = {
  children: ReactNode;
  isCollapsed: boolean;
  emptyMessage?: string;
};

/**
 * Collapsible side panel matching the hero slider editor style:
 * rounded-xl border, 320px width. Use with CustomizationPreviewSection's editorPanel prop.
 */
export default function CustomizationEditorPanel({
  children,
  isCollapsed,
  emptyMessage = "یک بخش را برای ویرایش انتخاب کنید",
}: Props) {
  return (
    <div
      className={`flex flex-shrink-0 flex-col overflow-hidden rounded-xl border border-slate-200 bg-white transition-all duration-300 xl:min-h-[400px] ${isCollapsed ? "w-0 min-w-0 opacity-0" : ""}`}
      style={{ minWidth: 0, width: isCollapsed ? 0 : PANEL_WIDTH }}
    >
      <div className="h-full shrink-0 overflow-hidden" style={{ width: `${PANEL_WIDTH}px` }}>
        {children != null ? (
          <div className="scrollbar-neutral flex h-full min-h-[320px] min-w-0 flex-col overflow-x-hidden overflow-y-auto p-3 xl:max-h-[min(70vh,680px)]">
            {children}
          </div>
        ) : (
          <div className="flex flex-1 flex-col items-center justify-center p-6 text-center">
            <p className="text-sm text-slate-500">{emptyMessage}</p>
          </div>
        )}
      </div>
    </div>
  );
}

export { PANEL_WIDTH };
