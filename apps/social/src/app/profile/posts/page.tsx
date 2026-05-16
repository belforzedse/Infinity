"use client";

import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowRight, Check, Eye, EyeOff, Image as ImageIcon, Images, MessageSquareText, Pencil, Plus, Trash2, Video, X } from "lucide-react";
import toast from "react-hot-toast";
import { IMAGE_BASE_URL } from "@repo/api";
import ConfirmDialog from "@/components/Kits/ConfirmDialog";
import { PostCard, toMobilePostCardVariant } from "@/components/posts/PostCard";
import { useIsLgUp } from "@/components/posts/use-is-lg-up";
import { ProfilePostsGridSkeleton } from "@/components/ui/skeletons/ProfilePostsGridSkeleton";
import SuspenseLoader from "@/components/ui/SuspenseLoader";
import { EmptyState } from "@/components/ui/EmptyState";
import { BlurImage } from "@/components/ui/BlurImage";
import { useSmoothLoading } from "@/hooks/useSmoothLoading";
import {
  approvePostComment,
  listPendingPostComments,
  rejectPostComment,
  type PendingPostComment,
} from "@/services/post-comment.service";
import { PostService, type ProfilePost } from "@/services/post.service";
import { getUserFacingErrorMessage } from "@/utils/userErrorMessage";
import { deleteStory, listStories, updateStory } from "@/services/story.service";
import type { Story } from "@/types/story";

const PROFILE_HREF = "/profile";
type ProfilePostsTab = "posts" | "stories" | "comments";
type CommentAction = "approve" | "reject";

function cx(...parts: (string | false | undefined)[]): string {
  return parts.filter(Boolean).join(" ");
}

