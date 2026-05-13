"use client";

import { ArrowRight } from "lucide-react";
import { useRouter } from "next/navigation";

export function PostDetailBackButton() {
  const router = useRouter();

  return (
    <button
      type="button"
      onClick={() => router.back()}
      className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white text-zinc-700 shadow-[0_0_14.7px_rgba(0,0,0,0.04)] transition-colors hover:bg-zinc-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-400/70"
      aria-label="بازگشت"
    >
      <ArrowRight className="size-[18px]" strokeWidth={1.8} aria-hidden />
    </button>
  );
}
