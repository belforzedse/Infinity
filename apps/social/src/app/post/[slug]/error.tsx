"use client";

import { Header } from "@/components/Header";
import { SocialContainer } from "@/components/SocialContainer";

export default function PostDetailError({ reset }: { reset: () => void }) {
  return (
    <div className="flex min-h-dvh flex-col">
      <Header />
      <SocialContainer as="main" className="flex flex-1 items-center justify-center px-4 py-12">
        <div className="rounded-[28px] bg-white px-6 py-8 text-center shadow-[0_18px_45px_rgba(61,76,110,0.06)]">
          <h1 className="font-peyda text-xl font-bold text-[#424242]">دریافت پست ناموفق بود.</h1>
          <p className="mt-2 font-peyda text-sm text-[#8FA0BC]">
            کمی بعد دوباره تلاش کنید.
          </p>
          <button
            type="button"
            onClick={reset}
            className="mt-5 inline-flex h-11 items-center justify-center rounded-full bg-[#F7F8FF] px-5 font-peyda text-sm font-semibold text-[#3D4C6E]"
          >
            تلاش دوباره
          </button>
        </div>
      </SocialContainer>
    </div>
  );
}
