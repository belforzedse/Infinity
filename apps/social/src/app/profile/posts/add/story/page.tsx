"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { ProfileStoryForm } from "@/components/stories/ProfileStoryForm";
import { createStory } from "@/services/story.service";
import type { CreateStoryData } from "@/types/story";
import { getUserFacingErrorMessage } from "@/utils/userErrorMessage";

export default function AddStoryPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(data: CreateStoryData) {
    setIsSubmitting(true);
    try {
      await createStory(data);
      toast.success("استوری ایجاد شد.");
      router.refresh();
      router.push("/profile/posts?tab=stories");
    } catch (error: unknown) {
      toast.error(getUserFacingErrorMessage(error, "ایجاد استوری ناموفق بود."));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <ProfileStoryForm
      heading="افزودن استوری"
      submitLabel="ایجاد استوری"
      submittingLabel="در حال ایجاد..."
      isSubmitting={isSubmitting}
      onBack={() => router.push("/profile/posts/add")}
      onSubmit={handleSubmit}
    />
  );
}
