import Image from "next/image";
import Link from "next/link";
import React from "react";

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
}: BannerImageProps) {
  const imageStyle = objectPosition ? { objectPosition } : undefined;

  const img = (
    <Image
      src={src}
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
