import Link from "next/link";
import { Header } from "@/components/Header";
import { SocialContainer } from "@/components/SocialContainer";

export default function PostDetailNotFound() {
  return (
    <div className="flex min-h-dvh flex-col">
      <Header />
      <SocialContainer as="main" className="flex flex-1 items-center justify-center px-4 py-12">
        <div className="rounded-[28px] bg-white px-6 py-8 text-center shadow-[0_18px_45px_rgba(61,76,110,0.06)]">
          <h1 className="font-peyda text-xl font-bold text-[#424242]">پست یافت نشد.</h1>
          <p className="mt-2 font-peyda text-sm text-[#8FA0BC]">
            این پست حذف شده یا آدرس آن تغییر کرده است.
          </p>
          <Link
            href="/"
            className="mt-5 inline-flex h-11 items-center justify-center rounded-full bg-[#F7F8FF] px-5 font-peyda text-sm font-semibold text-[#3D4C6E]"
          >
            بازگشت به پست‌ها
          </Link>
        </div>
      </SocialContainer>
    </div>
  );
}
