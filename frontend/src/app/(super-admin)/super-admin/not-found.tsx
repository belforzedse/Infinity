"use client";

import Link from "next/link";
import { Button } from "@/components/ui/Button";
import {
  Shield,
  Home,
  AlertTriangle,
  Settings,
  ChevronRight,
} from "lucide-react";

export default function NotFound() {
  return (
    <div className="fixed inset-0 z-[1200] flex items-center justify-center overflow-hidden bg-gradient-to-br from-rose-50 via-pink-50 to-rose-100 p-4">
      {/* Subtle background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute right-20 top-20 h-96 w-96 animate-pulse rounded-full bg-gradient-to-br from-pink-100 to-rose-100 opacity-40 mix-blend-multiply blur-3xl filter"></div>
        <div className="absolute bottom-20 left-20 h-80 w-80 animate-pulse rounded-full bg-gradient-to-br from-rose-100 to-fuchsia-100 opacity-40 mix-blend-multiply blur-3xl filter delay-1000"></div>
        <div className="absolute left-1/2 top-1/2 h-64 w-64 -translate-x-1/2 -translate-y-1/2 transform animate-pulse rounded-full bg-gradient-to-br from-pink-100 to-rose-100 opacity-40 mix-blend-multiply blur-3xl filter delay-500"></div>
      </div>

      {/* Grid pattern overlay */}
      <div className="absolute inset-0 opacity-30">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ec4899' fill-opacity='0.08'%3E%3Ccircle cx='30' cy='30' r='1.5'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }}
        ></div>
      </div>

      <div className="relative z-10 mx-auto max-w-2xl text-center">
        {/* Main content container */}
        <div className="rounded-3xl border border-gray-200 bg-white/80 p-8 shadow-xl backdrop-blur-xl md:p-12">
          {/* Admin badge */}


          <div className="text-sm mb-6 inline-flex items-center gap-2 rounded-full bg-pink-100 px-4 py-2 font-medium text-pink-700">
            <Shield className="h-4 w-4" />
            ادمین
          </div>

          {/* Icon section */}
          <div className="relative mb-8">
            <div className="mb-4 inline-flex h-24 w-24 items-center justify-center rounded-full border-4 border-pink-200 bg-gradient-to-br from-pink-100 to-rose-100 shadow-lg">
              <AlertTriangle className="h-12 w-12 text-pink-600" />

            </div>
            <div className="absolute -right-2 -top-2 flex h-8 w-8 animate-bounce items-center justify-center rounded-full border-2 border-white bg-amber-400 shadow-lg">
              <Settings className="h-4 w-4 text-amber-800" />
            </div>
          </div>

          {/* 404 Number */}
          <div className="mb-6">

            <h1 className="text-8xl bg-gradient-to-r from-pink-600 via-rose-500 to-pink-600 bg-clip-text font-black leading-none text-transparent md:text-9xl">

              404
            </h1>
          </div>

          {/* Title */}
          <h2 className="text-2xl mb-4 font-bold leading-tight text-gray-800 md:text-3xl">
            صفحه مدیریتی پیدا نشد
          </h2>

          {/* Description */}
          <p className="text-lg mb-8 leading-relaxed text-gray-600">
            آدرس وارد شده در بخش مدیریت سیستم معتبر نیست.
            <br />
            ممکن است صفحه منتقل شده یا دسترسی آن تغییر کرده باشد.
          </p>

          {/* Action buttons */}
          <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link href="/super-admin">

              <button className="group relative flex items-center gap-2 rounded-xl bg-gradient-to-r from-pink-600 to-rose-600 px-8 py-4 font-semibold text-white shadow-lg transition-all duration-300 ease-out hover:scale-105 hover:shadow-xl">
                {/* Gradient overlay for smooth hover effect */}
                <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-pink-700 to-rose-700 opacity-0 transition-opacity duration-300 group-hover:opacity-100"></div>
                <Home className="relative z-10 h-5 w-5" />
                <span className="relative z-10">بازگشت به پیشخوان</span>
                <ChevronRight className="relative z-10 h-4 w-4" />
              </button>
            </Link>

            <Link href="/super-admin/dashboard">
              <button className="flex items-center gap-2 rounded-xl border-2 border-gray-300 bg-white px-8 py-4 font-semibold text-gray-700 shadow-lg transition-all duration-300 ease-out hover:scale-105 hover:border-pink-300 hover:bg-pink-50 hover:text-pink-700 hover:shadow-xl">
                <Shield className="h-5 w-5" />
                داشبورد مدیریت
              </button>
            </Link>
          </div>

          {/* Status indicator */}
          <div className="mt-8 border-t border-gray-200 pt-6">
            <div className="text-sm flex items-center justify-center gap-3 text-gray-500">
              <div className="flex items-center gap-2">

                <div className="h-2 w-2 animate-pulse rounded-full bg-pink-500"></div>
                سیستم عملیاتی
              </div>
              <div className="h-4 w-1 bg-gray-300"></div>
              <span>کد خطا: ADMIN_404</span>
            </div>
          </div>
        </div>

        {/* Professional floating elements */}

        <div className="absolute left-10 top-10 h-3 w-3 animate-ping rounded-full bg-pink-500"></div>
        <div className="absolute bottom-10 right-10 h-4 w-4 animate-pulse rounded-full bg-rose-400"></div>
        <div className="absolute right-20 top-1/4 h-2 w-2 animate-bounce rounded-full bg-pink-400 delay-300"></div>

        {/* Decorative corner elements */}
        <div className="absolute left-0 top-0 h-32 w-32 rounded-tl-3xl border-l-2 border-t-2 border-pink-200 opacity-50"></div>
        <div className="absolute bottom-0 right-0 h-32 w-32 rounded-br-3xl border-b-2 border-r-2 border-rose-200 opacity-50"></div>
      </div>
    </div>
  );
}
