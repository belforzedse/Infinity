"use client";

import Image from "next/image";
import { useMemo, useState } from "react";
import { Bookmark, Heart, MessageCircle, SendHorizonal } from "lucide-react";
import toast from "react-hot-toast";
import type { PostDetail, PostDetailComment, PostDetailMedia } from "@/services/post-detail.service";
import { createPostComment } from "@/services/post-comment.service";
import { getUserFacingErrorMessage } from "@/utils/userErrorMessage";

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
  if (comment.authorAvatarUrl) {
    return (
      <Image
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

function CommentItem({ comment, isReply = false }: { comment: PostDetailComment; isReply?: boolean }) {
  const [showReplies, setShowReplies] = useState(false);
  const hasReplies = comment.replies.length > 0;

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
            <button type="button" className="transition-colors hover:text-zinc-700">
              پاسخ
            </button>
            <span className="inline-flex flex-row items-center gap-1">
              {formatCount(comment.likesCount)}
              <Heart className="size-4" strokeWidth={1.6} aria-hidden />
            </span>
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
                <CommentItem key={reply.id} comment={reply} isReply />
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
        "absolute inset-0 transition-opacity duration-200",
        active ? "opacity-100" : "pointer-events-none opacity-0",
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
        />
      ) : (
        <Image
          src={media.url}
          alt={media.alternativeText}
          fill
          sizes="(max-width: 1024px) 100vw, 560px"
          className="object-cover"
          priority={active}
          unoptimized={media.url.startsWith("data:")}
        />
      )}
    </div>
  );
}

