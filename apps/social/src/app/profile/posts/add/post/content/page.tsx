"use client";

import { Suspense, useEffect, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { PostContentForm } from "@/components/posts/PostContentForm";
import { parsePostCreateSizeParam } from "@/components/posts/post-size-config";
import { POST_SIZE_TO_ENUM, PostService } from "@/services/post.service";
import { autoSlug, slugifyBody, withUniqueSuffix } from "@/utils/post-slug";
import SuspenseLoader from "@/components/ui/SuspenseLoader";

const PARENT_HREF = "/profile/posts/add/post";
const CANCEL_HREF = "/profile";
const POSTS_HREF = "/profile/posts";

function AddPostContentPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const size = useMemo(() => parsePostCreateSizeParam(searchParams.get("size")), [searchParams]);

  useEffect(() => {
    if (size == null) {
      router.replace(PARENT_HREF);
    }
  }, [size, router]);

  if (size == null) {
    return (
      <div className="flex w-full flex-col gap-4">
        <h1 className="font-peyda text-lg font-semibold text-zinc-800">
          در حال هدایت به مرحله انتخاب سایز...
        </h1>
      </div>
    );
  }

  return (
    <PostContentForm
      size={size}
      heading="انتشار پست"
      submitText="انتشار"
      submittingText="در حال انتشار..."
      submitAriaLabel="انتشار پست"
      cancelAriaLabel="انصراف از انتشار پست"
      successMessage="پست منتشر شد."
      errorMessage="انتشار پست ناموفق بود. دوباره تلاش کنید"
      onBack={() => router.push(PARENT_HREF)}
      onCancel={() => router.push(CANCEL_HREF)}
      onSubmit={async (input) => {
        const slugBody = input.slug || slugifyBody(input.title);
        const finalSlug = slugBody ? withUniqueSuffix(slugBody) : autoSlug(input.title);

        await PostService.create({
          title: input.title,
          slug: finalSlug,
          description: input.description,
          coverId: input.coverId,
          mediaIds: input.mediaIds,
          productLink: input.productLink,
          size: POST_SIZE_TO_ENUM[size],
        });
        router.refresh();
        router.push(POSTS_HREF);
      }}
    />
  );
}

export default function AddPostContentPage() {
  return (
    <Suspense fallback={<SuspenseLoader />}>
      <AddPostContentPageInner />
    </Suspense>
  );
}
