"use client";

import { useAtomValue } from "jotai";
import { isGlobalLoadingAtom, navigationInProgressAtom } from "@/atoms/loading";
import clsx from "clsx";

export default function TopProgressBar() {
  const apiLoading = useAtomValue(isGlobalLoadingAtom);
  const navLoading = useAtomValue(navigationInProgressAtom);
  const active = apiLoading || navLoading;

  return (
    <div
      className={clsx(
        "fixed top-0 left-0 right-0 z-[1100] h-0.5 overflow-hidden",
        active ? "opacity-100" : "opacity-0",
        "transition-opacity duration-200"
      )}
      aria-hidden
    >
      <div className="h-full w-1/3 animate-[loaderSlide_1.2s_ease-in-out_infinite] bg-gradient-to-r from-pink-500 via-purple-500 to-pink-500" />
      <style jsx>{`
        @keyframes loaderSlide {
          0% { transform: translateX(-150%); }
          50% { transform: translateX(50%); }
          100% { transform: translateX(250%); }
        }
      `}</style>
    </div>
  );
}

