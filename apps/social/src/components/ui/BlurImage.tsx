"use client";

import { useState, type SyntheticEvent } from "react";
import Image, { type ImageProps } from "next/image";
import clsx from "clsx";

export type BlurImageProps = ImageProps;

export function BlurImage({ alt, className, onLoad, ...props }: BlurImageProps) {
  const [loaded, setLoaded] = useState(false);

  function handleLoad(event: SyntheticEvent<HTMLImageElement, Event>) {
    setLoaded(true);
    onLoad?.(event);
  }

  return (
    <Image
      {...props}
      alt={alt}
      onLoad={handleLoad}
      className={clsx("img-fx", loaded && "img-loaded", className)}
    />
  );
}
