"use client";

import { ArrowRight } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";

function getFallbackHref(pathname: string): string | null {
  if (pathname.startsWith("/profile/posts/add/post/content")) {
    return "/profile/posts/add/post";
  }
  if (pathname.startsWith("/profile/posts/add/post") || pathname.startsWith("/profile/posts/add/story")) {
    return "/profile/posts/add";
  }
  if (pathname.startsWith("/profile/posts/add")) {
    return "/profile";
  }
  if (pathname.startsWith("/profile/posts/stories/")) {
    return "/profile/posts?tab=stories";
  }
  if (pathname.startsWith("/profile/posts/edit/")) {
    return "/profile/posts";
  }
  if (pathname === "/profile/posts") {
    return "/profile";
  }
  if (pathname === "/profile/bookmarks" || pathname === "/profile/notifications") {
    return "/profile";
  }
  if (pathname.startsWith("/post/")) {
    return "/";
  }
  return null;
}

export function MobileHeaderBackButton() {
  const pathname = usePathname();
  const router = useRouter();
  const fallbackHref = getFallbackHref(pathname);

  if (!fallbackHref) {
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
        router.push(fallbackHref);
      }}
      className="inline-flex shrink-0 items-center justify-center rounded-2xl bg-white p-2.5 text-[#94A3B8] shadow-sm transition-colors hover:text-zinc-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-400/70"
      aria-label="بازگشت"
    >
      <ArrowRight className="size-5" strokeWidth={1.5} aria-hidden />
    </button>
  );
}
