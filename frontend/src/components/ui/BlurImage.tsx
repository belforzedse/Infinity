"use client";

import Image, { ImageProps } from "next/image";
import { useState } from "react";

type Props = ImageProps & {
  blurDataURL?: string;
};

export default function BlurImage({
  className,
  blurDataURL,
  onLoadingComplete,
  ...props
}: Props) {
  const [loaded, setLoaded] = useState(false);

  return (
    <Image
      {...props}
      alt={props.alt || ""}
      placeholder={blurDataURL ? "blur" : "empty"}
      blurDataURL={blurDataURL}
      className={[
        // smooth blur-up
        "duration-700 ease-in-out",
        loaded
          ? "scale-100 opacity-100 blur-0 grayscale-0"
          : "scale-105 opacity-80 blur-xl grayscale",
        className || "",
      ].join(" ")}
      onLoadingComplete={(img) => {
        setLoaded(true);
        onLoadingComplete?.(img);
      }}
    />
  );
}

