"use client";

import { useEffect, useState, useCallback } from "react";

const HERO_IMAGE_PLACEHOLDER_SRC = "/images/placeholders/image-placeholder.svg";

export interface UseResolvedImageReturn {
  resolvedSrc: string;
  hideImage: boolean;
  handleError: () => void;
  shouldRender: boolean;
}

/**
 * Resolves an image src with normalization, fallback on error, and optional hide when fallback also fails.
 * Use for hero/banner images that may come from CMS and need a placeholder fallback.
 */
export function useResolvedImage(
  src: string | undefined | null,
  fallbackSrc: string = HERO_IMAGE_PLACEHOLDER_SRC
): UseResolvedImageReturn {
  const normalizedSrc =
    typeof src === "string" ? src.trim() : "";

  const [resolvedSrc, setResolvedSrc] = useState<string>(
    normalizedSrc || fallbackSrc
  );
  const [hideImage, setHideImage] = useState(false);

  useEffect(() => {
    setResolvedSrc(normalizedSrc || fallbackSrc);
    setHideImage(false);
  }, [normalizedSrc, fallbackSrc]);

  const handleError = useCallback(() => {
    if (resolvedSrc !== fallbackSrc) {
      setResolvedSrc(fallbackSrc);
      return;
    }
    setHideImage(true);
  }, [resolvedSrc, fallbackSrc]);

  const shouldRender = !hideImage && Boolean(resolvedSrc);

  return {
    resolvedSrc,
    hideImage,
    handleError,
    shouldRender,
  };
}
