"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import ContentWrapper from "@/components/SuperAdmin/Layout/ContentWrapper";
import { Plus, Edit, Trash2, Eye, EyeOff, Image, Video } from "lucide-react";
import { storyService } from "@/services/story/story.service";
import type { Story } from "@/types/story";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { translateErrorMessage, extractErrorMessage } from "@/lib/errorTranslations";
import { IMAGE_BASE_URL } from "@/constants/api";

function resolveMediaUrl(url?: string): string | undefined {
  if (!url) return undefined;
  if (url.startsWith("http")) return url;
  const base = (IMAGE_BASE_URL || "").replace(/\/+$/, "");
  const path = url.replace(/^\/+/, "");
  if (!base) return `/${path}`;
  return `${base}/${path}`;
}

function formatDate(iso?: string): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("fa-IR", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export default function StoriesPage() {
  const router = useRouter();
  const { user, isStoreManager } = useCurrentUser();

  const isSuperAdmin =
    (user?.roleName ?? "").toLowerCase() === "superadmin";
  const hasAccess = isSuperAdmin || isStoreManager;

  useEffect(() => {
    if (user && !hasAccess) {
      router.replace("/super-admin");
    }
  }, [user, hasAccess, router]);

  const [stories, setStories] = useState<Story[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeFilter, setActiveFilter] = useState<"all" | "active" | "inactive">("all");

  const fetchStories = useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await storyService.listStories({
        pageSize: 100,
        sort: "SortOrder:asc",
        isActive: activeFilter === "all" ? undefined : activeFilter === "active",
        search: searchTerm || undefined,
      });
      setStories(res.data ?? []);
    } catch (err) {
      toast.error(translateErrorMessage(extractErrorMessage(err), "خطا در دریافت استوری‌ها. دوباره تلاش کنید."));
      setStories([]);
    } finally {
      setIsLoading(false);
    }
  }, [activeFilter, searchTerm]);

  useEffect(() => {
    if (hasAccess) {
      fetchStories();
    }
  }, [fetchStories, hasAccess]);

  const handleDelete = async (story: Story) => {
    if (!window.confirm(`آیا مطمئن هستید که استوری "${story.Title}" حذف شود؟`)) return;
    try {
      await storyService.deleteStory(story.id);
      toast.success("استوری با موفقیت حذف شد");
      fetchStories();
    } catch (err) {
      toast.error(translateErrorMessage(extractErrorMessage(err), "خطا در حذف استوری. دوباره تلاش کنید."));
    }
  };

  const handleToggleActive = async (story: Story) => {
    try {
      await storyService.updateStory(story.id, { IsActive: !story.IsActive });
      toast.success(story.IsActive ? "استوری غیرفعال شد" : "استوری فعال شد");
      fetchStories();
    } catch (err) {
      toast.error(translateErrorMessage(extractErrorMessage(err), "خطا در تغییر وضعیت. دوباره تلاش کنید."));
    }
  };

  const filtered = stories.filter((s) =>
    s.Title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (!hasAccess) return null;

  return (
    <ContentWrapper
      title="استوری‌ها"
      hasAddButton
      addButtonText="استوری جدید"
      addButtonPath="/super-admin/stories/add"
      hasPagination={false}
    >
      <div dir="rtl" className="space-y-4 p-4">
        {/* Filters bar */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[180px]">
            <input
              type="text"
              placeholder="جستجو در عنوان..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm placeholder:text-slate-400 focus:border-pink-400 focus:outline-none focus:ring-1 focus:ring-pink-400"
            />
          </div>
          <div className="flex gap-2">
            {(["all", "active", "inactive"] as const).map((f) => (
              <button
                key={f}
                type="button"
                onClick={() => setActiveFilter(f)}
                className={`rounded-lg px-3 py-1.5 text-sm transition-colors ${
                  activeFilter === f
                    ? "bg-pink-500 text-white"
                    : "border border-slate-200 text-slate-600 hover:bg-slate-50"
                }`}
              >
                {f === "all" ? "همه" : f === "active" ? "فعال" : "غیرفعال"}
              </button>
            ))}
          </div>
        </div>

        {/* Table */}
        {isLoading ? (
          <div className="space-y-3">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-16 animate-pulse rounded-xl bg-slate-100" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-200 py-12 text-center text-slate-400">
            استوری‌ای یافت نشد
          </div>
        ) : (
          <div className="overflow-hidden rounded-xl border border-slate-100">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50 text-xs text-slate-500">
                  <th className="px-4 py-3 text-right font-medium">عنوان</th>
                  <th className="px-4 py-3 text-right font-medium">نوع</th>
                  <th className="px-4 py-3 text-center font-medium">ترتیب</th>
                  <th className="px-4 py-3 text-right font-medium">شروع</th>
                  <th className="px-4 py-3 text-right font-medium">پایان</th>
                  <th className="px-4 py-3 text-center font-medium">وضعیت</th>
                  <th className="px-4 py-3 text-center font-medium">عملیات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filtered.map((story) => (
                  <tr key={story.id} className="bg-white transition-colors hover:bg-slate-50">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        {story.Thumbnail?.url || story.Media?.url ? (
                          <img
                            src={resolveMediaUrl(story.Thumbnail?.url ?? story.Media?.url)}
                            alt={story.Title}
                            className="h-10 w-10 rounded-lg object-cover"
                          />
                        ) : (
                          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100">
                            {story.MediaType === "video" ? (
                              <Video className="h-5 w-5 text-slate-400" />
                            ) : (
                              <Image className="h-5 w-5 text-slate-400" />
                            )}
                          </div>
                        )}
                        <span className="font-medium text-slate-800">{story.Title}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-slate-500">
                      {story.MediaType === "video" ? "ویدیو" : "تصویر"}
                    </td>
                    <td className="px-4 py-3 text-center text-slate-500">{story.SortOrder}</td>
                    <td className="px-4 py-3 text-slate-500">{formatDate(story.StartAt)}</td>
                    <td className="px-4 py-3 text-slate-500">{formatDate(story.EndAt)}</td>
                    <td className="px-4 py-3 text-center">
                      <button
                        type="button"
                        onClick={() => handleToggleActive(story)}
                        title={story.IsActive ? "غیرفعال کردن" : "فعال کردن"}
                        className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium transition-colors ${
                          story.IsActive
                            ? "bg-green-100 text-green-700 hover:bg-green-200"
                            : "bg-slate-100 text-slate-500 hover:bg-slate-200"
                        }`}
                      >
                        {story.IsActive ? (
                          <><Eye className="h-3 w-3" /> فعال</>
                        ) : (
                          <><EyeOff className="h-3 w-3" /> غیرفعال</>
                        )}
                      </button>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-center gap-2">
                        <Link
                          href={`/super-admin/stories/${story.id}/edit`}
                          className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-700"
                          title="ویرایش"
                        >
                          <Edit className="h-4 w-4" />
                        </Link>
                        <button
                          type="button"
                          onClick={() => handleDelete(story)}
                          className="rounded-lg p-1.5 text-slate-500 hover:bg-red-50 hover:text-red-600"
                          title="حذف"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </ContentWrapper>
  );
}
