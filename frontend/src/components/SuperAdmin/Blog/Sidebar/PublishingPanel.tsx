"use client";

import React from "react";
import { ChevronDown, Eye, Save, Send } from "lucide-react";

interface PublishingPanelProps {
  status: "Draft" | "Published" | "Scheduled";
  onStatusChange: (status: "Draft" | "Published" | "Scheduled") => void;
  visibility?: "public" | "private";
  onVisibilityChange?: (visibility: "public" | "private") => void;
  publishedAt?: string;
  onPublishedAtChange?: (date: string) => void;
  onPublish: () => void;
  onSaveDraft: () => void;
  onPreview?: () => void;
  isLoading?: boolean;
}

export default function PublishingPanel({
  status,
  onStatusChange,
  visibility = "public",
  onVisibilityChange,
  onPublish,
  onSaveDraft,
  onPreview,
  isLoading = false,
}: PublishingPanelProps) {
  const statusOptions = [
    { value: "Draft", label: "پیش نویس" },
    { value: "Published", label: "منتشر شده" },
    { value: "Scheduled", label: "زمان‌بندی شده" },
  ];

  const visibilityOptions = [
    { value: "public", label: "عمومی" },
    { value: "private", label: "خصوصی" },
  ];

  return (
    <div className="flex flex-col gap-4 rounded-2xl bg-white p-5">
      {/* Status and Visibility */}
      <div className="flex flex-col gap-4">
        {/* Status */}
        <div className="flex flex-col gap-2">
          <span className="text-sm font-medium text-neutral-800">وضعیت انتشار</span>
          <div className="relative">
            <select
              value={status}
              onChange={(e) => onStatusChange(e.target.value as "Draft" | "Published" | "Scheduled")}
              className="w-full appearance-none rounded-xl border border-slate-100 bg-white px-4 py-3 pr-10 text-xs text-neutral-500 focus:border-pink-500 focus:outline-none focus:ring-1 focus:ring-pink-500"
              disabled={isLoading}
            >
              {statusOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          </div>
        </div>

        {/* Visibility */}
        <div className="flex flex-col gap-2">
          <span className="text-sm font-medium text-neutral-800">قابلیت مشاهده</span>
          <div className="relative">
            <select
              value={visibility}
              onChange={(e) => onVisibilityChange?.(e.target.value as "public" | "private")}
              className="w-full appearance-none rounded-xl border border-slate-100 bg-white px-4 py-3 pr-10 text-xs text-neutral-500 focus:border-pink-500 focus:outline-none focus:ring-1 focus:ring-pink-500"
              disabled={isLoading}
            >
              {visibilityOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center gap-2">
        {/* Preview Button */}
        {onPreview && (
          <button
            type="button"
            onClick={onPreview}
            disabled={isLoading}
            className="flex h-9 items-center justify-center gap-1 rounded-md bg-slate-100 px-3 text-slate-500 transition-colors hover:bg-slate-200 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Eye className="h-4 w-4" />
          </button>
        )}

        {/* Save Draft Button */}
        <button
          type="button"
          onClick={onSaveDraft}
          disabled={isLoading}
          className="flex h-9 items-center justify-center gap-1 rounded-md bg-slate-100 px-3 text-slate-500 transition-colors hover:bg-slate-200 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Save className="h-4 w-4" />
        </button>

        {/* Publish Button */}
        <button
          type="button"
          onClick={onPublish}
          disabled={isLoading}
          className="flex h-9 flex-1 items-center justify-center gap-2 rounded-md bg-pink-500 px-4 text-sm font-medium text-white transition-colors hover:bg-pink-600 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isLoading ? (
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
          ) : (
            <>
              <span>انتشار</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}


