"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Eye, Images, Pencil, Trash2 } from "lucide-react";
import toast from "react-hot-toast";
import ConfirmDialog from "@/components/Kits/ConfirmDialog";
import { PostCard, toMobilePostCardVariant } from "@/components/posts/PostCard";
import { useIsLgUp } from "@/components/posts/use-is-lg-up";
import SuspenseLoader from "@/components/ui/SuspenseLoader";
import { EmptyState } from "@/components/ui/EmptyState";
import { useSmoothLoading } from "@/hooks/useSmoothLoading";
import { PostService, type ProfilePost } from "@/services/post.service";
import { getUserFacingErrorMessage } from "@/utils/userErrorMessage";

const PROFILE_HREF = "/profile";

function cx(...parts: (string | false | undefined)[]): string {
  return parts.filter(Boolean).join(" ");
}

function ProfilePostActions({
  post,
  disabled,
  onDelete,
}: {
  post: ProfilePost;
  disabled: boolean;
  onDelete: (post: ProfilePost) => void;
}) {
  const router = useRouter();

  const buttonClass = cx(
    "inline-flex size-8 cursor-pointer items-center justify-center rounded-lg border-0",
    "bg-black/45 text-white shadow-sm backdrop-blur-md transition-colors hover:bg-black/60",
    "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-400/70",
    "disabled:cursor-not-allowed disabled:opacity-50",
  );

  return (
    <div
      dir="ltr"
      className={cx(
        "absolute left-3 top-3 z-20 flex flex-row items-center gap-1.5",
        "opacity-0 transition-opacity duration-150 group-hover:opacity-100 group-focus-within:opacity-100",
      )}
    >
      <button
        type="button"
        className={buttonClass}
        onClick={() => onDelete(post)}
        disabled={disabled}
        aria-label="حذف پست"
      >
        <Trash2 className="size-4 stroke-[1.7]" aria-hidden />
      </button>
      <button
        type="button"
        className={buttonClass}
        onClick={() => router.push(`/profile/posts/edit/${post.id}`)}
        disabled={disabled}
        aria-label="ویرایش پست"
      >
        <Pencil className="size-4 stroke-[1.7]" aria-hidden />
      </button>
      <button
        type="button"
        className={buttonClass}
        onClick={() => window.open(post.cover.previewUrl, "_blank", "noopener,noreferrer")}
        disabled={disabled}
        aria-label="مشاهده پست"
      >
        <Eye className="size-4 stroke-[1.7]" aria-hidden />
      </button>
    </div>
  );
}

export default function ProfilePostsPage() {
  const router = useRouter();
  const isLgUp = useIsLgUp();
  const [posts, setPosts] = useState<ProfilePost[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const showLoading = useSmoothLoading(isLoading, { showDelayMs: 80, minVisibleMs: 240 });
  const [deleteTarget, setDeleteTarget] = useState<ProfilePost | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const rows = await PostService.listAllForProfile();
        if (!cancelled) setPosts(rows);
      } catch (error: unknown) {
        if (!cancelled) {
          toast.error(getUserFacingErrorMessage(error, "دریافت پست‌ها ناموفق بود."));
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const gridItems = useMemo(
    () =>
      posts.map((post) => {
        const variant = isLgUp ? post.desktopVariant : toMobilePostCardVariant(post.desktopVariant);
        return { post, variant };
      }),
    [isLgUp, posts],
  );

  const openDeleteConfirm = useCallback((post: ProfilePost) => {
    setDeleteTarget(post);
  }, []);

  const closeDeleteConfirm = useCallback(() => {
    if (deletingId == null) setDeleteTarget(null);
  }, [deletingId]);

  const confirmDelete = useCallback(async () => {
    if (!deleteTarget || deletingId != null) return;
    setDeletingId(deleteTarget.id);
    try {
      await PostService.delete(deleteTarget.id);
      setPosts((prev) => prev.filter((post) => post.id !== deleteTarget.id));
      toast.success("پست حذف شد.");
      setDeleteTarget(null);
    } catch (error: unknown) {
      toast.error(getUserFacingErrorMessage(error, "حذف پست ناموفق بود."));
    } finally {
      setDeletingId(null);
    }
  }, [deleteTarget, deletingId]);

  return (
    <div className="flex w-full flex-col gap-6" dir="rtl">
      <div className="flex w-full flex-row items-center gap-3">
        <h1 className="font-peyda text-lg font-semibold text-zinc-800 lg:text-xl">
          پست‌های منتشر شده
        </h1>
        <button
          type="button"
          onClick={() => router.push(PROFILE_HREF)}
          aria-label="بازگشت به پروفایل"
          className="hidden h-9 w-9 items-center justify-center rounded-xl bg-white text-zinc-700 shadow-[0_0_14.7px_rgba(0,0,0,0.04)] transition-colors hover:bg-zinc-50 lg:inline-flex"
        >
          <ArrowRight size={18} strokeWidth={1.8} aria-hidden />
        </button>
      </div>

      {isLoading ? (
        showLoading ? <SuspenseLoader /> : null
      ) : posts.length === 0 ? (
        <EmptyState
          icon={Images}
          title="هنوز پستی ثبت نشده است"
          description="پست‌های منتشرشده شما اینجا نمایش داده می‌شوند."
        />
      ) : (
        <div className="grid w-full grid-flow-dense grid-cols-2 gap-x-2 gap-y-4 sm:grid-cols-3 lg:grid-cols-4">
          {gridItems.map(({ post, variant }) => (
            <div
              key={post.id}
              className={cx(
                "group relative flex min-w-0 justify-center",
                variant === "xl" || variant === "mobile-lg" ? "col-span-2 row-span-2" : "col-span-1",
              )}
            >
              <PostCard
                variant={variant}
                widthMode="fluid"
                fluidMaxWidth="none"
                imageSrc={post.cover.previewUrl}
                imageAlt={post.cover.alternativeText ?? post.title}
                likesCount={post.likesCount}
                commentsCount={post.commentsCount}
              />
              <ProfilePostActions
                post={post}
                disabled={deletingId === post.id}
                onDelete={openDeleteConfirm}
              />
            </div>
          ))}
        </div>
      )}

      <ConfirmDialog
        isOpen={deleteTarget != null}
        title="حذف پست"
        description="آیا از حذف این پست مطمئن هستید؟ این عملیات قابل بازگشت نیست."
        confirmText={deletingId != null ? "در حال حذف..." : "بله، حذف کن"}
        cancelText="انصراف"
        onConfirm={confirmDelete}
        onCancel={closeDeleteConfirm}
      />
    </div>
  );
}
