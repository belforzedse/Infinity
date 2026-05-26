"use client";

import { ArrowRight } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { getMobileBackFallbackHref } from "@/utils/mobileBackNavigation";

type MobileBackButtonProps = {
  fallbackHref?: string | null;
  className?: string;
  ariaLabel?: string;
};

function cx(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(" ");
}

export default function MobileBackButton({
  fallbackHref,
  className,
  ariaLabel = "Back",
}: MobileBackButtonProps) {
  const pathname = usePathname();
  const router = useRouter();
  const resolvedFallbackHref =
    fallbackHref === undefined ? getMobileBackFallbackHref(pathname) : fallbackHref;

  if (!resolvedFallbackHref) {
    return null;
  }

  return (
    <button
      type="button"
      onClick={() => {
        if (window.history.length > 1) {
          router.back();
          return;
        }

        router.push(resolvedFallbackHref);
      }}
      className={cx(
        "inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-slate-200 bg-white text-neutral-700 transition-colors hover:bg-neutral-50 hover:text-neutral-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-pink-400 lg:hidden",
        className,
      )}
      aria-label={ariaLabel}
    >
      <ArrowRight className="h-5 w-5" strokeWidth={1.75} aria-hidden />
    </button>
  );
}
