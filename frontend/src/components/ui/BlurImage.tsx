"use client";

import type { ImageProps } from "next/image";
import Image from "next/image";
import { useState } from "react";

type Props = ImageProps & {
  blurDataURL?: string;
  priority?: boolean;
};

// Generate a simple blur placeholder
const generateBlurDataURL = (width = 10, height = 10) => {
  return `data:image/svg+xml;base64,${btoa(
    `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
      <rect width="100%" height="100%" fill="#f3f4f6"/>
    </svg>`,
  )}`;
};

// Generate a fallback placeholder image (product image placeholder)
const generateFallbackImage = (width = 400, height = 400) => {
  return `data:image/svg+xml;base64,${btoa(
    `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}">
      <rect width="100%" height="100%" fill="#f3f4f6"/>
      <g fill="#9ca3af" opacity="0.5">
        <circle cx="${width * 0.3}" cy="${height * 0.3}" r="${width * 0.15}"/>
        <path d="M ${width * 0.2} ${height * 0.6} L ${width * 0.5} ${height * 0.8} L ${width * 0.8} ${height * 0.6} L ${width * 0.8} ${height * 0.9} L ${width * 0.2} ${height * 0.9} Z"/>
      </g>
      <text x="50%" y="50%" text-anchor="middle" dominant-baseline="middle" font-family="Arial, sans-serif" font-size="${width * 0.08}" fill="#6b7280">بدون تصویر</text>
    </svg>`,
  )}`;
};

export default function BlurImage({
  className,
  blurDataURL,
  onLoadingComplete,
  priority = false,
  src,
  ...props
}: Props) {
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);

  // Use fallback image if src is empty, null, or undefined
  const imageSrc = !src || src === "" || (typeof src === "string" && src.trim() === "") 
    ? generateFallbackImage() 
    : src;

  const defaultBlurDataURL = blurDataURL || generateBlurDataURL();

  return (
    <Image
      {...props}
      src={imageSrc}
      alt={props.alt || "تصویر محصول"}
      placeholder="blur"
      blurDataURL={defaultBlurDataURL}
      priority={priority}
      quality={75}
      className={[
        // smooth blur-up transition
        "transition-all duration-500 ease-in-out",
        loaded && !error ? "scale-100 opacity-100 blur-0" : "scale-105 opacity-80 blur-sm",
        error || !src || src === "" ? "opacity-60" : "",
        className || "",
      ].join(" ")}
      onLoadingComplete={(img) => {
        setLoaded(true);
        onLoadingComplete?.(img);
      }}
      onError={() => {
        setError(true);
        setLoaded(true);
      }}
    />
  );
}
