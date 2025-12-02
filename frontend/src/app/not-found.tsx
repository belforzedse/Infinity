import Link from "next/link";

//import { Button } from "@/components/ui/Button";
import { Home, MapPin } from "lucide-react";
//import {Search} from "lucide-react";

export default function NotFound() {
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-gradient-to-br from-rose-50 via-pink-50 to-rose-100 p-4">
      {/* Subtle background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute left-20 top-20 h-72 w-72 animate-pulse rounded-full bg-gradient-to-br from-pink-100 to-rose-100 opacity-30 mix-blend-multiply blur-3xl filter"></div>
        <div className="absolute bottom-20 right-20 h-96 w-96 animate-pulse rounded-full bg-gradient-to-br from-rose-100 to-fuchsia-100 opacity-30 mix-blend-multiply blur-3xl filter delay-1000"></div>
        <div className="absolute left-10 top-1/2 h-64 w-64 animate-pulse rounded-full bg-gradient-to-br from-pink-100 to-rose-100 opacity-30 mix-blend-multiply blur-3xl filter delay-500"></div>
      </div>

      {/* Decorative dots pattern */}
      <div className="absolute inset-0 opacity-20">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23ec4899' fill-opacity='0.08'%3E%3Ccircle cx='20' cy='20' r='1'/%3E%3C/g%3E%3C/svg%3E")`,
          }}
        ></div>
      </div>

      <div className="relative z-10 mx-auto max-w-2xl text-center">
        {/* Main content container */}
        <div className="rounded-3xl border border-gray-200 bg-white/90 p-8 shadow-xl backdrop-blur-sm md:p-12">
          {/* Icon and 404 section */}
          <div className="mb-8">
            <div className="relative mb-6 inline-block">
              <div className="mx-auto mb-4 flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-pink-500 to-rose-500 shadow-lg">
                <MapPin className="h-12 w-12 text-white" />
              </div>
              <div className="absolute -right-2 -top-2 flex h-6 w-6 animate-bounce items-center justify-center rounded-full bg-amber-400">
                <span className="text-xs font-bold text-amber-800">!</span>
              </div>
            </div>

            <div className="text-7xl bg-gradient-to-r from-pink-500 via-rose-500 to-pink-600 bg-clip-text font-black leading-none text-transparent md:text-8xl">
              404
            </div>
          </div>

          {/* Title */}
          <h1 className="text-2xl mb-4 font-bold text-gray-800 md:text-3xl">صفحه پیدا نشد</h1>

          {/* Description */}
          <p className="text-lg mb-8 leading-relaxed text-gray-600">
            صفحه‌ای که دنبالش می‌گردید وجود ندارد یا منتقل شده است.
            <br />
            با استفاده از لینک‌های زیر می‌تونید به مسیر درست برگردید.
          </p>

          {/* Action buttons */}
          <div className="mb-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link href="/">
              <button className="group relative flex items-center gap-2 rounded-full bg-gradient-to-r from-pink-500 to-rose-600 px-8 py-4 font-semibold text-white shadow-lg transition-all duration-300 ease-out hover:scale-105 hover:shadow-xl">
                {/* Gradient overlay for smooth hover effect */}
                <div className="absolute inset-0 rounded-full bg-gradient-to-r from-pink-600 to-rose-700 opacity-0 transition-opacity duration-300 group-hover:opacity-100"></div>
                <Home className="relative z-10 h-5 w-5" />
                <span className="relative z-10">بازگشت به صفحه اصلی</span>
              </button>
            </Link>

            {/* <Link href="/search">
              <button className="flex items-center gap-2 rounded-full border-2 border-gray-300 bg-white px-8 py-4 font-semibold text-gray-700 shadow-lg transition-all duration-300 ease-out hover:scale-105 hover:border-pink-300 hover:bg-pink-50 hover:text-pink-700 hover:shadow-xl">
                <Search className="h-5 w-5" />
                جستجو کنید
              </button>
            </Link> */}
          </div>

          {/* Help section */}
          <div className="rounded-2xl border border-pink-200 bg-pink-50 p-6">
            <div className="mb-3 flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-pink-100">
                <span className="text-sm text-pink-600">💡</span>
              </div>
              <h3 className="text-lg font-semibold text-gray-800">راهنمایی</h3>
            </div>
            <p className="text-right leading-relaxed text-gray-700">
              اگر فکر می‌کنید این یک خطاست، لطفاً آدرس URL را بررسی کنید یا از منوی اصلی سایت
              استفاده کنید.
            </p>
          </div>
        </div>

        {/* Navigation hint */}

        <div className="mt-8 flex items-center justify-center gap-2 text-gray-500">
          <span className="text-sm">
            آن را که خبر شد، خبری باز نیامد / این‌جا که تویی، هیچ کسی باز نیامد{" "}
          </span>
        </div>
      </div>

      {/* Subtle decorative elements */}

      <div className="absolute left-10 top-10 h-2 w-2 animate-ping rounded-full bg-pink-500"></div>
      <div className="absolute bottom-10 right-10 h-3 w-3 animate-pulse rounded-full bg-rose-400"></div>
      <div className="absolute right-20 top-1/4 h-1 w-1 animate-bounce rounded-full bg-pink-400 delay-300"></div>
    </div>
  );
}
