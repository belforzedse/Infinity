import type { CSSProperties } from "react";
import type { BannerImageSpec } from "../types";
import {
  HERO_OBJECT_POSITION_MAX,
  HERO_OBJECT_POSITION_MIN,
} from "@/types/super-admin/heroSlider";

const OBJECT_POSITION_CLASS_PATTERN =
  /^object-(?:bottom|top|left|right|center|left-bottom|left-top|right-bottom|right-top)$/;

export function stripObjectPositionClasses(className: string): string {
  return className
    .split(/\s+/)
    .filter((token) => token && !OBJECT_POSITION_CLASS_PATTERN.test(token))
    .join(" ")
    .trim();
}

export function resolveForegroundAnchor(image: BannerImageSpec): { x: number; y: number } {
  if (typeof image.focalX === "number" && typeof image.focalY === "number") {
    return {
      x: Math.min(HERO_OBJECT_POSITION_MAX, Math.max(HERO_OBJECT_POSITION_MIN, image.focalX)),
      y: Math.min(HERO_OBJECT_POSITION_MAX, Math.max(HERO_OBJECT_POSITION_MIN, image.focalY)),
    };
  }

  return { x: 0, y: 100 };
}

export function buildForegroundAnchorStyle(
  image: BannerImageSpec,
  options: {
    zoom: number;
    overflowStyle: CSSProperties | null;
    objectFit: "cover" | "contain";
  },
): {
  className: string;
  style: CSSProperties;
} {
  const { zoom, overflowStyle, objectFit } = options;

  if (overflowStyle) {
    const objectPosition =
      typeof image.focalX === "number" && typeof image.focalY === "number"
        ? `${image.focalX}% ${image.focalY}%`
        : image.objectPosition || "bottom left";

    return {
      className: `absolute inset-0 h-full w-full ${image.className || "object-contain"}`.trim(),
      style: {
        objectPosition,
        objectFit,
        transform:
          [overflowStyle.transform, zoom !== 1 ? `scale(${zoom})` : null].filter(Boolean).join(" ") ||
          undefined,
        zIndex: 10,
        width: image.customWidth ?? overflowStyle.width,
        height: image.customHeight ?? overflowStyle.height,
        left: overflowStyle.left,
        right: overflowStyle.right,
        top: overflowStyle.top,
        bottom: overflowStyle.bottom,
        maxWidth: overflowStyle.maxWidth,
        maxHeight: overflowStyle.maxHeight,
      },
    };
  }

  const anchor = resolveForegroundAnchor(image);
  const offsetX = image.offsetXPx ?? 0;
  const offsetY = image.offsetYPx ?? 0;
  const width = image.customWidth?.trim() || "auto";
  const height = image.customHeight?.trim() || "auto";

  return {
    className: `absolute ${stripObjectPositionClasses(image.className || "object-contain")}`.trim(),
    style: {
      left: `${anchor.x}%`,
      top: `${anchor.y}%`,
      width,
      height,
      maxWidth: width === "auto" ? "100%" : undefined,
      maxHeight: height === "auto" ? "100%" : undefined,
      objectFit,
      transform:
        [
          `translate(calc(-${anchor.x}% + ${offsetX}px), calc(-${anchor.y}% + ${offsetY}px))`,
          zoom !== 1 ? `scale(${zoom})` : null,
        ]
          .filter(Boolean)
          .join(" ") || undefined,
      transformOrigin: `${anchor.x}% ${anchor.y}%`,
      zIndex: 10,
    },
  };
}
