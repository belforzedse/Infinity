"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/Button";

type CardValue = "post" | "story";

type CardOption = {
  value: CardValue;
  label: string;
};

const CARD_OPTIONS: readonly CardOption[] = [
  { value: "post", label: "افزودن پست" },
  { value: "story", label: "افزودن استوری" },
] as const;

const CANCEL_HREF = "/profile";
const POST_SIZE_HREF = "/profile/posts/add/post";

function cx(...parts: (string | false | undefined)[]): string {
  return parts.filter(Boolean).join(" ");
}

const cardBaseClass =
  "flex h-[181px] w-full cursor-pointer items-center justify-center rounded-3xl border-0 text-center font-peyda text-base transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-400/70 lg:max-w-[574px] lg:flex-1";

const cardUnselectedClass =
  "bg-[rgba(140,174,236,0.14)] text-[#94A3B8] hover:bg-[rgba(140,174,236,0.2)]";

const cardSelectedClass =
  "bg-[rgba(140,174,236,0.28)] text-[#3D4C6E] ring-2 ring-[#566D97]";

/**
 * Step 1 of the create-content flow: choose between adding a post or a story.
 * Sidebar is hidden on this route by `ProfileSidebar` (early-return on path),
 * so this page renders full-width inside the existing `ProfileLayout`.
 */
export default function AddPostPage() {
  const router = useRouter();
  const [selected, setSelected] = useState<CardValue | null>(null);

  const handleCancel = () => {
    router.push(CANCEL_HREF);
  };

  const handleNext = () => {
    if (selected == null) return;
    if (selected === "post") {
      router.push(POST_SIZE_HREF);
      return;
    }
    // TODO: wire story branch once /profile/posts/add/story exists.
  };

  return (
    <div className="flex w-full flex-col gap-8 lg:gap-10">
      <div className="flex w-full flex-row items-center gap-3">
        <h1 className="font-peyda text-lg font-semibold text-zinc-800 lg:text-xl">
          افزودن پست
        </h1>
        <button
          type="button"
          onClick={handleCancel}
          aria-label="بازگشت به پروفایل"
          className="hidden h-9 w-9 items-center justify-center rounded-xl bg-white text-zinc-700 shadow-[0_0_14.7px_rgba(0,0,0,0.04)] transition-colors hover:bg-zinc-50 lg:inline-flex"
        >
          <ArrowRight size={18} strokeWidth={1.8} aria-hidden />
        </button>
      </div>

      <div
        role="radiogroup"
        aria-label="نوع محتوای جدید"
        className="flex w-full flex-col gap-4 lg:flex-row lg:items-center lg:justify-center lg:gap-6"
      >
        {CARD_OPTIONS.map(({ value, label }) => {
          const isSelected = selected === value;
          return (
            <button
              key={value}
              type="button"
              role="radio"
              aria-checked={isSelected}
              onClick={() => setSelected(value)}
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
          disabled={selected == null}
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
