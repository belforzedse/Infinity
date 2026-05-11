"use client";

/**
 * Step 3 of the create-post flow.
 *
 * Reads the chosen post size from `?size=xl|l|m|s` and stitches together the
 * cover uploader, gallery uploader, fields row, and lean caption editor. On
 * publish, it uploads all media in parallel, then sends `POST /posts` with the
 * Strapi-shaped payload and routes the user to `/profile/posts` on success.
 *
 * Sidebar is hidden by `ProfileSidebar`'s `startsWith("/profile/posts/add")`
 * early-return (same pattern as the prior add-post steps), so this page renders
 * full-width inside `ProfileLayout`.
 */

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowRight } from "lucide-react";
import toast from "react-hot-toast";
import { Button } from "@/components/ui/Button";
import { CaptionEditor } from "@/components/posts/CaptionEditor";
import { CoverImageCard } from "@/components/posts/CoverImageCard";
import { PostFieldsRow } from "@/components/posts/PostFieldsRow";
import { PostGalleryCard } from "@/components/posts/PostGalleryCard";
import Text from "@/components/Kits/Text";
import { useCoverUpload, useGalleryUpload } from "@/hooks/use-file-upload";
import {
  POST_SIZE_TO_ENUM,
  PostService,
  type PostSizeCode,
} from "@/services/post.service";
import { autoSlug, slugifyBody, withUniqueSuffix } from "@/utils/post-slug";
import { getUserFacingErrorMessage } from "@/utils/userErrorMessage";

const PARENT_HREF = "/profile/posts/add/post";
const CANCEL_HREF = "/profile";
const POSTS_HREF = "/profile/posts";

/**
 * Pixel dimensions for each size code, kept in sync with the size-selector
 * step (`apps/social/src/app/profile/posts/add/post/page.tsx`). The post page
 * uses these as an aspect-ratio source for the cover preview so the card
 * literally shows the silhouette of the chosen post size.
 */
const SIZE_DIMENSIONS: Readonly<Record<PostSizeCode, { w: number; h: number }>> = {
  xl: { w: 380, h: 536 },
  l: { w: 280, h: 464 },
  m: { w: 280, h: 260 },
  s: { w: 180, h: 260 },
};

const SIZE_CODES = new Set<PostSizeCode>(["xl", "l", "m", "s"]);

function parseSizeParam(raw: string | null): PostSizeCode | null {
  if (!raw) return null;
  const normalized = raw.toLowerCase();
  return SIZE_CODES.has(normalized as PostSizeCode) ? (normalized as PostSizeCode) : null;
}

function stripHtml(html: string): string {
  if (!html) return "";
  return html.replace(/<[^>]*>/g, "").trim();
}

export default function AddPostContentPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const size = useMemo(() => parseSizeParam(searchParams.get("size")), [searchParams]);

  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [slugDirty, setSlugDirty] = useState(false);
  const [productLink, setProductLink] = useState("");
  const [captionHtml, setCaptionHtml] = useState("");
  const [isPublishing, setIsPublishing] = useState(false);

  const cover = useCoverUpload();
  const gallery = useGalleryUpload();

  /** Send users straight back to step 2 if the size param is missing/invalid. */
  useEffect(() => {
    if (size == null) {
      router.replace(PARENT_HREF);
    }
  }, [size, router]);

  /** Auto-derive the slug from the title until the user customises it. */
  const handleTitleChange = (value: string) => {
    setTitle(value);
    if (!slugDirty) {
      setSlug(slugifyBody(value));
    }
  };

  const handleSlugChange = (value: string) => {
    setSlug(value);
    setSlugDirty(true);
  };

  const handleBack = () => router.push(PARENT_HREF);
  const handleCancel = () => router.push(CANCEL_HREF);

  const canPublish =
    size != null &&
    title.trim().length > 0 &&
    cover.hasMedia &&
    gallery.items.length >= 1 &&
    stripHtml(captionHtml).length > 0 &&
    !isPublishing;

  const handlePublish = async () => {
    if (!canPublish || size == null) return;

    const trimmedTitle = title.trim();
    const trimmedLink = productLink.trim();
    const captionForWire = captionHtml.trim();

    setIsPublishing(true);
    try {
      const [coverId, mediaIds] = await Promise.all([
        cover.upload(),
        gallery.uploadAll(),
      ]);

      const slugBody = slug.trim() || slugifyBody(trimmedTitle);
      const finalSlug = slugBody ? withUniqueSuffix(slugBody) : autoSlug(trimmedTitle);

      await PostService.create({
        title: trimmedTitle,
        slug: finalSlug,
        description: captionForWire,
        coverId,
        mediaIds,
        productLink: trimmedLink || undefined,
        size: POST_SIZE_TO_ENUM[size],
      });

      toast.success("پست منتشر شد.");
      router.push(POSTS_HREF);
    } catch (error: unknown) {
      toast.error(
        getUserFacingErrorMessage(
          error,
          "انتشار پست ناموفق بود. دوباره تلاش کنید",
        ),
      );
    } finally {
      setIsPublishing(false);
    }
  };

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
    <div className="flex w-full flex-col gap-8 lg:gap-10">
      <div className="flex w-full flex-row items-center gap-3">
        <h1 className="font-peyda text-lg font-semibold text-zinc-800 lg:text-xl">
          انتشار پست
        </h1>
        <button
          type="button"
          onClick={handleBack}
          aria-label="بازگشت به مرحله ی قبل"
          className="hidden h-9 w-9 items-center justify-center rounded-xl bg-white text-zinc-700 shadow-[0_0_14.7px_rgba(0,0,0,0.04)] transition-colors hover:bg-zinc-50 lg:inline-flex"
        >
          <ArrowRight size={18} strokeWidth={1.8} aria-hidden />
        </button>
      </div>

      <div className="grid w-full grid-cols-1 gap-4 lg:grid-cols-3 lg:gap-6">
        <div className="order-1 lg:order-2 lg:col-span-1">
          <CoverImageCard controller={cover} aspectRatio={SIZE_DIMENSIONS[size]} />
        </div>
        <div className="order-2 lg:order-1 lg:col-span-2">
          <PostGalleryCard controller={gallery} />
        </div>
      </div>

      <PostFieldsRow
        title={title}
        onTitleChange={handleTitleChange}
        slug={slug}
        onSlugChange={handleSlugChange}
        productLink={productLink}
        onProductLinkChange={setProductLink}
        disabled={isPublishing}
      />

      <div className="space-y-2">
        <label htmlFor="post-caption" className="block text-right">
          <Text variant="label" className="!text-sm !text-zinc-600">
            کپشن
          </Text>
        </label>
        <div id="post-caption">
          <CaptionEditor
            value={captionHtml}
            onChange={setCaptionHtml}
            disabled={isPublishing}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 [&>button]:w-full lg:flex lg:flex-row lg:justify-end lg:[&>button]:w-auto">
        <Button
          variant="blue"
          disabled={!canPublish}
          onClick={handlePublish}
          aria-label="انتشار پست"
        >
          {isPublishing ? "در حال انتشار..." : "انتشار"}
        </Button>
        <Button
          variant="default"
          onClick={handleCancel}
          disabled={isPublishing}
          aria-label="انصراف از انتشار پست"
        >
          انصراف
        </Button>
      </div>
    </div>
  );
}