function formatCommentDate(value: string): string {
  if (!value) return "بدون تاریخ";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "بدون تاریخ";
  return new Intl.DateTimeFormat("fa-IR", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function resolveStoryMediaUrl(url?: string): string | undefined {
  if (!url) return undefined;
  if (url.startsWith("http://") || url.startsWith("https://")) return url;
  const base = IMAGE_BASE_URL.replace(/\/+$/, "");
  return `${base}/${url.replace(/^\/+/, "")}`;
}

function formatStoryDate(value?: string): string {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat("fa-IR", { dateStyle: "medium" }).format(date);
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

function ProfilePostsTabs({
  activeTab,
  onChange,
  pendingCount,
}: {
  activeTab: ProfilePostsTab;
  onChange: (tab: ProfilePostsTab) => void;
  pendingCount: number;
}) {
  const tabs: readonly { id: ProfilePostsTab; label: string; count?: number }[] = [
    { id: "posts", label: "پست‌ها" },
    { id: "stories", label: "استوری‌ها" },
    { id: "comments", label: "دیدگاه‌ها", count: pendingCount },
  ];

  return (
    <div className="inline-flex w-full rounded-2xl bg-white p-1 shadow-[0_0_14.7px_rgba(0,0,0,0.04)] sm:w-auto">
      {tabs.map((tab) => {
        const active = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => onChange(tab.id)}
            className={cx(
              "inline-flex h-10 flex-1 items-center justify-center gap-2 rounded-xl px-4 font-peyda text-sm font-semibold transition-colors sm:flex-none",
              active
                ? "bg-[#3D4C6E] text-white shadow-sm"
                : "text-[#7B8498] hover:bg-slate-50 hover:text-[#3D4C6E]",
            )}
            aria-pressed={active}
          >
            {tab.label}
            {tab.count != null && tab.count > 0 ? (
              <span
                className={cx(
                  "inline-flex min-w-5 items-center justify-center rounded-full px-1.5 text-xs leading-5",
                  active ? "bg-white/20 text-white" : "bg-[#EEF2FF] text-[#3D4C6E]",
                )}
              >
                {new Intl.NumberFormat("fa-IR").format(tab.count)}
              </span>
            ) : null}
          </button>
        );
      })}
    </div>
  );
}

function StoriesTable({
  stories,
  togglingId,
  deletingId,
  onToggle,
  onEdit,
  onDelete,
}: {
  stories: readonly Story[];
  togglingId: number | null;
  deletingId: number | null;
  onToggle: (story: Story) => void;
  onEdit: (story: Story) => void;
  onDelete: (story: Story) => void;
}) {
  return (
    <div className="overflow-hidden rounded-2xl bg-white shadow-[0_0_14.7px_rgba(0,0,0,0.04)]">
      <div className="overflow-x-auto">
        <table className="min-w-[760px] w-full border-collapse text-right font-peyda">
          <thead className="bg-[#F8FAFC] text-xs font-semibold text-[#7B8498]">
            <tr>
              <th className="px-4 py-3">عنوان</th>
              <th className="px-4 py-3">نوع</th>
              <th className="px-4 py-3 text-center">ترتیب</th>
              <th className="px-4 py-3">شروع</th>
              <th className="px-4 py-3">پایان</th>
              <th className="px-4 py-3 text-center">وضعیت</th>
              <th className="px-4 py-3 text-center">عملیات</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-sm text-[#424242]">
            {stories.map((story) => {
              const thumbnail = resolveStoryMediaUrl(story.Thumbnail?.url ?? story.Media?.url);
              return (
                <tr key={story.id}>
                  <td className="px-4 py-3">
                    <div className="flex min-w-0 items-center gap-3">
                      <div className="flex size-12 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-slate-100">
                        {thumbnail ? (
                          <img src={thumbnail} alt="" className="h-full w-full object-cover" />
                        ) : story.MediaType === "video" ? (
                          <Video className="size-5 text-slate-400" aria-hidden />
                        ) : (
                          <ImageIcon className="size-5 text-slate-400" aria-hidden />
                        )}
                      </div>
                      <span className="min-w-0 font-semibold text-[#3D4C6E]">{story.Title}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-[#64748B]">{story.MediaType === "video" ? "ویدیو" : "تصویر"}</td>
                  <td className="px-4 py-3 text-center text-[#64748B]">{story.SortOrder}</td>
                  <td className="px-4 py-3 text-[#64748B]">{formatStoryDate(story.StartAt)}</td>
                  <td className="px-4 py-3 text-[#64748B]">{formatStoryDate(story.EndAt)}</td>
                  <td className="px-4 py-3 text-center">
                    <button
                      type="button"
                      disabled={togglingId === story.id}
                      onClick={() => onToggle(story)}
                      className={cx(
                        "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold transition-colors disabled:opacity-50",
                        story.IsActive
                          ? "bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                          : "bg-slate-100 text-slate-500 hover:bg-slate-200",
                      )}
                    >
                      {story.IsActive ? <Eye className="size-3" aria-hidden /> : <EyeOff className="size-3" aria-hidden />}
                      {story.IsActive ? "فعال" : "غیرفعال"}
                    </button>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-center gap-1">
                      <button
                        type="button"
                        onClick={() => onEdit(story)}
                        className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-700"
                        aria-label="ویرایش استوری"
                      >
                        <Pencil className="size-4" aria-hidden />
                      </button>
                      <button
                        type="button"
                        disabled={deletingId === story.id}
                        onClick={() => onDelete(story)}
                        className="rounded-lg p-2 text-slate-500 hover:bg-rose-50 hover:text-rose-600 disabled:opacity-50"
                        aria-label="حذف استوری"
                      >
                        <Trash2 className="size-4" aria-hidden />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function PendingCommentsTable({
  comments,
  actionCommentId,
  onAction,
}: {
  comments: readonly PendingPostComment[];
  actionCommentId: number | null;
  onAction: (comment: PendingPostComment, action: CommentAction) => void;
}) {
  return (
    <div className="overflow-hidden rounded-2xl bg-white shadow-[0_0_14.7px_rgba(0,0,0,0.04)]">
      <div className="overflow-x-auto">
        <table className="min-w-[720px] w-full border-collapse text-right font-peyda">
          <thead className="bg-[#F8FAFC] text-xs font-semibold text-[#7B8498]">
            <tr>
              <th className="px-4 py-3">پست</th>
              <th className="px-4 py-3">دیدگاه</th>
              <th className="px-4 py-3">نویسنده</th>
              <th className="px-4 py-3">تاریخ</th>
              <th className="px-4 py-3 text-center">عملیات</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-sm text-[#424242]">
            {comments.map((comment) => {
              const busy = actionCommentId === comment.id;
              return (
                <tr key={comment.id} className="align-middle">
                  <td className="w-[230px] px-4 py-3">
                    <div className="flex min-w-0 flex-row items-center gap-3">
                      <div className="relative size-14 shrink-0 overflow-hidden rounded-xl bg-slate-100">
                        {comment.post?.coverUrl ? (
                          <BlurImage
                            src={comment.post.coverUrl}
                            alt={comment.post.title}
                            fill
                            sizes="56px"
                            className="object-cover"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-[#94A3B8]">
                            <Images className="size-5" strokeWidth={1.6} aria-hidden />
                          </div>
                        )}
                      </div>
                      <span className="line-clamp-2 min-w-0 text-xs font-semibold leading-5 text-[#3D4C6E]">
                        {comment.post?.title ?? "پست حذف‌شده"}
                      </span>
                    </div>
                  </td>
                  <td className="max-w-[320px] px-4 py-3">
                    <p className="line-clamp-3 leading-6 text-[#424242]">{comment.content}</p>
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-[#64748B]">{comment.name}</td>
                  <td className="whitespace-nowrap px-4 py-3 text-xs text-[#7B8498]">
                    {formatCommentDate(comment.date)}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-row items-center justify-center gap-2">
                      <button
                        type="button"
                        onClick={() => onAction(comment, "approve")}
                        disabled={busy}
                        className="inline-flex h-9 items-center justify-center gap-1.5 rounded-xl bg-emerald-50 px-3 text-xs font-semibold text-emerald-700 transition-colors hover:bg-emerald-100 disabled:pointer-events-none disabled:opacity-50"
                      >
                        <Check className="size-4" strokeWidth={1.8} aria-hidden />
                        تایید
                      </button>
                      <button
                        type="button"
                        onClick={() => onAction(comment, "reject")}
                        disabled={busy}
                        className="inline-flex h-9 items-center justify-center gap-1.5 rounded-xl bg-rose-50 px-3 text-xs font-semibold text-rose-700 transition-colors hover:bg-rose-100 disabled:pointer-events-none disabled:opacity-50"
                      >
                        <X className="size-4" strokeWidth={1.8} aria-hidden />
                        رد
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function ProfilePostsPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isLgUp = useIsLgUp();
  const requestedTab = searchParams.get("tab");
  const initialTab: ProfilePostsTab =
    requestedTab === "stories" || requestedTab === "comments" ? requestedTab : "posts";
  const [activeTab, setActiveTab] = useState<ProfilePostsTab>(initialTab);
  const [posts, setPosts] = useState<ProfilePost[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const showLoading = useSmoothLoading(isLoading, { showDelayMs: 80, minVisibleMs: 240 });
  const [deleteTarget, setDeleteTarget] = useState<ProfilePost | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [pendingComments, setPendingComments] = useState<PendingPostComment[]>([]);
  const [commentsLoaded, setCommentsLoaded] = useState(false);
  const [isCommentsLoading, setIsCommentsLoading] = useState(false);
  const [commentActionId, setCommentActionId] = useState<number | null>(null);
  const [stories, setStories] = useState<Story[]>([]);
  const [storiesLoaded, setStoriesLoaded] = useState(false);
  const [isStoriesLoading, setIsStoriesLoading] = useState(false);
  const [storySearch, setStorySearch] = useState("");
  const [storyFilter, setStoryFilter] = useState<"all" | "active" | "inactive">("all");
  const [storyDeleteTarget, setStoryDeleteTarget] = useState<Story | null>(null);
  const [deletingStoryId, setDeletingStoryId] = useState<number | null>(null);
  const [togglingStoryId, setTogglingStoryId] = useState<number | null>(null);
  const commentsRequestId = useRef(0);
  const isMountedRef = useRef(true);

  useEffect(() => {
    if (requestedTab === "posts" || requestedTab === "stories" || requestedTab === "comments") {
      setActiveTab(requestedTab);
    }
  }, [requestedTab]);

  useEffect(() => {
    if (activeTab !== "stories" || storiesLoaded || isStoriesLoading) return;
    setIsStoriesLoading(true);
    listStories({ pageSize: 100, sort: "SortOrder:asc" })
      .then((rows) => {
        if (isMountedRef.current) {
          setStories(rows.data);
          setStoriesLoaded(true);
        }
      })
      .catch((error: unknown) => {
        if (isMountedRef.current) {
          toast.error(getUserFacingErrorMessage(error, "دریافت استوری‌ها ناموفق بود."));
        }
      })
      .finally(() => {
        if (isMountedRef.current) setIsStoriesLoading(false);
      });
  }, [activeTab, isStoriesLoading, storiesLoaded]);

  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

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

  useEffect(() => {
    if (activeTab !== "comments" || commentsLoaded || isCommentsLoading) return;

    const requestId = commentsRequestId.current + 1;
    commentsRequestId.current = requestId;
    setIsCommentsLoading(true);

    listPendingPostComments()
      .then((rows) => {
        if (isMountedRef.current && commentsRequestId.current === requestId) {
          setPendingComments(rows);
          setCommentsLoaded(true);
        }
      })
      .catch((error: unknown) => {
        if (isMountedRef.current && commentsRequestId.current === requestId) {
          toast.error(getUserFacingErrorMessage(error, "دریافت دیدگاه‌ها ناموفق بود."));
        }
      })
      .finally(() => {
        if (isMountedRef.current && commentsRequestId.current === requestId) {
          setIsCommentsLoading(false);
        }
      });
  }, [activeTab, commentsLoaded, isCommentsLoading]);

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

  const handleCommentAction = useCallback(async (comment: PendingPostComment, action: CommentAction) => {
    if (commentActionId != null) return;

    setCommentActionId(comment.id);
    try {
      if (action === "approve") {
        await approvePostComment(comment.id);
        toast.success("دیدگاه تایید شد.");
      } else {
        await rejectPostComment(comment.id);
        toast.success("دیدگاه رد شد.");
      }
      setPendingComments((prev) => prev.filter((item) => item.id !== comment.id));
    } catch (error: unknown) {
      toast.error(
        getUserFacingErrorMessage(
          error,
          action === "approve" ? "تایید دیدگاه ناموفق بود." : "رد دیدگاه ناموفق بود.",
        ),
      );
    } finally {
      setCommentActionId(null);
    }
  }, [commentActionId]);

  const filteredStories = useMemo(
    () =>
      stories.filter((story) => {
        const matchesSearch = story.Title.toLowerCase().includes(storySearch.trim().toLowerCase());
        const matchesFilter =
          storyFilter === "all" ||
          (storyFilter === "active" && story.IsActive) ||
          (storyFilter === "inactive" && !story.IsActive);
        return matchesSearch && matchesFilter;
      }),
    [stories, storyFilter, storySearch],
  );

  const handleStoryToggle = useCallback(async (story: Story) => {
    if (togglingStoryId != null) return;
    setTogglingStoryId(story.id);
    try {
      const updated = await updateStory(story.id, { IsActive: !story.IsActive });
      setStories((prev) => prev.map((item) => (item.id === story.id ? updated : item)));
      toast.success(story.IsActive ? "استوری غیرفعال شد." : "استوری فعال شد.");
    } catch (error: unknown) {
      toast.error(getUserFacingErrorMessage(error, "تغییر وضعیت استوری ناموفق بود."));
    } finally {
      setTogglingStoryId(null);
    }
  }, [togglingStoryId]);

  const confirmStoryDelete = useCallback(async () => {
    if (!storyDeleteTarget || deletingStoryId != null) return;
    setDeletingStoryId(storyDeleteTarget.id);
    try {
      await deleteStory(storyDeleteTarget.id);
      setStories((prev) => prev.filter((story) => story.id !== storyDeleteTarget.id));
      toast.success("استوری حذف شد.");
      setStoryDeleteTarget(null);
    } catch (error: unknown) {
      toast.error(getUserFacingErrorMessage(error, "حذف استوری ناموفق بود."));
    } finally {
      setDeletingStoryId(null);
    }
  }, [deletingStoryId, storyDeleteTarget]);

  return (
    <div className="flex w-full flex-col gap-6" dir="rtl">
      <div className="flex w-full flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-row items-center gap-3">
        <h1 className="font-peyda text-lg font-semibold text-zinc-800 lg:text-xl">
          پست‌های اینفینیتی
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
        <ProfilePostsTabs
          activeTab={activeTab}
          onChange={(tab) => {
            setActiveTab(tab);
            router.replace(tab === "posts" ? "/profile/posts" : `/profile/posts?tab=${tab}`);
          }}
          pendingCount={pendingComments.length}
        />
      </div>

      {activeTab === "posts" && (isLoading ? (
        showLoading ? <ProfilePostsGridSkeleton /> : null
      ) :posts.length === 0 ? (
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
      ))}

      {activeTab === "comments" && (isCommentsLoading ? (
        <SuspenseLoader />
      ) : pendingComments.length === 0 ? (
        <EmptyState
          icon={MessageSquareText}
          title="دیدگاه در انتظار تایید ندارید"
          description="دیدگاه‌های جدیدی که نیاز به بررسی داشته باشند اینجا نمایش داده می‌شوند."
        />
      ) : (
        <PendingCommentsTable
          comments={pendingComments}
          actionCommentId={commentActionId}
          onAction={handleCommentAction}
        />
      ))}

      {activeTab === "stories" && (
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-1 flex-col gap-3 sm:flex-row">
              <input
                value={storySearch}
                onChange={(event) => setStorySearch(event.target.value)}
                placeholder="جستجو در عنوان استوری"
                className="h-11 min-w-0 flex-1 rounded-2xl border-0 bg-white px-4 font-peyda text-sm shadow-[0_0_14.7px_rgba(0,0,0,0.04)] outline-none"
              />
              <div className="inline-flex rounded-2xl bg-white p-1 shadow-[0_0_14.7px_rgba(0,0,0,0.04)]">
                {(["all", "active", "inactive"] as const).map((filter) => (
                  <button
                    key={filter}
                    type="button"
                    onClick={() => setStoryFilter(filter)}
                    className={cx(
                      "h-9 rounded-xl px-3 font-peyda text-sm transition-colors",
                      storyFilter === filter ? "bg-[#3D4C6E] text-white" : "text-[#7B8498] hover:bg-slate-50",
                    )}
                  >
                    {filter === "all" ? "همه" : filter === "active" ? "فعال" : "غیرفعال"}
                  </button>
                ))}
              </div>
            </div>
            <button
              type="button"
              onClick={() => router.push("/profile/posts/add/story")}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-full bg-[#3D4C6E] px-5 font-peyda text-sm font-medium text-white shadow-sm"
            >
              <Plus className="size-4" aria-hidden />
              استوری جدید
            </button>
          </div>

          {isStoriesLoading ? (
            <SuspenseLoader />
          ) : filteredStories.length === 0 ? (
            <EmptyState
              icon={Images}
              title="استوری‌ای یافت نشد"
              description="استوری‌های ایجادشده اینجا نمایش داده می‌شوند."
            />
          ) : (
            <StoriesTable
              stories={filteredStories}
              togglingId={togglingStoryId}
              deletingId={deletingStoryId}
              onToggle={handleStoryToggle}
              onEdit={(story) => router.push(`/profile/posts/stories/${story.id}/edit`)}
              onDelete={setStoryDeleteTarget}
            />
          )}
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
      <ConfirmDialog
        isOpen={storyDeleteTarget != null}
        title="حذف استوری"
        description="آیا از حذف این استوری مطمئن هستید؟ این عملیات قابل بازگشت نیست."
        confirmText={deletingStoryId != null ? "در حال حذف..." : "بله، حذف کن"}
        cancelText="انصراف"
        onConfirm={confirmStoryDelete}
        onCancel={() => {
          if (deletingStoryId == null) setStoryDeleteTarget(null);
        }}
      />
    </div>
  );
}

export default function ProfilePostsPage() {
  return (
    <Suspense fallback={<SuspenseLoader />}>
      <ProfilePostsPageInner />
    </Suspense>
  );
}
