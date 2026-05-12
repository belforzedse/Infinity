"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { PostContentForm, type PostContentFormInitialValue } from "@/components/posts/PostContentForm";
import SuspenseLoader from "@/components/ui/SuspenseLoader";
import { POST_SIZE_TO_ENUM } from "@/services/post.service";
import { PostService, postSizeToCode, type ProfilePost } from "@/services/post.service";

const POSTS_HREF = "/profile/posts";

function initialValueFromPost(post: ProfilePost): PostContentFormInitialValue {
  return {
    title: post.title,
    slug: post.slug,
    productLink: post.productLink,
    description: post.description,
    cover: {
      id: post.cover.id,
      preview: post.cover.previewUrl,
      isVideo: false,
    },
    media: post.media.map((media) => ({
      id: media.id,
      preview: media.previewUrl,
      isVideo: media.mime?.toLowerCase().startsWith("video/") === true,
    })),
  };
}

export default function EditPostPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const postId = Number(params.id);
  const [post, setPost] = useState<ProfilePost | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    if (!Number.isFinite(postId) || postId <= 0) {
      setError("شناسه پست نامعتبر است.");
      setIsLoading(false);
      return;
    }

    (async () => {
      try {
        const loaded = await PostService.getById(postId);
        if (!cancelled) {
          setPost(loaded);
          setError(null);
        }
      } catch {
        if (!cancelled) {
          setError("دریافت اطلاعات پست ناموفق بود.");
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [postId]);

  const size = useMemo(() => (post ? postSizeToCode(post.size) : "sm"), [post]);

  if (isLoading) {
    return <SuspenseLoader />;
  }

  if (!post || error) {
    return (
      <div className="flex w-full flex-col gap-4" dir="rtl">
        <h1 className="font-peyda text-lg font-semibold text-zinc-800">ویرایش پست</h1>
        <p className="font-peyda text-sm text-zinc-500">{error ?? "پست یافت نشد."}</p>
      </div>
    );
  }

  return (
    <PostContentForm
      size={size}
      heading="ویرایش پست"
      submitText="ذخیره"
      submittingText="در حال ذخیره..."
      submitAriaLabel="ذخیره تغییرات پست"
      cancelAriaLabel="انصراف از ویرایش پست"
      successMessage="پست ویرایش شد."
      errorMessage="ویرایش پست ناموفق بود. دوباره تلاش کنید"
      initialValue={initialValueFromPost(post)}
      onBack={() => router.push(POSTS_HREF)}
      onCancel={() => router.push(POSTS_HREF)}
      onSubmit={async (input) => {
        await PostService.update(post.id, {
          title: input.title,
          slug: input.slug,
          description: input.description,
          coverId: input.coverId,
          mediaIds: input.mediaIds,
          productLink: input.productLink,
          size: POST_SIZE_TO_ENUM[size],
        });
        router.push(POSTS_HREF);
      }}
    />
  );
}
