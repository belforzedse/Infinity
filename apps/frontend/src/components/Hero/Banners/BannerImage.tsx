import Image from "next/image";
import Link from "next/link";
import React from "react";
import imageLoader from "@/utils/imageLoader";

type BannerImageProps = {
  src: string;
  alt: string;
  width: number;
  height: number;
  className?: string;
  priority?: boolean;
  loading?: "eager" | "lazy";
  sizes?: string;
  href?: string;
  objectPosition?: string;
  quality?: number;
};

export default function BannerImage({
  src,
  alt,
  width,
  height,
  className,
  priority,
  loading,
  sizes,
  href,
  objectPosition,
  quality = 70,
}: BannerImageProps) {
  const normalizedSrc = typeof src === "string" ? src.trim() : "";
  if (!normalizedSrc) return null;

  const imageStyle = objectPosition ? { objectPosition } : undefined;

  const img = (
    <Image
      src={normalizedSrc}
      loader={({ src, width, quality: loaderQuality }) =>
        imageLoader({ src, width, quality: loaderQuality ?? quality })
      }
      alt={alt}
      width={width}
      height={height}
      className={className}
      priority={priority}
      loading={loading}
      sizes={sizes}
      style={imageStyle}
    />
  );

  if (href) {
    return <Link href={href}>{img}</Link>;
  }

  return img;
}
