"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/Button";

type SizeValue = "xl" | "l" | "m" | "s";

type Dimensions = { w: number; h: number };

type SizeOption = {
  value: SizeValue;
  label: string;
  desktop: Dimensions;
  /**
   * Mobile dimensions. `null` means the option is hidden on mobile (only XL
   * and S are surfaced on mobile per product spec, so users get a fast pick
   * between "fullscreen" and "thumbnail" without scrolling through every
   * intermediate ratio).
   */
  mobile: Dimensions | null;
};

/**
 * Card metadata, ordered largest → smallest. In an RTL container the first
 * item lands on the right, so XL renders rightmost on desktop (matches mock).
 * Mobile shows only XL + S stacked top-to-bottom; mobile XL is scaled to
 * **360 wide** (preserving aspect ratio → 360×508) so it fits a 360px viewport.
 * S keeps its desktop pixels on mobile (180×260) so the relative-size
 * hierarchy still reads at a glance.
 */
const SIZE_OPTIONS: readonly SizeOption[] = [
  { value: "xl", label: "ایکس لارج", desktop: { w: 380, h: 536 }, mobile: { w: 360, h: 508 } },
  { value: "l", label: "لارج", desktop: { w: 280, h: 464 }, mobile: null },
  { value: "m", label: "مدیوم", desktop: { w: 280, h: 260 }, mobile: null },
  { value: "s", label: "اسمال", desktop: { w: 180, h: 260 }, mobile: { w: 180, h: 260 } },
] as const;

const PARENT_HREF = "/profile/posts/add";
const CANCEL_HREF = "/profile";
const CONTENT_HREF = "/profile/posts/add/post/content";
const LG_MEDIA_QUERY = "(min-width: 1024px)";

function cx(...parts: (string | false | undefined)[]): string {
  return parts.filter(Boolean).join(" ");
}

const cardBaseClass =
  "flex shrink-0 cursor-pointer items-center justify-center rounded-3xl border-0 text-center font-peyda text-base transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-400/70";

const cardUnselectedClass =
  "bg-[rgba(140,174,236,0.14)] text-[#94A3B8] hover:bg-[rgba(140,174,236,0.2)]";

const cardSelectedClass =
  "bg-[rgba(140,174,236,0.28)] text-[#3D4C6E] ring-2 ring-[#566D97]";

/**
 * Tracks the `lg` breakpoint (≥1024px) on the client so we can swap each
 * card between its desktop and mobile pixel dimensions. SSR/initial render
 * defaults to desktop to keep the layout stable above the breakpoint; the
 * post-mount effect corrects mobile viewports on first paint.
 */
function useIsLgUp(): boolean {
  const [isLgUp, setIsLgUp] = useState<boolean>(true);

  useEffect(() => {
    if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
      return;
    }

    const mql = window.matchMedia(LG_MEDIA_QUERY);
    const apply = () => setIsLgUp(mql.matches);
    apply();
    mql.addEventListener("change", apply);
    return () => mql.removeEventListener("change", apply);
  }, []);

  return isLgUp;
}

/**
 * Step 2 of the create-content flow: choose an image size for the new post.
 * Reached from `/profile/posts/add` after picking "افزودن پست" + Next.
 * Sidebar is hidden on this route by `ProfileSidebar` (early-return on path),
 * so this page renders full-width inside `ProfileLayout`.
 */
export default function AddPostSizePage() {
  const router = useRouter();
  const isLgUp = useIsLgUp();
  const [selected, setSelected] = useState<SizeValue | null>(null);

  const visibleOptions = isLgUp
    ? SIZE_OPTIONS
    : SIZE_OPTIONS.filter((opt) => opt.mobile != null);

  /**
   * Derived effective selection: if the raw `selected` value isn't in the
   * currently visible set (e.g. user picked L/M on desktop then resized to
   * mobile where those cards are hidden), treat the radio group as visually
   * unselected without mutating state. The raw pick is preserved, so resizing
   * back to desktop restores the original selection automatically.
   */
  const effectiveSelected: SizeValue | null =
    selected != null && visibleOptions.some((opt) => opt.value === selected)
      ? selected
      : null;

  const handleBack = () => {
    router.push(PARENT_HREF);
  };

  const handleCancel = () => {
    router.push(CANCEL_HREF);
  };

  const handleNext = () => {
    if (effectiveSelected == null) return;
    router.push(`${CONTENT_HREF}?size=${effectiveSelected}`);
  };

  return (
    <div className="flex w-full flex-col gap-8 lg:gap-10">
      <div className="flex w-full flex-row items-center gap-3">
        <h1 className="font-peyda text-lg font-semibold text-zinc-800 lg:text-xl">
          انتخاب سایز
        </h1>
        <button
          type="button"
          onClick={handleBack}
          aria-label="بازگشت به مرحله ی قبل"
          className="hidden h-9 w-9 items-center justify-center rounded-xl bg-white text-zinc-700 shadow-[0_0_14.7px_rgba(0,0,0,0.04)] transition-colors hover:bg-zinc-50 lg:inline-flex"
        >
          <ArrowRight size={18} strokeWidth={1.8} aria-hidden />
        </button>
      </div>

      <div
        role="radiogroup"
        aria-label="انتخاب سایز پست"
        className="flex w-full flex-col items-end gap-4 lg:flex-row lg:justify-center lg:gap-6"
      >
        {visibleOptions.map(({ value, label, desktop, mobile }) => {
          const isSelected = effectiveSelected === value;
          const dim = isLgUp ? desktop : mobile;
          if (dim == null) return null;
          return (
            <button
              key={value}
              type="button"
              role="radio"
              aria-checked={isSelected}
              aria-label={label}
              onClick={() => setSelected(value)}
              style={{ width: `${dim.w}px`, height: `${dim.h}px` }}
              className={cx(
                cardBaseClass,
                isSelected ? cardSelectedClass : cardUnselectedClass,
              )}
            >
              {label}
            </button>
          );
        })}
      </div>

      <div className="grid grid-cols-2 gap-3 [&>button]:w-full lg:flex lg:flex-row lg:justify-end lg:[&>button]:w-auto">
        <Button
          variant="blue"
          disabled={effectiveSelected == null}
          onClick={handleNext}
          aria-label="رفتن به مرحله ی بعد"
        >
          مرحله ی بعد
        </Button>
        <Button
          variant="default"
          onClick={handleCancel}
          aria-label="انصراف از افزودن پست"
        >
          انصراف
        </Button>
      </div>
    </div>
  );
}
