"use client";

import type { ReactNode } from "react";
import Image from "next/image";
import { Bookmark, Heart, MessageCircle } from "lucide-react";
import clsx from "clsx";
import { POST_CARD_LAYOUTS, fluidMaxWidthCapPx, type PostCardVariant } from "@/components/posts/post-card-variants";

export type { PostCardVariant, DesktopPostCardVariant } from "@/components/posts/post-card-variants";
export {
  POST_CARD_LAYOUTS,
  POST_CARD_FLUID_MAX_EXTRA_PX,
  fluidMaxWidthCapPx,
  toMobilePostCardVariant,
} from "@/components/posts/post-card-variants";

export type PostCardWidthMode = "fixed" | "fluid";

export type PostCardProps = {
  variant: PostCardVariant;
  imageSrc: string;
  imageAlt?: string;
  likesCount?: string | number;
  commentsCount?: string | number;
  isLiked?: boolean;
  isSaved?: boolean;
  onLike?: () => void;
  onComment?: () => void;
  onSave?: () => void;
  /** Top-left badge inside the image (video / gallery / brand mark). */
  overlay?: ReactNode;
  className?: string;
  /**
   * `fixed` — design pixel width/height (default).
   * `fluid` — `width: 100%` capped at design width; image keeps aspect ratio (grids / narrow viewports).
   */
  widthMode?: PostCardWidthMode;
  /**
   * When `widthMode="fluid"`, caps the card column width. Defaults to **design width + 10px** (`fluidMaxWidthCapPx`).
   * Use `"none"` only for rare full-bleed layouts (uncapped width).
   */
  fluidMaxWidth?: number | "none";
};

const ACTION_TEXT_CLASS =
  "font-peyda text-[10px] font-medium leading-[21px] text-[#424242] tabular-nums";

const ICON_SECONDARY = "#94A3B8";
const HEART_FILL = "#D52953";
const HEART_STROKE = "#BA1B42";

function formatCountLabel(value: string | number | undefined): string | null {
  if (value === undefined || value === "") return null;
  return typeof value === "number" ? String(value) : value;
}

/**
 * Feed / grid post card — design sizes from `POST_CARD_LAYOUTS`; optional `widthMode="fluid"` for grids.
 * Action row is `dir="ltr"` so bookmark stays visually left and metrics stay visually right on RTL pages.
 */
export function PostCard({
  variant,
  imageSrc,
  imageAlt = "",
  likesCount,
  commentsCount,
  isLiked = false,
  isSaved = false,
  onLike,
  onComment,
  onSave,
  overlay,
  className,
  widthMode = "fixed",
  fluidMaxWidth,
}: PostCardProps) {
  const layout = POST_CARD_LAYOUTS[variant];
  const { widthPx, imageHeightPx, columnGapPx } = layout;
  const isFluid = widthMode === "fluid";
  const fluidMaxPx = isFluid
    ? fluidMaxWidth === "none"
      ? null
      : typeof fluidMaxWidth === "number"
        ? fluidMaxWidth
        : fluidMaxWidthCapPx(variant)
    : null;

  const likesLabel = formatCountLabel(likesCount);
  const commentsLabel = formatCountLabel(commentsCount);

  const articleStyle = isFluid
    ? ({
        width: "100%",
        ...(fluidMaxPx != null ? { maxWidth: fluidMaxPx } : {}),
        gap: columnGapPx,
      } as const)
    : ({ width: widthPx, gap: columnGapPx } as const);

  const mediaStyle = isFluid
    ? ({
        width: "100%",
        aspectRatio: `${widthPx} / ${imageHeightPx}`,
      } as const)
    : ({ width: widthPx, height: imageHeightPx } as const);

  const imageSizes = isFluid
    ? fluidMaxPx == null
      ? `(max-width: 1024px) 100vw, ${widthPx}px`
      : `(max-width: 640px) 48vw, (max-width: 1024px) 33vw, ${widthPx}px`
    : `${widthPx}px`;

  return (
    <article
      className={clsx(
        "group flex flex-col items-stretch",
        isFluid ? "w-full min-w-0 shrink" : "shrink-0",
        className,
      )}
      style={articleStyle}
      data-variant={variant}
    >
      <div
        className="relative isolate overflow-hidden rounded-[20px] bg-zinc-100"
        style={mediaStyle}
      >
        <Image
          src={imageSrc}
          alt={imageAlt}
          fill
          sizes={imageSizes}
          className="object-cover"
          unoptimized={imageSrc.startsWith("data:")}
        />
        {/* Hover / keyboard focus within card: Figma `Variant2` darkening — opacity only (no layout shift). */}
        <div
          className="pointer-events-none absolute inset-0 rounded-[20px] bg-black/20 opacity-0 transition-opacity duration-200 group-hover:opacity-100 group-focus-within:opacity-100"
          aria-hidden
        />

        {overlay != null ? (
          <div className="pointer-events-none absolute left-3 top-2 z-10">{overlay}</div>
        ) : null}
      </div>

      <div
        dir="ltr"
        className="flex w-full flex-row items-center justify-between px-1"
        aria-label="اقدامات پست"
      >
        <button
          type="button"
          onClick={onSave}
          className={clsx(
            "inline-flex size-9 shrink-0 items-center justify-center rounded-lg text-[#94A3B8] outline-none transition-colors",
            "hover:text-zinc-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-400/70",
            "disabled:pointer-events-none disabled:opacity-40",
          )}
          aria-label={isSaved ? "حذف از ذخیره‌ها" : "ذخیره پست"}
          aria-pressed={isSaved}
          disabled={!onSave}
        >
          <Bookmark
            size={20}
            strokeWidth={1.5}
            className={clsx(isSaved && "fill-current")}
            aria-hidden
          />
        </button>

        <div className="flex flex-row items-center gap-[11px]">
          <button
            type="button"
            onClick={onComment}
            className={clsx(
              "inline-flex h-9 shrink-0 flex-row items-center gap-1 rounded-lg px-1 text-[#94A3B8] outline-none transition-colors",
              "hover:text-zinc-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-400/70",
              "disabled:pointer-events-none disabled:opacity-40",
            )}
            aria-label="نظرات"
            disabled={!onComment}
          >
            {commentsLabel != null ? (
              <span className={clsx(ACTION_TEXT_CLASS, "order-1")}>{commentsLabel}</span>
            ) : null}
            <MessageCircle size={20} strokeWidth={1.5} className="order-2 shrink-0" aria-hidden />
          </button>

          <button
            type="button"
            onClick={onLike}
            className={clsx(
              "inline-flex h-9 shrink-0 flex-row items-center gap-1 rounded-lg px-1 outline-none transition-colors",
              "hover:text-zinc-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-400/70",
              "disabled:pointer-events-none disabled:opacity-40",
            )}
            style={
              isLiked
                ? { color: HEART_FILL }
                : { color: ICON_SECONDARY }
            }
            aria-label={isLiked ? "لغو پسند" : "پسندیدن"}
            aria-pressed={isLiked}
            disabled={!onLike}
          >
            {likesLabel != null ? (
              <span className={clsx(ACTION_TEXT_CLASS, "order-1")}>{likesLabel}</span>
            ) : null}
            <Heart
              size={20}
              strokeWidth={1.5}
              className="order-2 shrink-0"
              fill={isLiked ? HEART_FILL : "none"}
              stroke={isLiked ? HEART_STROKE : ICON_SECONDARY}
              aria-hidden
            />
          </button>
        </div>
      </div>
    </article>
  );
}
