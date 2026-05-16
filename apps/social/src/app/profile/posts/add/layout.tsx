"use client";

import type { ReactNode } from "react";
import { usePathname } from "next/navigation";

const POST_STEPS = [
  { label: "نوع محتوا", path: "/profile/posts/add" },
  { label: "انتخاب سایز", path: "/profile/posts/add/post" },
  { label: "انتشار پست", path: "/profile/posts/add/post/content" },
] as const;

const STORY_STEPS = [
  { label: "نوع محتوا", path: "/profile/posts/add" },
  { label: "انتشار استوری", path: "/profile/posts/add/story" },
] as const;

function getSteps(pathname: string) {
  return pathname.startsWith("/profile/posts/add/story") ? STORY_STEPS : POST_STEPS;
}

function getActiveStep(pathname: string): number {
  if (pathname.startsWith("/profile/posts/add/story")) return 1;
  if (pathname.startsWith("/profile/posts/add/post/content")) return 2;
  if (pathname.startsWith("/profile/posts/add/post")) return 1;
  return 0;
}

export default function AddPostLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const steps = getSteps(pathname);
  const activeStep = getActiveStep(pathname);
  const progress = ((activeStep + 1) / steps.length) * 100;

  return (
    <div className="flex w-full flex-col gap-6">
      {/* Step bubbles + connecting lines */}
      <div className="flex items-center justify-center gap-0" aria-label="مراحل ایجاد پست" role="list">
        {steps.map((step, index) => {
          const isPast = index < activeStep;
          const isActive = index === activeStep;

          return (
            <div key={step.path} className="flex items-center" role="listitem">
              {index > 0 && (
                <div
                  className="mx-1 h-px w-10 transition-colors duration-500 ease-[var(--ease-butter)] sm:w-16"
                  style={{ backgroundColor: isPast || isActive ? "var(--infinity-primary)" : "#e4e4e7" }}
                  aria-hidden
                />
              )}
              <div className="flex flex-col items-center gap-1.5">
                <div
                  className="flex size-7 items-center justify-center rounded-full font-peyda text-xs font-bold transition-colors duration-500 ease-[var(--ease-butter)]"
                  style={
                    isActive
                      ? { backgroundColor: "var(--infinity-primary)", color: "#fff" }
                      : isPast
                      ? { backgroundColor: "rgba(61,76,110,0.14)", color: "var(--infinity-primary)" }
                      : { backgroundColor: "#f4f4f5", color: "#a1a1aa" }
                  }
                  aria-current={isActive ? "step" : undefined}
                >
                  {index + 1}
                </div>
                <span
                  className="hidden font-peyda text-[11px] font-medium sm:block"
                  style={{ color: isActive ? "var(--infinity-primary)" : isPast ? "rgba(61,76,110,0.7)" : "#a1a1aa" }}
                >
                  {step.label}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Progress fill bar */}
      <div className="h-[3px] w-full overflow-hidden rounded-full bg-zinc-100">
        <div
          className="h-full rounded-full bg-gradient-to-l from-[#3d4c6e] to-[#98bdff] transition-all duration-500 ease-[var(--ease-butter)]"
          style={{ width: `${progress}%` }}
          aria-hidden
        />
      </div>

      {children}
    </div>
  );
}
