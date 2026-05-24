import type { HTMLAttributes } from "react";
import { cx } from "./classnames";

export type SkeletonBlockProps = HTMLAttributes<HTMLDivElement> & {
  tone?: "default" | "light";
};

export function SkeletonBlock({
  tone = "default",
  className,
  "aria-hidden": ariaHidden = true,
  ...props
}: SkeletonBlockProps) {
  return (
    <div
      className={cx(tone === "light" ? "skeleton-shimmer-light" : "skeleton-shimmer", className)}
      aria-hidden={ariaHidden}
      {...props}
    />
  );
}

export type SkeletonTextProps = SkeletonBlockProps & {
  lines?: number;
};

export function SkeletonText({ lines = 1, className, ...props }: SkeletonTextProps) {
  if (lines <= 1) {
    return <SkeletonBlock className={cx("h-4 rounded", className)} {...props} />;
  }

  return (
    <div className={cx("space-y-2", className)} aria-hidden>
      {Array.from({ length: lines }).map((_, index) => (
        <SkeletonBlock
          key={index}
          className={cx("h-4 rounded", index === lines - 1 ? "w-2/3" : "w-full")}
          {...props}
        />
      ))}
    </div>
  );
}

export type SkeletonMediaProps = SkeletonBlockProps & {
  aspect?: string;
};

export function SkeletonMedia({
  aspect = "1 / 1",
  className,
  style,
  ...props
}: SkeletonMediaProps) {
  return (
    <SkeletonBlock
      className={cx("w-full rounded-2xl", className)}
      style={{ aspectRatio: aspect, ...style }}
      {...props}
    />
  );
}
