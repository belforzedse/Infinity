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
    const token =
      typeof window !== "undefined"
        ? localStorage.getItem("accessToken")
        : null;
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
    <main className="flex min-h-screen items-start justify-center bg-pink-50 p-4 md:items-center">
      <div className="container mx-auto flex flex-col items-center justify-center gap-8 py-8 md:flex-row md:py-0">
        <div className="card w-full max-w-[630px] p-2">
          <div className="mx-auto max-w-[516px] px-2 py-4 md:py-6">
            <div className="mb-[4px] flex flex-col items-center gap-4 md:mb-[20px] md:gap-5">
              <div className="relative h-[56px] w-[90px] md:h-[68px] md:w-[110px]">
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

        <div className="block w-full max-w-[350px] md:max-w-[651px]">
          <AuthIllustration />
        </div>
      </div>
    </main>
  );
}
