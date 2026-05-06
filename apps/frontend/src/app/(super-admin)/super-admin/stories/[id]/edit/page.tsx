"use client";

import React, { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import toast from "react-hot-toast";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import StoryForm, { type StoryFormValues } from "@/components/Stories/StoryForm";
import { storyService } from "@/services/story/story.service";
import type { CreateStoryData } from "@/types/story";
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

export default function EditStoryPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const storyId = Number(params.id);

  const { user, isStoreManager } = useCurrentUser();
  const isSuperAdmin = (user?.roleName ?? "").toLowerCase() === "superadmin";
  const hasAccess = isSuperAdmin || isStoreManager;

  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);
  const [initialValues, setInitialValues] = useState<Partial<StoryFormValues> | undefined>();

  useEffect(() => {
    if (user && !hasAccess) {
      router.replace("/super-admin");
    }
  }, [user, hasAccess, router]);

  useEffect(() => {
    if (!hasAccess || !storyId) return;
    (async () => {
      try {
        const story = await storyService.getStory(storyId);
        setInitialValues({
          Title: story.Title,
          MediaType: story.MediaType,
          IsActive: story.IsActive,
          SortOrder: story.SortOrder,
          updatedAt: story.updatedAt,
          mediaId: story.Media?.id,
          mediaUrl: resolveMediaUrl(story.Media?.url),
          thumbnailId: story.Thumbnail?.id,
          thumbnailUrl: resolveMediaUrl(story.Thumbnail?.url),
        });
      } catch (err) {
        toast.error(translateErrorMessage(extractErrorMessage(err), "خطا در دریافت اطلاعات استوری."));
        router.push("/super-admin/stories");
      } finally {
        setIsFetching(false);
      }
    })();
  }, [storyId, hasAccess, router]);

  const handleSubmit = async (data: CreateStoryData) => {
    setIsLoading(true);
    try {
      await storyService.updateStory(storyId, data);
      toast.success("استوری با موفقیت ویرایش شد");
      router.push("/super-admin/stories");
    } catch (err) {
      toast.error(translateErrorMessage(extractErrorMessage(err), "خطا در ویرایش استوری. دوباره تلاش کنید."));
    } finally {
      setIsLoading(false);
    }
  };

  if (!hasAccess) return null;

  return (
    <div className="p-6" dir="rtl">
      <div className="mb-6 flex items-center gap-3">
        <Link
          href="/super-admin/stories"
          className="flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-50"
        >
          <ArrowRight className="h-4 w-4" />
          بازگشت
        </Link>
        <h1 className="text-2xl font-normal text-slate-800">ویرایش استوری</h1>
      </div>

      {isFetching ? (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-32 animate-pulse rounded-2xl bg-slate-100" />
          ))}
        </div>
      ) : (
        <StoryForm
          initialValues={initialValues}
          onSubmit={handleSubmit}
          isLoading={isLoading}
          submitLabel="ذخیره تغییرات"
        />
      )}
    </div>
  );
}
