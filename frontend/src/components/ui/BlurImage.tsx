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
      placeholder={blurDataURL ? "blur" : "empty"}
      blurDataURL={blurDataURL}
      className={[
        // smooth blur-up
        "duration-700 ease-in-out",
        loaded ? "scale-100 blur-0 grayscale-0 opacity-100" : "scale-105 blur-xl grayscale opacity-80",
        className || "",
      ].join(" ")}
      onLoadingComplete={(img) => {
        setLoaded(true);
        onLoadingComplete?.(img);
      }}
    />
  );
}

