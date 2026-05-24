"use client";

import { useCallback, useEffect, useId, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import {
  Bookmark,
  ChevronLeft,
  ChevronRight,
  Heart,
  MessageCircle,
  MessageSquareText,
  SendHorizonal,
} from "lucide-react";
import toast from "react-hot-toast";
import type { PostDetail, PostDetailComment, PostDetailMedia } from "@/services/post-detail.service";
import { createPostComment } from "@/services/post-comment.service";
import { getLikedPostCommentIds, togglePostCommentLike } from "@/services/post-comment-like.service";
import { getLikedPostIds, hasAccessToken, togglePostLike } from "@/services/post-like.service";
import { getBookmarkedPostIds, togglePostBookmark } from "@/services/post-bookmark.service";
import { BlurImage } from "@/components/ui/BlurImage";
import { Button } from "@repo/ui/button";
import { EmptyState } from "@/components/ui/EmptyState";
import { InfinityMarkCircle } from "@/components/InfinityMarkCircle";
import { getUserFacingErrorMessage } from "@/utils/userErrorMessage";
import {
  clearCommentDraft,
  readCommentDraft,
  saveCommentDraft,
} from "@/lib/offline-snapshots";

function cx(...parts: (string | false | undefined)[]): string {
  return parts.filter(Boolean).join(" ");
}

const numberFormat = new Intl.NumberFormat("fa-IR");

function formatCount(value: number): string {
  if (value >= 1000) {
    const compact = Math.round((value / 1000) * 10) / 10;
    return `${new Intl.NumberFormat("fa-IR", { maximumFractionDigits: 1 }).format(compact)}K`;
  }
  return numberFormat.format(value);
}

function formatRelativeTime(value: string): string {
  const date = new Date(value);
  const ms = Date.now() - date.getTime();
  if (Number.isNaN(ms)) return "";
  const minutes = Math.max(1, Math.round(ms / 60000));
  if (minutes < 60) return `${numberFormat.format(minutes)} دقیقه پیش`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${numberFormat.format(hours)} ساعت پیش`;
  const days = Math.round(hours / 24);
  return `${numberFormat.format(days)} روز پیش`;
}

function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("");
}

function Avatar({ comment }: { comment: PostDetailComment }) {
  if (comment.isOfficialAuthor) {
    return <InfinityMarkCircle circleSize={42} markSize={30} className="shrink-0" />;
  }

  if (comment.authorAvatarUrl) {
    return (
      <BlurImage
        src={comment.authorAvatarUrl}
        alt={comment.authorName}
        width={42}
        height={42}
        className="size-[42px] shrink-0 rounded-full object-cover"
      />
    );
  }

  return (
    <div className="flex size-[42px] shrink-0 items-center justify-center rounded-full bg-[linear-gradient(145deg,#f5a3b6,#d9e2ff)] font-peyda text-sm font-semibold text-white">
      {initials(comment.authorName) || "ا"}
    </div>
  );
}

function updateCommentById(
  rows: PostDetailComment[],
  id: string,
  updater: (comment: PostDetailComment) => PostDetailComment,
): PostDetailComment[] {
  return rows.map((comment) => {
    if (comment.id === id) return updater(comment);
    if (comment.replies.length === 0) return comment;
    return {
      ...comment,
      replies: updateCommentById(comment.replies, id, updater),
    };
  });
}

function insertReplyById(
  rows: PostDetailComment[],
  parentId: string,
  reply: PostDetailComment,
): PostDetailComment[] {
  return rows.map((comment) => {
    if (comment.id === parentId) {
      return {
        ...comment,
        replies: [reply, ...comment.replies],
      };
    }
    if (comment.replies.length === 0) return comment;
    return {
      ...comment,
      replies: insertReplyById(comment.replies, parentId, reply),
    };
  });
}

function CommentItem({
  comment,
  isReply = false,
  likedCommentIds,
  pendingCommentLikes,
  onReply,
  onToggleLike,
}: {
  comment: PostDetailComment;
  isReply?: boolean;
  likedCommentIds: Readonly<Record<string, boolean>>;
  pendingCommentLikes: Readonly<Record<string, boolean>>;
  onReply: (comment: PostDetailComment) => void;
  onToggleLike: (comment: PostDetailComment) => void;
}) {
  const [showReplies, setShowReplies] = useState(false);
  const hasReplies = comment.replies.length > 0;
  const liked = Boolean(likedCommentIds[comment.id]);
  const pending = Boolean(pendingCommentLikes[comment.id]);

  return (
    <div className={cx("w-full", isReply && "pr-8")}>
      <div className="flex flex-row items-start gap-3">
        <Avatar comment={comment} />
        <div className="min-w-0 flex-1 text-right">
          <div className="flex flex-row items-center justify-start gap-2">
            <span className="font-peyda text-[13px] font-semibold leading-5 text-[#424242]">
              {comment.authorName}
            </span>
            <span className="font-peyda text-[12px] leading-5 text-[#9AA8BD]">
              {formatRelativeTime(comment.createdAt)}
            </span>
          </div>
          <p className="mt-1 break-words font-peyda text-[13px] font-medium leading-6 text-[#8FA0BC]">
            {comment.text}
          </p>
          <div className="mt-1 flex flex-row items-center gap-5 font-peyda text-[12px] font-semibold text-[#3D4C6E]">
            <button
              type="button"
              onClick={() => onReply(comment)}
              className="transition-colors hover:text-zinc-700"
            >
              پاسخ
            </button>
            <button
              type="button"
              onClick={() => onToggleLike(comment)}
              disabled={pending}
              className="inline-flex flex-row items-center gap-1 transition-colors hover:text-zinc-700 disabled:pointer-events-none disabled:opacity-50"
              aria-label={liked ? "لغو پسند دیدگاه" : "پسندیدن دیدگاه"}
              aria-pressed={liked}
            >
              {formatCount(comment.likesCount)}
              <Heart
                className={cx("size-4", liked && "fill-current")}
                strokeWidth={1.6}
                aria-hidden
              />
            </button>
          </div>
        </div>
      </div>

      {hasReplies ? (
        <div className="mt-3">
          <button
            type="button"
            onClick={() => setShowReplies((prev) => !prev)}
            className="mr-[54px] inline-flex items-center gap-2 font-peyda text-[12px] font-bold text-[#3D4C6E]"
          >
            <span className="h-px w-10 bg-[#424242]" aria-hidden />
            {showReplies ? "بستن پاسخ‌ها" : "مشاهده پاسخ‌ها"}
          </button>
          {showReplies ? (
            <div className="mt-4 flex flex-col gap-5">
              {comment.replies.map((reply) => (
                <CommentItem
                  key={reply.id}
                  comment={reply}
                  isReply
                  likedCommentIds={likedCommentIds}
                  pendingCommentLikes={pendingCommentLikes}
                  onReply={onReply}
                  onToggleLike={onToggleLike}
                />
              ))}
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

function MediaSlide({ media, active }: { media: PostDetailMedia; active: boolean }) {
  const isVideo = media.mime?.toLowerCase().startsWith("video");

  return (
    <div
      className={cx(
        "relative h-full w-full shrink-0",
        !active && "pointer-events-none",
      )}
      aria-hidden={!active}
    >
      {isVideo ? (
        <video
          src={media.url}
          className="h-full w-full object-cover"
          controls
          playsInline
          preload="metadata"
          draggable={false}
        />
      ) : (
        <BlurImage
          src={media.url}
          alt={media.alternativeText}
          fill
          sizes="(max-width: 1024px) 100vw, 560px"
          className="object-cover"
          priority={active}
          unoptimized={media.url.startsWith("data:")}
          draggable={false}
        />
      )}
    </div>
  );
}

function PostMediaCarousel({ media }: { media: PostDetailMedia[] }) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [dragOffset, setDragOffset] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const viewportRef = useRef<HTMLDivElement | null>(null);
  const dragStartX = useRef(0);
  const pointerId = useRef<number | null>(null);
  const activeMedia = media[Math.min(activeIndex, media.length - 1)];
  const hasMultiple = media.length > 1;
  const visualMedia = [...media].reverse();
  const visualIndex = media.length - 1 - activeIndex;

  const goTo = useCallback(
    (index: number) => {
      if (!hasMultiple) return;
      setActiveIndex((index + media.length) % media.length);
      setDragOffset(0);
    },
    [hasMultiple, media.length],
  );

  const goPrevious = useCallback(() => goTo(activeIndex - 1), [activeIndex, goTo]);
  const goNext = useCallback(() => goTo(activeIndex + 1), [activeIndex, goTo]);

  function startDrag(event: ReactPointerEvent<HTMLDivElement>) {
    if (!hasMultiple || (event.pointerType === "mouse" && event.button !== 0)) return;
    if (event.pointerType === "mouse") {
      event.preventDefault();
    }
    pointerId.current = event.pointerId;
    dragStartX.current = event.clientX;
    setIsDragging(true);
    setDragOffset(0);
    event.currentTarget.setPointerCapture(event.pointerId);
  }

  function moveDrag(event: ReactPointerEvent<HTMLDivElement>) {
    if (!isDragging || pointerId.current !== event.pointerId) return;
    setDragOffset(event.clientX - dragStartX.current);
  }

  function endDrag(event: ReactPointerEvent<HTMLDivElement>) {
    if (!isDragging || pointerId.current !== event.pointerId) return;

    const width = viewportRef.current?.clientWidth ?? 0;
    const threshold = Math.min(90, Math.max(48, width * 0.18));
    const offset = event.clientX - dragStartX.current;

    if (Math.abs(offset) >= threshold) {
      if (offset < 0) {
        goPrevious();
      } else {
        goNext();
      }
    }

    pointerId.current = null;
    setIsDragging(false);
    setDragOffset(0);
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  }

  if (!activeMedia) {
    return (
      <div className="flex aspect-[4/5] w-full items-center justify-center rounded-[28px] bg-white font-peyda text-sm text-zinc-400">
        تصویری برای این پست وجود ندارد.
      </div>
    );
  }

  return (
    <div className="relative w-full overflow-hidden rounded-[28px] bg-zinc-100 shadow-[0_12px_34px_rgba(61,76,110,0.08)]">
      <div
        ref={viewportRef}
        dir="ltr"
        className={cx(
          "relative aspect-[4/5] w-full touch-pan-y select-none overflow-hidden",
          hasMultiple && (isDragging ? "cursor-grabbing" : "cursor-grab"),
        )}
        onPointerDown={startDrag}
        onPointerMove={moveDrag}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
        onDragStart={(event) => event.preventDefault()}
      >
        <div
          className={cx("flex h-full w-full", !isDragging && "transition-transform duration-200 ease-out")}
          style={{ transform: `translateX(calc(${-visualIndex * 100}% + ${dragOffset}px))` }}
        >
          {visualMedia.map((item, index) => (
            <MediaSlide key={item.id} media={item} active={index === visualIndex} />
          ))}
        </div>
      </div>
      {hasMultiple ? (
        <>
          <button
            type="button"
            onClick={goNext}
            className="absolute left-4 top-1/2 z-10 inline-flex size-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/85 text-[#3D4C6E] shadow-[0_8px_24px_rgba(61,76,110,0.14)] backdrop-blur-md transition-colors hover:bg-white"
            aria-label="اسلاید بعدی"
          >
            <ChevronLeft className="size-5" strokeWidth={1.8} aria-hidden />
          </button>
          <button
            type="button"
            onClick={goPrevious}
            className="absolute right-4 top-1/2 z-10 inline-flex size-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/85 text-[#3D4C6E] shadow-[0_8px_24px_rgba(61,76,110,0.14)] backdrop-blur-md transition-colors hover:bg-white"
            aria-label="اسلاید قبلی"
          >
            <ChevronRight className="size-5" strokeWidth={1.8} aria-hidden />
          </button>
          <div className="absolute bottom-5 left-0 right-0 z-10 flex flex-row items-center justify-center gap-1.5">
            {media.map((item, index) => (
              <button
                key={item.id}
                type="button"
                onClick={() => goTo(index)}
                className={cx(
                  "size-2.5 rounded-full border border-white/80 shadow-sm transition-colors",
                  index === activeIndex ? "bg-[#3D4C6E]" : "bg-white",
                )}
                aria-label={`اسلاید ${numberFormat.format(index + 1)}`}
              />
            ))}
          </div>
        </>
      ) : null}
    </div>
  );
}

export function PostDetailView({ post, className }: { post: PostDetail; className?: string }) {
  const [isLiked, setIsLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(post.likesCount);
  const [commentCount, setCommentCount] = useState(post.commentsCount);
  const [comments, setComments] = useState<PostDetailComment[]>(post.comments);
  const [isLikePending, setIsLikePending] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [isSavePending, setIsSavePending] = useState(false);
  const [likedCommentIds, setLikedCommentIds] = useState<Readonly<Record<string, boolean>>>({});
  const [pendingCommentLikes, setPendingCommentLikes] = useState<Readonly<Record<string, boolean>>>({});
  const [heartBurstKey, setHeartBurstKey] = useState(0);
  const [saveAnimKey, setSaveAnimKey] = useState(0);
  const [comment, setComment] = useState("");
  const [replyTarget, setReplyTarget] = useState<PostDetailComment | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitHint, setSubmitHint] = useState<string | null>(null);
  const commentInputId = useId();
  const likeButtonRef = useRef<HTMLButtonElement | null>(null);
  const commentComposerRef = useRef<HTMLDivElement | null>(null);
  const commentInputRef = useRef<HTMLInputElement | null>(null);
  const previousIsLiked = useRef(isLiked);
  const previousIsSaved = useRef(isSaved);

  useEffect(() => {
    setLikeCount(post.likesCount);
    setCommentCount(post.commentsCount);
  }, [post.id, post.likesCount, post.commentsCount]);

  useEffect(() => {
    setComments(post.comments);
    setLikedCommentIds({});
    setPendingCommentLikes({});
    setReplyTarget(null);
  }, [post.id, post.comments]);

  useEffect(() => {
    setComment(readCommentDraft(post.id));
  }, [post.id]);

  useEffect(() => {
    saveCommentDraft(post.id, comment);
  }, [post.id, comment]);

  useEffect(() => {
    if (isLiked && !previousIsLiked.current) {
      const id = window.setTimeout(() => setHeartBurstKey((key) => key + 1), 0);
      previousIsLiked.current = isLiked;
      return () => window.clearTimeout(id);
    }
    previousIsLiked.current = isLiked;
  }, [isLiked]);

  useEffect(() => {
    if (isSaved !== previousIsSaved.current) {
      const id = window.setTimeout(() => setSaveAnimKey((key) => key + 1), 0);
      previousIsSaved.current = isSaved;
      return () => window.clearTimeout(id);
    }
    previousIsSaved.current = isSaved;
  }, [isSaved]);

  useEffect(() => {
    if (!hasAccessToken()) return;

    let cancelled = false;
    getLikedPostIds()
      .then((ids) => {
        if (!cancelled) setIsLiked(ids.has(post.id));
      })
      .catch(() => {
        if (!cancelled) setIsLiked(false);
      });

    return () => {
      cancelled = true;
    };
  }, [post.id]);

  useEffect(() => {
    if (!hasAccessToken()) {
      setIsSaved(false);
      return;
    }

    let cancelled = false;
    getBookmarkedPostIds()
      .then((ids) => {
        if (!cancelled) setIsSaved(ids.has(post.id));
      })
      .catch(() => {
        if (!cancelled) setIsSaved(false);
      });

    return () => {
      cancelled = true;
    };
  }, [post.id]);

  useEffect(() => {
    if (!hasAccessToken()) {
      setLikedCommentIds({});
      return;
    }

    let cancelled = false;
    getLikedPostCommentIds()
      .then((ids) => {
        if (cancelled) return;
        const next: Record<string, boolean> = {};
        ids.forEach((id) => {
          next[id] = true;
        });
        setLikedCommentIds(next);
      })
      .catch(() => {
        if (!cancelled) setLikedCommentIds({});
      });

    return () => {
      cancelled = true;
    };
  }, [post.id]);

  async function toggleLike() {
    if (isLikePending) return;

    if (!hasAccessToken()) {
      toast.error("برای پسندیدن پست ابتدا وارد حساب کاربری شوید.");
      return;
    }

    const wasLiked = isLiked;
    const nextLiked = !wasLiked;
    setIsLikePending(true);
    setIsLiked(nextLiked);
    setLikeCount((prev) => Math.max(0, prev + (nextLiked ? 1 : -1)));

    try {
      const result = await togglePostLike(post.id);
      setIsLiked(result.isLiked);
      if (result.isLiked !== nextLiked) {
        setLikeCount((prev) => Math.max(0, prev + (result.isLiked ? 1 : -1)));
      }
    } catch (error: unknown) {
      setIsLiked(wasLiked);
      setLikeCount((prev) => Math.max(0, prev + (nextLiked ? -1 : 1)));
      const button = likeButtonRef.current;
      if (button) {
        button.classList.remove("animate-shake");
        void button.offsetHeight;
        button.classList.add("animate-shake");
        window.setTimeout(() => button.classList.remove("animate-shake"), 400);
      }
      toast.error(getUserFacingErrorMessage(error, "پسندیدن پست ناموفق بود."));
    } finally {
      setIsLikePending(false);
    }
  }

  async function toggleSaved() {
    if (isSavePending) return;

    if (!hasAccessToken()) {
      toast.error("برای ذخیره پست ابتدا وارد حساب کاربری شوید.");
      return;
    }

    const wasSaved = isSaved;
    const nextSaved = !wasSaved;
    setIsSavePending(true);
    setIsSaved(nextSaved);

    try {
      const result = await togglePostBookmark(post.id);
      setIsSaved(result.isBookmarked);
    } catch (error: unknown) {
      setIsSaved(wasSaved);
      toast.error(getUserFacingErrorMessage(error, "ذخیره پست ناموفق بود."));
    } finally {
      setIsSavePending(false);
    }
  }

  async function toggleCommentLike(target: PostDetailComment) {
    if (pendingCommentLikes[target.id]) return;

    if (!hasAccessToken()) {
      toast.error("برای پسندیدن دیدگاه ابتدا وارد حساب کاربری شوید.");
      return;
    }

    const wasLiked = Boolean(likedCommentIds[target.id]);
    const nextLiked = !wasLiked;
    setPendingCommentLikes((prev) => ({ ...prev, [target.id]: true }));
    setLikedCommentIds((prev) => ({ ...prev, [target.id]: nextLiked }));
    setComments((prev) =>
      updateCommentById(prev, target.id, (item) => ({
        ...item,
        likesCount: Math.max(0, item.likesCount + (nextLiked ? 1 : -1)),
      })),
    );

    try {
      const result = await togglePostCommentLike(target.id);
      setLikedCommentIds((prev) => ({ ...prev, [target.id]: result.isLiked }));
      if (result.isLiked !== nextLiked) {
        setComments((prev) =>
          updateCommentById(prev, target.id, (item) => ({
            ...item,
            likesCount: Math.max(0, item.likesCount + (result.isLiked ? 1 : -1)),
          })),
        );
      }
    } catch (error: unknown) {
      setLikedCommentIds((prev) => ({ ...prev, [target.id]: wasLiked }));
      setComments((prev) =>
        updateCommentById(prev, target.id, (item) => ({
          ...item,
          likesCount: Math.max(0, item.likesCount + (nextLiked ? -1 : 1)),
        })),
      );
      toast.error(getUserFacingErrorMessage(error, "پسندیدن دیدگاه ناموفق بود."));
    } finally {
      setPendingCommentLikes((prev) => ({ ...prev, [target.id]: false }));
    }
  }

  function startReply(target: PostDetailComment) {
    setReplyTarget(target);
    setSubmitHint(null);
    window.setTimeout(() => commentInputRef.current?.focus(), 0);
  }

  function focusCommentComposer() {
    setSubmitHint(null);
    commentInputRef.current?.focus();
    commentComposerRef.current?.scrollIntoView({ block: "center", behavior: "smooth" });
    window.setTimeout(() => commentInputRef.current?.focus(), 160);
  }

  async function submitComment() {
    const value = comment.trim();
    if (!value || isSubmitting) return;
    if (typeof window !== "undefined" && !window.localStorage.getItem("accessToken")) {
      setSubmitHint("برای ثبت دیدگاه ابتدا وارد حساب کاربری شوید.");
      return;
    }

    setIsSubmitting(true);
    setSubmitHint(null);
    try {
      const createdComment = await createPostComment({
        postId: post.id,
        content: value,
        parentCommentId: replyTarget?.id,
      });
      setComment("");
      clearCommentDraft(post.id);
      setReplyTarget(null);
      if (createdComment.status === "Approved") {
        const visibleComment: PostDetailComment = {
          id: createdComment.id,
          authorName: createdComment.isInfinity ? "اینفینیتی" : "",
          authorAvatarUrl: null,
          isOfficialAuthor: createdComment.isInfinity,
          createdAt: createdComment.date,
          text: createdComment.content,
          likesCount: 0,
          replies: [],
        };

        setComments((prev) =>
          createdComment.parentCommentId
            ? insertReplyById(prev, createdComment.parentCommentId, visibleComment)
            : [visibleComment, ...prev],
        );
        setCommentCount((prev) => prev + 1);
        setSubmitHint(null);
        toast.success(replyTarget ? "پاسخ ثبت شد." : "دیدگاه ثبت شد.");
      } else {
        setSubmitHint("دیدگاه شما بعد از تایید نمایش داده می‌شود.");
        toast.success(replyTarget ? "پاسخ ثبت شد و در انتظار تایید است." : "دیدگاه ثبت شد و در انتظار تایید است.");
      }
    } catch (error: unknown) {
      const message = getUserFacingErrorMessage(error, "ثبت دیدگاه ناموفق بود.");
      setSubmitHint(message);
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <article
      className={cx(
        "w-full min-w-0 rounded-[32px] bg-white px-3 pb-2 pt-2 shadow-[0_18px_45px_rgba(61,76,110,0.06)] sm:px-5 lg:px-2",
        className,
      )}
      dir="rtl"
    >
      <PostMediaCarousel media={post.media} />

      <div dir="ltr" className="mt-3 flex items-center justify-between px-1">
        <button
          type="button"
          onClick={() => void toggleSaved()}
          disabled={isSavePending}
          className="pressable inline-flex size-10 items-center justify-center rounded-xl text-[#94A3B8] transition-colors hover:text-zinc-700 disabled:pointer-events-none disabled:opacity-60"
          aria-label={isSaved ? "حذف از ذخیره‌ها" : "ذخیره پست"}
          aria-pressed={isSaved}
        >
          <span key={saveAnimKey} className={cx("inline-flex", saveAnimKey > 0 && "animate-pop")}>
            <Bookmark className={cx("size-6", isSaved && "fill-current")} strokeWidth={1.5} aria-hidden />
          </span>
        </button>

        <div className="flex flex-row items-center gap-4 font-peyda text-[18px] font-semibold text-[#424242]">
          <span className="inline-flex flex-row items-center gap-1.5">
            {formatCount(commentCount)}
            <MessageCircle className="size-7 text-[#94A3B8]" strokeWidth={1.5} aria-hidden />
          </span>
          <button
            ref={likeButtonRef}
            type="button"
            onClick={() => void toggleLike()}
            disabled={isLikePending}
            className="pressable inline-flex flex-row items-center gap-1.5 rounded-xl transition-colors hover:text-zinc-700 disabled:pointer-events-none disabled:opacity-60"
            aria-label={isLiked ? "لغو پسند" : "پسندیدن"}
            aria-pressed={isLiked}
          >
            <span key={`likes-${likeCount}`} className="animate-fade-up tabular-nums">
              {formatCount(likeCount)}
            </span>
            <span
              key={`heart-${heartBurstKey}`}
              className={cx("heart-burst-target inline-flex", heartBurstKey > 0 && "animate-heart-burst")}
            >
              <Heart
                className={cx("size-7", heartBurstKey > 0 && "animate-pop")}
                strokeWidth={1.5}
                fill={isLiked ? "#D52953" : "none"}
                stroke={isLiked ? "#BA1B42" : "#94A3B8"}
                aria-hidden
              />
            </span>
          </button>
        </div>
      </div>

      <div className="mt-2 text-right">
        <p className="font-peyda text-[19px] font-bold leading-8 text-[#424242]">{post.title}</p>
        {post.caption ? (
          <p className="mt-1 line-clamp-2 font-peyda text-[13px] font-medium leading-6 text-[#3D4C6E]">
            {post.caption}
          </p>
        ) : null}
        {post.productLink ? (
          <div className="mt-3">
            <Button
              variant="gray"
              onClick={() => {
                window.location.href = post.productLink;
              }}
            >
              لینک خرید
            </Button>
          </div>
        ) : null}
      </div>

      <div dir="ltr" className="mt-8 flex flex-row items-center justify-between gap-3">
        <label
          htmlFor={commentInputId}
          role="button"
          tabIndex={0}
          onClick={focusCommentComposer}
          onKeyDown={(event) => {
            if (event.key !== "Enter" && event.key !== " ") return;
            event.preventDefault();
            focusCommentComposer();
          }}
          className="pressable inline-flex h-11 shrink-0 cursor-pointer flex-row items-center gap-2 rounded-full bg-[#F7F8FF] px-4 font-peyda text-sm font-medium text-[#7B8498] shadow-[0_5px_18px_rgba(61,76,110,0.05)] transition-colors hover:text-[#3D4C6E] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-400/70"
        >
          ارسال دیدگاه
          <SendHorizonal className="size-5" strokeWidth={1.5} aria-hidden />
        </label>
        <div dir="rtl" className="min-w-0 flex-1 text-right">
          <h2 className="font-peyda text-[22px] font-bold leading-8 text-[#424242]">
            {formatCount(commentCount)} دیدگاه
          </h2>
          <p className="font-peyda text-[12px] font-medium leading-6 text-[#9AA8BD]">
            شما هم توی این بحث شرکت کنید
          </p>
        </div>
      </div>

      <div className="mt-6 border-t border-[#E5EAF2] pt-6">
        {comments.length === 0 ? (
          <EmptyState
            icon={MessageSquareText}
            title="هنوز دیدگاهی ثبت نشده است"
            description="اولین دیدگاه این پست را شما ثبت کنید."
            className="py-8"
          />
        ) : (
          <div className="flex flex-col gap-6">
            {comments.map((item) => (
              <CommentItem
                key={item.id}
                comment={item}
                likedCommentIds={likedCommentIds}
                pendingCommentLikes={pendingCommentLikes}
                onReply={startReply}
                onToggleLike={(target) => void toggleCommentLike(target)}
              />
            ))}
          </div>
        )}
      </div>

      <div
        ref={commentComposerRef}
        className="sticky bottom-3 mt-7 rounded-full bg-white/85 p-1 shadow-[0_10px_30px_rgba(61,76,110,0.08)] backdrop-blur-md"
      >
        {replyTarget ? (
          <div className="mb-2 flex items-center justify-between rounded-2xl bg-[#F7F8FF] px-4 py-2 font-peyda text-xs text-[#3D4C6E]">
            <button
              type="button"
              onClick={() => setReplyTarget(null)}
              className="font-semibold text-[#7B8498] transition-colors hover:text-zinc-700"
            >
              لغو
            </button>
            <span className="min-w-0 truncate">پاسخ به {replyTarget.authorName}</span>
          </div>
        ) : null}
        <div className="flex h-12 flex-row items-center gap-2 rounded-full bg-[#F9FAFF] px-2">
          <button
            type="button"
            onClick={submitComment}
            disabled={!comment.trim() || isSubmitting}
            className="pressable inline-flex size-10 shrink-0 items-center justify-center rounded-full bg-white text-[#3D4C6E] shadow-sm transition-opacity focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-400/70 disabled:pointer-events-none disabled:opacity-40"
            aria-label="ارسال نظر"
          >
            <SendHorizonal className="size-5" strokeWidth={1.6} aria-hidden />
          </button>
          <input
            id={commentInputId}
            ref={commentInputRef}
            value={comment}
            onChange={(event) => setComment(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                void submitComment();
              }
            }}
            placeholder={replyTarget ? "پاسخ شما" : "نظر شما"}
            className="h-full min-w-0 flex-1 bg-transparent px-2 text-right font-peyda text-sm font-medium text-[#424242] placeholder:text-[#A3AFC2] focus:outline-none"
            maxLength={2000}
          />
        </div>
        {submitHint ? (
          <p className="px-4 pt-2 text-right font-peyda text-xs text-[#7B8498]" role="status">
            {submitHint}
          </p>
        ) : null}
      </div>
    </article>
  );
}
