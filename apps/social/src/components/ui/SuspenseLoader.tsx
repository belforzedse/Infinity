"use client";

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
        className,
      )}
      dir="rtl"
    >
      <div className="flex flex-col items-center gap-4">
        <div className="relative">
          <div className="h-12 w-12 animate-spin rounded-full border-2 border-slate-200 border-t-infinity-primary" />
          <div className="absolute inset-0 -z-10 rounded-full bg-infinity-primary/10 blur-xl" />
        </div>
        <div className="text-sm text-neutral-600">{message}</div>
        <div className="h-1.5 w-52 overflow-hidden rounded-full bg-neutral-100">
          <div className="h-full w-1/3 animate-auth-loader-slide rounded-full bg-gradient-to-r from-infinity-primary to-slate-400" />
        </div>
      </div>
    </div>
  );
}
