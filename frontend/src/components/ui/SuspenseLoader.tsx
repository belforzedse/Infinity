"use client";

import React from "react";
import clsx from "clsx";

type Props = {
  fullscreen?: boolean;
  className?: string;
  message?: string;
};

export default function SuspenseLoader({
  fullscreen = true,
  className,
  message = "در حال بارگذاری...",
}: Props) {
  return (
    <div
      className={clsx(
        fullscreen && "min-h-[50vh] md:min-h-screen",
        "w-full flex items-center justify-center",
        className
      )}
      dir="rtl"
    >
      <div className="flex flex-col items-center gap-4">
        <div className="relative">
          <div className="h-12 w-12 rounded-full border-2 border-pink-200 animate-spin border-t-pink-500" />
          <div className="absolute inset-0 -z-10 blur-xl bg-gradient-to-tr from-pink-200/40 to-purple-200/30 rounded-full" />
        </div>
        <div className="text-sm text-neutral-600">{message}</div>
        <div className="w-52 h-1.5 overflow-hidden rounded-full bg-neutral-100">
          <div className="h-full w-1/3 rounded-full bg-gradient-to-r from-pink-500 to-purple-500 animate-[loaderSlide_1.2s_ease-in-out_infinite]" />
        </div>
      </div>

      <style jsx>{`
        @keyframes loaderSlide {
          0% {
            transform: translateX(-150%);
          }
          50% {
            transform: translateX(50%);
          }
          100% {
            transform: translateX(250%);
          }
        }
      `}</style>
    </div>
  );
}