function PostMediaCarousel({ media }: { media: PostDetailMedia[] }) {
  const [activeIndex, setActiveIndex] = useState(0);
  const activeMedia = media[Math.min(activeIndex, media.length - 1)];

  if (!activeMedia) {
    return (
      <div className="flex aspect-[4/5] w-full items-center justify-center rounded-[28px] bg-white font-peyda text-sm text-zinc-400">
        تصویری برای این پست وجود ندارد.
      </div>
    );
  }

  return (
    <div className="relative w-full overflow-hidden rounded-[28px] bg-zinc-100 shadow-[0_12px_34px_rgba(61,76,110,0.08)]">
      <div className="relative aspect-[4/5] w-full">
        {media.map((item, index) => (
          <MediaSlide key={item.id} media={item} active={index === activeIndex} />
        ))}
      </div>
      {media.length > 1 ? (
        <div className="absolute bottom-5 left-0 right-0 z-10 flex flex-row items-center justify-center gap-1.5">
          {media.map((item, index) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setActiveIndex(index)}
              className={cx(
                "size-2.5 rounded-full border border-white/80 shadow-sm transition-colors",
                index === activeIndex ? "bg-[#3D4C6E]" : "bg-white",
              )}
              aria-label={`اسلاید ${numberFormat.format(index + 1)}`}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}

export function PostDetailView({ post, className }: { post: PostDetail; className?: string }) {
  const [isLiked, setIsLiked] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [comment, setComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitHint, setSubmitHint] = useState<string | null>(null);

  const likeCount = useMemo(() => post.likesCount + (isLiked ? 1 : 0), [isLiked, post.likesCount]);

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
      await createPostComment({ postId: post.id, content: value });
      setComment("");
      setSubmitHint("دیدگاه شما بعد از تایید نمایش داده می‌شود.");
      toast.success("دیدگاه ثبت شد و در انتظار تایید است.");
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
        "w-full min-w-0 rounded-[32px] bg-white px-4 pb-8 pt-4 shadow-[0_18px_45px_rgba(61,76,110,0.06)] sm:px-5 lg:px-6",
        className,
      )}
      dir="rtl"
    >
      <PostMediaCarousel media={post.media} />

      <div dir="ltr" className="mt-3 flex items-center justify-between px-1">
        <button
          type="button"
          onClick={() => setIsSaved((prev) => !prev)}
          className="inline-flex size-10 items-center justify-center rounded-xl text-[#94A3B8] transition-colors hover:text-zinc-700"
          aria-label={isSaved ? "حذف از ذخیره‌ها" : "ذخیره پست"}
          aria-pressed={isSaved}
        >
          <Bookmark className={cx("size-6", isSaved && "fill-current")} strokeWidth={1.5} aria-hidden />
        </button>

        <div className="flex flex-row items-center gap-4 font-peyda text-[18px] font-semibold text-[#424242]">
          <span className="inline-flex flex-row items-center gap-1.5">
            {formatCount(post.commentsCount)}
            <MessageCircle className="size-7 text-[#94A3B8]" strokeWidth={1.5} aria-hidden />
          </span>
          <button
            type="button"
            onClick={() => setIsLiked((prev) => !prev)}
            className="inline-flex flex-row items-center gap-1.5 rounded-xl transition-colors hover:text-zinc-700"
            aria-label={isLiked ? "لغو پسند" : "پسندیدن"}
            aria-pressed={isLiked}
          >
            {formatCount(likeCount)}
            <Heart
              className="size-7"
              strokeWidth={1.5}
              fill={isLiked ? "#D52953" : "#D52953"}
              stroke={isLiked ? "#BA1B42" : "#D52953"}
              aria-hidden
            />
          </button>
        </div>
      </div>

      <div className="mt-2 text-right">
        <h1 className="font-peyda text-[19px] font-bold leading-8 text-[#424242]">{post.title}</h1>
        {post.caption ? (
          <p className="mt-1 line-clamp-2 font-peyda text-[13px] font-medium leading-6 text-[#3D4C6E]">
            {post.caption}
          </p>
        ) : null}
      </div>

      <div className="mt-8 flex flex-row items-center justify-between gap-3">
        <button
          type="button"
          className="inline-flex h-11 shrink-0 flex-row items-center gap-2 rounded-full bg-[#F7F8FF] px-4 font-peyda text-sm font-medium text-[#7B8498] shadow-[0_5px_18px_rgba(61,76,110,0.05)]"
        >
          ارسال دیدگاه
          <SendHorizonal className="size-5" strokeWidth={1.5} aria-hidden />
        </button>
        <div className="min-w-0 flex-1 text-right">
          <h2 className="font-peyda text-[22px] font-bold leading-8 text-[#424242]">
            {formatCount(post.commentsCount)} دیدگاه
          </h2>
          <p className="font-peyda text-[12px] font-medium leading-6 text-[#9AA8BD]">
            شما هم توی این بحث شرکت کنید
          </p>
        </div>
      </div>

      <div className="mt-6 border-t border-[#E5EAF2] pt-6">
        {post.comments.length === 0 ? (
          <p className="py-8 text-center font-peyda text-sm text-[#9AA8BD]" role="status">
            هنوز دیدگاهی ثبت نشده است.
          </p>
        ) : (
          <div className="flex flex-col gap-6">
            {post.comments.map((item) => (
              <CommentItem key={item.id} comment={item} />
            ))}
          </div>
        )}
      </div>

      <div className="sticky bottom-3 mt-7 rounded-full bg-white/85 p-1 shadow-[0_10px_30px_rgba(61,76,110,0.08)] backdrop-blur-md">
        <div className="flex h-12 flex-row items-center gap-2 rounded-full bg-[#F9FAFF] px-2">
          <button
            type="button"
            onClick={submitComment}
            disabled={!comment.trim() || isSubmitting}
            className="inline-flex size-10 shrink-0 items-center justify-center rounded-full bg-white text-[#3D4C6E] shadow-sm transition-opacity disabled:opacity-40"
            aria-label="ارسال نظر"
          >
            <SendHorizonal className="size-5" strokeWidth={1.6} aria-hidden />
          </button>
          <input
            value={comment}
            onChange={(event) => setComment(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                void submitComment();
              }
            }}
            placeholder="نظر شما"
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
