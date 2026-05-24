"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ArrowRight } from "lucide-react";
import {
  COVER_ASPECT_BY_CODE,
  SIZE_PICKER_MOBILE_PREVIEW,
  type PostCreateSizeCode,
} from "@/components/posts/post-size-config";
import { Button } from "@repo/ui/button";

type SizeOption = {
  value: PostCreateSizeCode;
  label: string;
  /** Desktop picker box (matches `POST_CARD_LAYOUTS` image area). */
  desktop: { w: number; h: number };
  /** Mobile picker box (`xl` uses `mobile-lg` width scale). */
  mobile: { w: number; h: number };
};

/**
 * XL (right in RTL flex) then SM. Pixels from `post-size-config.ts` (`COVER_ASPECT_BY_CODE`).
 */
const SIZE_OPTIONS: readonly SizeOption[] = [
  {
    value: "xl",
    label: "ایکس لارج",
    desktop: COVER_ASPECT_BY_CODE.xl,
    mobile: SIZE_PICKER_MOBILE_PREVIEW.xl,
  },
  {
    value: "sm",
    label: "اسمال",
    desktop: COVER_ASPECT_BY_CODE.sm,
    mobile: SIZE_PICKER_MOBILE_PREVIEW.sm,
  },
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
 * Step 2 of the create-content flow: choose **xl** or **sm** for the new post.
 */
export default function AddPostSizePage() {
  const router = useRouter();
  const isLgUp = useIsLgUp();
  const [selected, setSelected] = useState<PostCreateSizeCode | null>(null);

  const visibleOptions = SIZE_OPTIONS;

  const effectiveSelected: PostCreateSizeCode | null =
    selected != null && visibleOptions.some((opt) => opt.value === selected) ? selected : null;

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
