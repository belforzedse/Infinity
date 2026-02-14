"use client";

import type { ReactNode } from "react";
import { motion } from "framer-motion";

const PANEL_WIDTH = 320;

type Props = {
  children: ReactNode;
  isCollapsed: boolean;
  emptyMessage?: string;
};

/**
 * Collapsible side panel matching the hero slider editor style:
 * rounded-xl border, 320px width, spring animation.
 * Use with CustomizationPreviewSection's editorPanel prop for the toggle in the header.
 */
export default function CustomizationEditorPanel({
  children,
  isCollapsed,
  emptyMessage = "یک بخش را برای ویرایش انتخاب کنید",
}: Props) {
  return (
    <motion.div
      className="flex flex-shrink-0 flex-col overflow-hidden rounded-xl border border-slate-200 bg-white xl:min-h-[400px]"
      initial={false}
      animate={{
        width: isCollapsed ? 0 : PANEL_WIDTH,
        opacity: isCollapsed ? 0 : 1,
      }}
      transition={{
        type: "spring",
        stiffness: 400,
        damping: 35,
      }}
      style={{ minWidth: 0 }}
    >
      <div className="h-full w-[320px] shrink-0 overflow-hidden">
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
    </motion.div>
  );
}

export { PANEL_WIDTH };
