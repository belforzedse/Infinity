"use client";

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import StoryForm from "@/components/Stories/StoryForm";
import { storyService } from "@/services/story/story.service";
import type { CreateStoryData } from "@/types/story";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { translateErrorMessage, extractErrorMessage } from "@/lib/errorTranslations";
import { useState } from "react";

export default function AddStoryPage() {
  const router = useRouter();
  const { user, isStoreManager } = useCurrentUser();
  const isSuperAdmin = (user?.roleName ?? "").toLowerCase() === "superadmin";
  const hasAccess = isSuperAdmin || isStoreManager;
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (user && !hasAccess) {
      router.replace("/super-admin");
    }
  }, [user, hasAccess, router]);

  const handleSubmit = async (data: CreateStoryData) => {
    setIsLoading(true);
    try {
      await storyService.createStory(data);
      toast.success("استوری با موفقیت ایجاد شد");
      router.push("/super-admin/stories");
    } catch (err) {
      toast.error(translateErrorMessage(extractErrorMessage(err), "خطا در ایجاد استوری. دوباره تلاش کنید."));
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
        <h1 className="text-2xl font-normal text-slate-800">استوری جدید</h1>
      </div>

      <StoryForm
        onSubmit={handleSubmit}
        isLoading={isLoading}
        submitLabel="ایجاد استوری"
      />
    </div>
  );
}
