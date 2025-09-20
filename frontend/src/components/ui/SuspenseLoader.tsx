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
        "flex w-full items-center justify-center",
        className
      )}
      dir="rtl"
    >
      <div className="flex flex-col items-center gap-4">
        <div className="relative">
          <div className="h-12 w-12 animate-spin rounded-full border-2 border-pink-200 border-t-pink-500" />
          <div className="absolute inset-0 -z-10 rounded-full bg-gradient-to-tr from-pink-200/40 to-purple-200/30 blur-xl" />
        </div>
        <div className="text-sm text-neutral-600">{message}</div>
        <div className="h-1.5 w-52 overflow-hidden rounded-full bg-neutral-100">
          <div className="h-full w-1/3 animate-[loaderSlide_1.2s_ease-in-out_infinite] rounded-full bg-gradient-to-r from-pink-500 to-rose-300" />
        </div>
      </div>

      <style jsx>{`
        @keyframes loaderSlide {
          0% {
            transform: translateX(-300%);
          }
          50% {
            transform: translateX(50%);
          }
          100% {
            transform: translateX(300%);
          }
        }
      `}</style>
    </div>
  );
}
