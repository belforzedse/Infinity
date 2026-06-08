"use client";

import {
  type CSSProperties,
  type ReactNode,
  useEffect,
  useRef,
  useState,
} from "react";
import Image from "next/image";
import Link from "next/link";
import { Bookmark, Heart, Layers2, MessageCircle, Video } from "lucide-react";
import clsx from "clsx";
import {
  fluidMaxWidthCapPx,
  POST_CARD_LAYOUTS,
  type PostCardVariant,
  type SocialFeedCardOverlay,
  type SocialFeedMedia,
} from "./index";

export type { PostCardVariant, DesktopPostCardVariant } from "./index";
export {
  POST_CARD_LAYOUTS,
  POST_CARD_FLUID_MAX_EXTRA_PX,
  fluidMaxWidthCapPx,
  toMobilePostCardVariant,
} from "./index";

export type SocialPostCardWidthMode = "fixed" | "fluid";
export type SocialPostCardActionTone = "default" | "light";

export type SocialPostCardProps = {
  variant: PostCardVariant;
  imageSrc: string;
  imageAlt?: string;
  previewMedia?: SocialFeedMedia;
  likesCount?: string | number;
  commentsCount?: string | number;
  isLiked?: boolean;
  isSaved?: boolean;
  onLike?: () => void;
  onComment?: () => void;
  onSave?: () => void;
  href?: string;
  linkTarget?: string;
  linkRel?: string;
  overlay?: ReactNode;
  className?: string;
  widthMode?: SocialPostCardWidthMode;
  fluidMaxWidth?: number | "none";
  shakeKey?: number;
  mediaClassName?: string;
  linkAriaLabel?: string;
  actionTone?: SocialPostCardActionTone;
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

function isVideoMedia(media?: SocialFeedMedia): boolean {
  return media?.mime?.toLowerCase().startsWith("video") ?? false;
}

function CardImage({
  src,
  alt,
  sizes,
  className,
  unoptimized,
}: {
  src: string;
  alt: string;
  sizes: string;
  className?: string;
  unoptimized?: boolean;
}) {
  const [loaded, setLoaded] = useState(false);
  return (
    <Image
      src={src}
      alt={alt}
      fill
      sizes={sizes}
      loading="lazy"
      className={clsx("img-fx object-cover", loaded && "img-loaded", className)}
      unoptimized={unoptimized}
      onLoad={() => setLoaded(true)}
    />
  );
}

export function SocialPostOverlayBadge({
  type,
}: {
  type: Exclude<SocialFeedCardOverlay, null>;
}) {
  const shell =
    "inline-flex items-center justify-center rounded-lg bg-black/[0.14] p-0.5 shadow-sm backdrop-blur-[7px]";

  if (type === "infinity") {
    return (
      <div className={shell} aria-hidden>
        <span className="inline-flex size-5 items-center justify-center rounded-full bg-infinity-primary shadow-[0_0_2px_rgba(0,0,0,0.09)]">
          <img
            src="/Infinity.svg"
            alt=""
            width={15}
            height={15}
            className="block"
          />
        </span>
      </div>
    );
  }

  if (type === "video") {
    return (
      <div className={shell} aria-hidden>
        <span className="flex size-6 items-center justify-center text-white">
          <Video
            className="size-[13px] stroke-white text-white"
            strokeWidth={1.5}
          />
        </span>
      </div>
    );
  }

  return (
    <div className={shell} aria-hidden>
      <span className="flex size-6 items-center justify-center text-white">
        <Layers2
          className="size-[13px] stroke-white text-white"
          strokeWidth={1.5}
        />
      </span>
    </div>
  );
}

export function SocialPostCard({
  variant,
  imageSrc,
  imageAlt = "",
  previewMedia,
  likesCount,
  commentsCount,
  isLiked = false,
  isSaved = false,
  onLike,
  onComment,
  onSave,
  href,
  linkTarget,
  linkRel,
  overlay,
  className,
  widthMode = "fixed",
  fluidMaxWidth,
  shakeKey,
  mediaClassName,
  linkAriaLabel,
  actionTone = "default",
}: SocialPostCardProps) {
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

  const activeMedia = previewMedia ?? {
    id: "cover",
    url: imageSrc,
    alternativeText: imageAlt,
    mime: "image/*",
  };
  const likesLabel = formatCountLabel(likesCount);
  const commentsLabel = formatCountLabel(commentsCount);
  const isLightActionTone = actionTone === "light";
  const actionTextClass = clsx(
    ACTION_TEXT_CLASS,
    isLightActionTone && "text-white/85",
  );
  const secondaryIconColor = isLightActionTone
    ? "rgba(255,255,255,0.85)"
    : ICON_SECONDARY;
  const secondaryIconHoverClass = isLightActionTone
    ? "hover:text-white"
    : "hover:text-zinc-700";

  const [heartBurstKey, setHeartBurstKey] = useState(0);
  const prevIsLiked = useRef(isLiked);
  useEffect(() => {
    if (isLiked && !prevIsLiked.current) {
      const id = window.setTimeout(() => setHeartBurstKey((key) => key + 1), 0);
      prevIsLiked.current = isLiked;
      return () => window.clearTimeout(id);
    }
    prevIsLiked.current = isLiked;
  }, [isLiked]);

  const [saveAnimKey, setSaveAnimKey] = useState(0);
  const prevIsSaved = useRef(isSaved);
  useEffect(() => {
    if (isSaved !== prevIsSaved.current) {
      const id = window.setTimeout(() => setSaveAnimKey((key) => key + 1), 0);
      prevIsSaved.current = isSaved;
      return () => window.clearTimeout(id);
    }
    prevIsSaved.current = isSaved;
  }, [isSaved]);

  const likeButtonRef = useRef<HTMLButtonElement>(null);
  const prevShakeKey = useRef(shakeKey ?? 0);
  useEffect(() => {
    if ((shakeKey ?? 0) === 0 || shakeKey === prevShakeKey.current) return;
    prevShakeKey.current = shakeKey ?? 0;
    const el = likeButtonRef.current;
    if (!el) return;
    el.classList.remove("animate-shake");
    void el.offsetHeight;
    el.classList.add("animate-shake");
    const id = window.setTimeout(
      () => el.classList.remove("animate-shake"),
      400,
    );
    return () => window.clearTimeout(id);
  }, [shakeKey]);

  const articleStyle = isFluid
    ? ({
        width: "100%",
        ...(fluidMaxPx != null ? { maxWidth: fluidMaxPx } : {}),
        gap: columnGapPx,
      } as const)
    : ({ width: widthPx, gap: columnGapPx } as const);

  const mediaStyle = isFluid
    ? ({ width: "100%", aspectRatio: `${widthPx} / ${imageHeightPx}` } as const)
    : ({ width: widthPx, height: imageHeightPx } as const);

  const imageSizes = isFluid
    ? fluidMaxPx == null
      ? "(max-width: 1024px) 100vw, 383px"
      : "(max-width: 640px) 48vw, (max-width: 1024px) 33vw, 383px"
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
        className={clsx(
          "relative isolate overflow-hidden rounded-[20px] bg-zinc-100",
          mediaClassName,
        )}
        style={mediaStyle}
      >
        {href ? (
          <Link
            href={href}
            target={linkTarget}
            rel={linkRel}
            className="absolute inset-0 z-[1] rounded-[20px] outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-400/70"
            aria-label={
              linkAriaLabel ??
              (imageAlt ? `مشاهده پست ${imageAlt}` : "مشاهده پست")
            }
          />
        ) : null}
        {isVideoMedia(activeMedia) ? (
          <video
            src={activeMedia.url}
            className="h-full w-full object-cover"
            muted
            playsInline
            preload="metadata"
            aria-label={activeMedia.alternativeText || imageAlt || "ویدیوی پست"}
          />
        ) : (
          <CardImage
            src={activeMedia.url || imageSrc}
            alt={activeMedia.alternativeText || imageAlt}
            sizes={imageSizes}
            unoptimized={(activeMedia.url || imageSrc).startsWith("data:")}
          />
        )}
        <div
          className="pointer-events-none absolute inset-0 rounded-[20px] bg-black/20 opacity-0 transition-opacity duration-200 group-hover:opacity-100 group-focus-within:opacity-100"
          aria-hidden
        />
        {overlay != null ? (
          <div className="pointer-events-none absolute left-3 top-2 z-10">
            {overlay}
          </div>
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
            "pressable inline-flex size-9 shrink-0 items-center justify-center rounded-lg outline-none transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-400/70 disabled:pointer-events-none disabled:opacity-40",
            secondaryIconHoverClass,
          )}
          style={{ color: secondaryIconColor }}
          aria-label={isSaved ? "حذف از ذخیره‌ها" : "ذخیره پست"}
          aria-pressed={isSaved}
          disabled={!onSave}
        >
          <span
            key={saveAnimKey}
            className={clsx(
              "inline-flex shrink-0",
              saveAnimKey > 0 && "animate-pop",
            )}
          >
            <Bookmark
              size={20}
              strokeWidth={1.5}
              className={clsx(isSaved && "fill-current")}
              aria-hidden
            />
          </span>
        </button>

        <div className="flex flex-row items-center gap-[11px]">
          <button
            type="button"
            onClick={onComment}
            className={clsx(
              "pressable inline-flex h-9 shrink-0 flex-row items-center gap-1 rounded-lg px-1 outline-none transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-400/70 disabled:pointer-events-none disabled:opacity-40",
              secondaryIconHoverClass,
            )}
            style={{ color: secondaryIconColor }}
            aria-label="نظرات"
            disabled={!onComment}
          >
            {commentsLabel != null ? (
              <span className={clsx(actionTextClass, "order-1")}>
                {commentsLabel}
              </span>
            ) : null}
            <MessageCircle
              size={20}
              strokeWidth={1.5}
              className="order-2 shrink-0"
              aria-hidden
            />
          </button>

          <button
            ref={likeButtonRef}
            type="button"
            onClick={onLike}
            className={clsx(
              "pressable inline-flex h-9 shrink-0 flex-row items-center gap-1 rounded-lg px-1 outline-none transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-400/70 disabled:pointer-events-none disabled:opacity-40",
              secondaryIconHoverClass,
            )}
            style={
              isLiked ? { color: HEART_FILL } : { color: secondaryIconColor }
            }
            aria-label={isLiked ? "لغو پسند" : "پسندیدن"}
            aria-pressed={isLiked}
            disabled={!onLike}
          >
            {likesLabel != null ? (
              <span
                key={`likes-${likesLabel}`}
                className={clsx(actionTextClass, "order-1 animate-fade-up")}
              >
                {likesLabel}
              </span>
            ) : null}
            <span
              key={`heart-${heartBurstKey}`}
              className={clsx(
                "heart-burst-target order-2 inline-flex shrink-0",
                heartBurstKey > 0 && "animate-heart-burst",
              )}
            >
              <Heart
                size={20}
                strokeWidth={1.5}
                className={clsx(heartBurstKey > 0 && "animate-pop")}
                fill={isLiked ? HEART_FILL : "none"}
                stroke={isLiked ? HEART_STROKE : secondaryIconColor}
                aria-hidden
              />
            </span>
          </button>
        </div>
      </div>
    </article>
  );
}

export const PostCard = SocialPostCard;
export const OverlayBadge = SocialPostOverlayBadge;

export function gridSpanStyle(variant: "xl" | "sm"): CSSProperties {
  return variant === "xl"
    ? { gridColumn: "span 2", gridRow: "span 2" }
    : { gridColumn: "span 1", gridRow: "span 1" };
}
