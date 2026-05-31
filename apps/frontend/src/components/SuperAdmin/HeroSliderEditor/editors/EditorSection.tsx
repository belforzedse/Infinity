"use client";

import { type ReactNode, useState } from "react";
import { ChevronDown } from "lucide-react";

type EditorSectionProps = {
  title: string;
  children: ReactNode;
  defaultOpen?: boolean;
};

export function EditorSection({ title, children, defaultOpen = true }: EditorSectionProps) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <section className="rounded-lg border border-slate-200 bg-white">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="flex w-full items-center justify-between px-3 py-2 text-right text-xs font-semibold text-slate-700"
      >
        <span>{title}</span>
        <ChevronDown
          className={`h-4 w-4 text-slate-400 transition-transform ${open ? "rotate-180" : ""}`}
          aria-hidden
        />
      </button>
      {open ? <div className="space-y-3 border-t border-slate-100 bg-slate-50/50 p-3">{children}</div> : null}
    </section>
  );
}

