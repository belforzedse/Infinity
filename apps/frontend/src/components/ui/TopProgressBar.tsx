"use client";

import { useAtomValue } from "jotai";
import { isGlobalLoadingAtom } from "@/atoms/loading";
import clsx from "clsx";
import useSmoothLoading from "@/hooks/useSmoothLoading";

export default function TopProgressBar() {
  const apiLoading = useAtomValue(isGlobalLoadingAtom);
  const visible = useSmoothLoading(apiLoading);

  return (
    <div
      className={clsx(
        "pointer-events-none fixed left-0 right-0 top-0 z-[1400] h-0.5 overflow-hidden",
        visible ? "opacity-100" : "opacity-0",
        "transition-opacity duration-200",
      )}
      aria-hidden
    >
      <div className="h-full w-1/3 animate-auth-loader-slide bg-gradient-to-l from-[#334155] via-[#33415e] to-[#aebfdb] shadow-[0_0_10px_rgba(57,76,110,0.55)]" />
    </div>
  );
}
