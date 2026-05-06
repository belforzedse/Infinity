"use client";

import React from "react";
import { Link, Copy, Check, RefreshCw } from "lucide-react";
import { useMemo, useState } from "react";

interface PermalinkPanelProps {
  slug: string;
  error?: string;
  onSlugChange?: (slug: string) => void;
  onUseSuggestedSlug?: () => void;
}

export default function PermalinkPanel({
  slug,
  error,
  onSlugChange,
  onUseSuggestedSlug,
}: PermalinkPanelProps) {
  const [copied, setCopied] = useState(false);

  const baseUrl = process.env.NEXT_PUBLIC_SITE_BASE_URL || "https://new.infinitycolor.co";
  const fullUrl = useMemo(() => {
    const trimmedBase = baseUrl.replace(/\/+$/, "");
    const cleanedSlug = slug.replace(/^\/+/, "");
    return `${trimmedBase}/${cleanedSlug}`;
  }, [baseUrl, slug]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(fullUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  return (
    <div className="flex flex-col gap-3 rounded-2xl bg-white p-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-slate-100">
            <Link className="h-4 w-4 text-slate-500" />
          </div>
          <span className="text-sm font-medium text-neutral-800">پیوند یکتا</span>
        </div>
        {onUseSuggestedSlug && (
          <button
            type="button"
            onClick={onUseSuggestedSlug}
            className="flex items-center gap-1 rounded-lg border border-slate-200 px-2 py-1 text-xs text-slate-700 transition hover:bg-slate-50"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            <span>تولید از عنوان</span>
          </button>
        )}
      </div>

      <div className="space-y-2">
        <div className="flex items-center gap-2 rounded-xl border border-slate-100 bg-white px-3 py-2">
          <span className="text-xs text-slate-500 dir-ltr">/</span>
          <input
            type="text"
            value={slug}
            onChange={(e) => {
              const raw = e.target.value;
              // Convert spaces to dashes in real-time
              // Remove non-ASCII characters (blocks Persian) except spaces/dashes, then convert spaces
              // Keep only alphanumeric and dashes
              const cleaned = raw
                .replace(/\s+/g, "-") // Convert spaces to dashes
                .replace(/[^\w-]/g, ""); // Remove non-ASCII (including Persian) and non-alphanumeric except dashes
              onSlugChange?.(cleaned);
            }}
            dir="ltr"
            className="flex-1 border-none bg-transparent text-sm text-neutral-700 placeholder:text-slate-400 focus:outline-none focus:ring-0"
            placeholder="example-slug"
          />
        </div>
        {error && <p className="text-xs text-red-500">{error}</p>}
        <div className="flex items-center gap-2 rounded-xl border border-slate-100 bg-slate-50 px-4 py-3">
          <span className="flex-1 truncate text-xs text-blue-600 dir-ltr text-right">
            {fullUrl}
          </span>
          <button
            type="button"
            onClick={handleCopy}
            className="flex h-6 w-6 items-center justify-center rounded hover:bg-slate-100"
            title="کپی لینک"
          >
            {copied ? (
              <Check className="h-4 w-4 text-green-600" />
            ) : (
              <Copy className="h-4 w-4 text-slate-400" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
}


