"use client";

import Image from "next/image";
import AuthIllustration from "@/components/Auth/Illustration";
import { Suspense, useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { UserService } from "@/services";
import SuspenseLoader from "@/components/ui/SuspenseLoader";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isHydrated, setIsHydrated] = useState(false);

  // Mark component as hydrated after first render
  useEffect(() => {
    setIsHydrated(true);
  }, []);

  useEffect(() => {
    // Only run auth redirect logic after hydration is complete
    if (!isHydrated) return;

    // Allow registration-related pages to stay accessible even when a token exists
    if (pathname?.startsWith("/auth/register")) {
      const mobileParam = searchParams.get("phone");
      if (mobileParam) {
        localStorage.setItem("pendingPhone", mobileParam);
      }
      return;
    }

    const token = typeof window !== "undefined" ? localStorage.getItem("accessToken") : null;
    if (!token) return;

    // Get the redirect parameter if it exists
    const redirectParam = searchParams.get("redirect");

    // Redirect authenticated users based on role (or to the redirect URL if provided)
    UserService.me()
      .then((me) => {
        // If there's a redirect parameter, prioritize it
        if (redirectParam) {
          router.replace(redirectParam);
        } else if (me?.isAdmin) {
          router.replace("/super-admin");
        } else {
          router.replace("/account");
        }
      })
      .catch(() => {
        // If fetch fails, stay on auth and let user log in again
      });
  }, [isHydrated, router, searchParams, pathname]);

  return (
    <main className="flex min-h-screen items-start justify-center bg-pink-50 p-4 md:items-center">
      <div className="container mx-auto flex flex-col items-center justify-center gap-8 py-8 md:flex-row md:py-0">
        <div className="card w-full max-w-[630px] p-2">
          <div className="mx-auto max-w-[516px] px-2 py-4 md:py-6">
            <div className="mb-[4px] flex flex-col items-center gap-4 md:mb-[20px] md:gap-5">
              <div className="relative h-[56px] w-[90px] md:h-[68px] md:w-[110px]">
                <Image src="/images/full-logo.png" alt="Logo" fill className="object-contain" />
              </div>
            </div>

            <Suspense fallback={<SuspenseLoader />}>{children}</Suspense>
          </div>
        </div>

        <div className="block w-full max-w-[350px] md:max-w-[651px]">
          <AuthIllustration />
        </div>
      </div>
    </main>
  );
}
