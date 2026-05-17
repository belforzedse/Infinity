"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import toast from "react-hot-toast";
import SuspenseLoader from "@/components/ui/SuspenseLoader";
import { ProfileStoryForm, type ProfileStoryFormValues } from "@/components/stories/ProfileStoryForm";
import { getStory, updateStory } from "@/services/story.service";
import type { CreateStoryData } from "@/types/story";
import { getUserFacingErrorMessage } from "@/utils/userErrorMessage";

export default function EditStoryPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const storyId = Number(params.id);
  const [initialValues, setInitialValues] = useState<Partial<ProfileStoryFormValues>>();
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    let cancelled = false;
    if (!Number.isFinite(storyId) || storyId <= 0) {
      router.replace("/profile/posts?tab=stories");
      return;
    }

    getStory(storyId)
      .then((story) => {
        if (cancelled) return;
        setInitialValues({
          Title: story.Title,
          IsActive: story.IsActive,
          SortOrder: story.SortOrder,
          MediaType: story.MediaType,
          updatedAt: story.updatedAt,
          mediaId: story.Media?.id,
          mediaUrl: story.Media?.url,
          thumbnailId: story.Thumbnail?.id,
          thumbnailUrl: story.Thumbnail?.url,
        });
      })
      .catch((error: unknown) => {
        if (cancelled) return;
        toast.error(getUserFacingErrorMessage(error, "دریافت استوری ناموفق بود."));
        router.replace("/profile/posts?tab=stories");
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [router, storyId]);

  async function handleSubmit(data: CreateStoryData) {
    setIsSubmitting(true);
    try {
      await updateStory(storyId, data);
      toast.success("استوری ویرایش شد.");
      router.refresh();
      router.push("/profile/posts?tab=stories");
    } catch (error: unknown) {
      toast.error(getUserFacingErrorMessage(error, "ویرایش استوری ناموفق بود."));
    } finally {
      setIsSubmitting(false);
    }
  }

  if (isLoading || !initialValues) {
    return <SuspenseLoader />;
  }

  return (
    <ProfileStoryForm
      initialValues={initialValues}
      heading="ویرایش استوری"
      submitLabel="ذخیره تغییرات"
      submittingLabel="در حال ذخیره..."
      isSubmitting={isSubmitting}
      onBack={() => router.push("/profile/posts?tab=stories")}
      onSubmit={handleSubmit}
    />
  );
}
