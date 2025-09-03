"use client";

import Image from "next/image";
import AuthIllustration from "@/components/Auth/Illustration";
import { Suspense, useEffect } from "react";
import { useRouter } from "next/navigation";
import { UserService } from "@/services";
import SuspenseLoader from "@/components/ui/SuspenseLoader";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();

  useEffect(() => {
    const token = typeof window !== "undefined" ? localStorage.getItem("accessToken") : null;
    if (!token) return;

    // Redirect authenticated users based on role
    UserService.me()
      .then((me) => {
        if (me?.isAdmin) {
          router.replace("/super-admin");
        } else {
          router.replace("/account");
        }
      })
      .catch(() => {
        // If fetch fails, stay on auth and let user log in again
      });
  }, [router]);

  return (
    <main className="min-h-screen bg-pink-50 flex items-start md:items-center justify-center p-4">
      <div className="container mx-auto flex flex-col md:flex-row items-center justify-center gap-8 py-8 md:py-0">
        <div className="w-full max-w-[630px] bg-white rounded-3xl shadow-[6px_6px_54px_rgba(0,0,0,0.03)] p-2">
          <div className="max-w-[516px] mx-auto py-4 md:py-6 px-2">
            <div className="flex flex-col items-center gap-4 md:gap-5 mb-[4px] md:mb-[20px]">
              <div className="w-[90px] md:w-[110px] h-[56px] md:h-[68px] relative">
                <Image
                  src="/images/full-logo.png"
                  alt="Logo"
                  fill
                  className="object-contain"
                />
              </div>
            </div>

            <Suspense fallback={<SuspenseLoader />}>{children}</Suspense>
          </div>
        </div>

        <div className="w-full max-w-[350px] md:max-w-[651px] block">
          <AuthIllustration />
        </div>
      </div>
    </main>
  );
}
