'use client';

import { useEffect, useState } from "react";
import Image from 'next/image';
import Link from 'next/link';
import { LeftBannerSpec } from '../types';
import imageLoader from "@/utils/imageLoader";
import resolveAssetUrl from "@/utils/resolveAssetUrl";
import { useResolvedImage } from "@/hooks/useResolvedImage";

interface LeftBannerProps {
  spec: LeftBannerSpec;
  className?: string;
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
  const objectPosition =
    (typeof foregroundImage.focalX === "number" && typeof foregroundImage.focalY === "number")
      ? `${foregroundImage.focalX}% ${foregroundImage.focalY}%`
      : (foregroundImage.objectPosition || "center");
  const objectFit = foregroundImage.objectFit || "contain";
  const zoom = typeof foregroundImage.zoom === "number" ? foregroundImage.zoom : 1;

  // Determine background styling (resolve Strapi paths to absolute URL for image backgrounds)
  // When using an image, set a fallback backgroundColor so areas not covered by the image
  // (e.g. top when position is "bottom" and size is "contain") are not transparent and don't show a band.
  const backgroundStyle =
    !shouldUseImageBackground
      ? { backgroundColor: resolvedBackgroundValue || "#f8fafc" }
      : {
          backgroundImage: backgroundImageUrl ? `url(${backgroundImageUrl})` : undefined,
          backgroundColor: backgroundImageUrl ? "#f5f2ef" : "#f8fafc", // fallback for uncovered areas (e.g. beige-tinted neutral)
          backgroundSize: background.backgroundSize || 'cover',
          backgroundPosition: background.position || 'center'
        };

  // Background dimensions
  const backgroundWidth = background.width ? (typeof background.width === 'number' ? `${background.width}px` : background.width) : '100%';
  const backgroundHeight = background.height ? (typeof background.height === 'number' ? `${background.height}px` : background.height) : '100%';

  // Calculate background position based on position value
  const getBackgroundPosition = (pos?: string) => {
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
  };

  // Render foreground image
  const ForegroundContent = (
    <div className={`relative h-full w-full ${className}`}>
      {/* Background element */}
      <div
        className={`absolute  ${background.className || ""}`}
        style={{
          ...backgroundStyle,
          width: backgroundWidth,
          height: backgroundHeight,
          ...getBackgroundPosition(background.position),
          zIndex: 0,
        }}
      />
      {/* Foreground image - can overlap background */}
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
          className={`absolute inset-0 lg:h-full lg:w-full ${foregroundImage.className || "object-contain"}`}
          style={{
            objectPosition,
            objectFit,
            transform: zoom !== 1 ? `scale(${zoom})` : undefined,
            zIndex: 10,
          }}
        />
      ) : null}
    </div>
  );

  // Wrap with link if href is provided
  if (foregroundImage.href) {
    return (
      <Link href={foregroundImage.href} className="block w-full h-full">
        {ForegroundContent}
      </Link>
    );
  }

  return ForegroundContent;
}
