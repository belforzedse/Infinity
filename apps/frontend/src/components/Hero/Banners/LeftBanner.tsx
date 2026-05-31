'use client';

import Image from 'next/image';
import Link from 'next/link';
import { LeftBannerSpec } from '../types';
import imageLoader from "@/utils/imageLoader";
import resolveAssetUrl from "@/utils/resolveAssetUrl";
import { useResolvedImage } from "@/hooks/useResolvedImage";
import { buildForegroundAnchorStyle } from "../utils/foregroundImageLayout";

interface LeftBannerProps {
  spec: LeftBannerSpec;
  className?: string;
}

function getBackgroundPosition(pos?: string): React.CSSProperties {
  const posValue = pos || 'center';
  const positionStyles: Record<string, React.CSSProperties> = {
    'center': { left: '50%', top: '50%', transform: 'translate(-50%, -50%)' },
    'bottom center': { left: '50%', bottom: 0, transform: 'translateX(-50%)' },
    'bottom left': { left: 0, bottom: 0, transform: 'none' },
    'bottom right': { right: 0, bottom: 0, transform: 'none' },
    'top center': { left: '50%', top: 0, transform: 'translateX(-50%)' },
    'top left': { left: 0, top: 0, transform: 'none' },
    'top right': { right: 0, top: 0, transform: 'none' },
    'center left': { left: 0, top: '50%', transform: 'translateY(-50%)' },
    'center right': { right: 0, top: '50%', transform: 'translateY(-50%)' },
  };
  return positionStyles[posValue] || positionStyles['center'];
}

export function LeftBanner({ spec, className = '' }: LeftBannerProps) {
  const { background, foregroundImage } = spec;
  const hasForegroundSrc = Boolean(foregroundImage.src?.trim());
  const { resolvedSrc, shouldRender: shouldRenderFromHook, handleError: handleForegroundImageError } =
    useResolvedImage(foregroundImage.src);
  const shouldRenderForegroundImage = hasForegroundSrc && shouldRenderFromHook;

  const resolvedBackgroundValue =
    typeof background.value === "string" ? background.value.trim() : "";
  const shouldUseImageBackground = background.type === "image" && Boolean(resolvedBackgroundValue);
  const backgroundImageUrl = shouldUseImageBackground ? resolveAssetUrl(resolvedBackgroundValue) : "";
  const objectFit = foregroundImage.objectFit || "contain";
  const zoom = typeof foregroundImage.zoom === "number" ? foregroundImage.zoom : 1;
  const overflow = foregroundImage.overflow;
  const overflowStyle: React.CSSProperties | null = overflow?.enabled
    ? {
        width: `${overflow.widthPercent}%`,
        height: "auto",
        maxWidth: "none",
        maxHeight: "none",
        ...(overflow.edge === "left" || overflow.edge === "right"
          ? {
              [overflow.edge]: -overflow.amountPx,
              top: `${overflow.offsetYPercent}%`,
              transform: "translateY(-50%)",
            }
          : {
              [overflow.edge]: -overflow.amountPx,
              left: `${overflow.offsetXPercent}%`,
              transform: "translateX(-50%)",
            }),
      }
    : null;

  const foregroundLayout = buildForegroundAnchorStyle(foregroundImage, {
    zoom,
    overflowStyle,
    objectFit,
  });

  const backgroundStyle =
    !shouldUseImageBackground
      ? { backgroundColor: resolvedBackgroundValue || "#f8fafc" }
      : {
          backgroundImage: backgroundImageUrl ? `url(${backgroundImageUrl})` : undefined,
          backgroundColor: backgroundImageUrl ? "#f5f2ef" : "#f8fafc",
          backgroundSize: background.backgroundSize || 'cover',
          backgroundPosition: background.position || 'center'
        };

  const backgroundWidth = background.width ? (typeof background.width === 'number' ? `${background.width}px` : background.width) : '100%';
  const backgroundHeight = background.height ? (typeof background.height === 'number' ? `${background.height}px` : background.height) : '100%';
  const innerBorder = background.type === "color" ? background.innerBorder : undefined;
  const shouldRenderInnerBorder = Boolean(innerBorder?.enabled && innerBorder.widthPx > 0);

  const ForegroundContent = (
    <div className={`relative h-full w-full overflow-hidden ${className}`}>
      <div
        className={`absolute  ${background.className || ""}`}
        style={{
          ...backgroundStyle,
          width: backgroundWidth,
          height: backgroundHeight,
          ...getBackgroundPosition(background.position),
          zIndex: 0,
        }}
      >
        {shouldRenderInnerBorder ? (
          <div
            aria-hidden="true"
            data-hero-inner-border="true"
            className="pointer-events-none absolute rounded-[inherit]"
            style={{
              inset: `${innerBorder?.offsetPx ?? 0}px`,
              border: `${innerBorder?.widthPx ?? 0}px solid ${innerBorder?.color || "#ffffff"}`,
              boxSizing: "border-box",
            }}
          />
        ) : null}
      </div>
      {shouldRenderForegroundImage ? (
        <Image
          src={resolvedSrc}
          loader={imageLoader}
          alt={foregroundImage.alt || "تصویر بنر"}
          width={foregroundImage.width}
          height={foregroundImage.height}
          sizes={foregroundImage.sizes}
          priority={foregroundImage.priority}
          loading={foregroundImage.loading}
          onError={handleForegroundImageError}
          className={foregroundLayout.className}
          style={foregroundLayout.style}
        />
      ) : null}
    </div>
  );

  if (foregroundImage.href) {
    return (
      <Link href={foregroundImage.href} className="block w-full h-full">
        {ForegroundContent}
      </Link>
    );
  }

  return ForegroundContent;
}
