"use client";

import Image, { ImageProps } from "next/image";
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
    </svg>`
  )}`;
};

export default function BlurImage({
  className,
  blurDataURL,
  onLoadingComplete,
  priority = false,
  ...props
}: Props) {
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);

  const defaultBlurDataURL = blurDataURL || generateBlurDataURL();

  return (
    <Image
      {...props}
      alt={props.alt || ""}
      placeholder="blur"
      blurDataURL={defaultBlurDataURL}
      priority={priority}
      quality={75}
      className={[
        // smooth blur-up transition
        "duration-500 ease-in-out transition-all",
        loaded && !error
          ? "scale-100 opacity-100 blur-0"
          : "scale-105 opacity-80 blur-sm",
        error ? "opacity-50" : "",
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
