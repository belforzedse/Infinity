"use client";

import { StorefrontLogo } from "@repo/brand";
import { Suspense, useEffect, type ReactNode } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import AuthIllustration from "@/components/Auth/Illustration";
import SuspenseLoader from "@/components/ui/SuspenseLoader";
import { currentUserAtom, userLoadingAtom } from "@/lib/atoms/auth";
import { jotaiStore } from "@/lib/jotaiStore";
import { UserService } from "@/services";

function AuthLayoutInner({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (pathname?.startsWith("/auth/register")) {
      const mobileParam = searchParams.get("phone");
      if (mobileParam) {
        localStorage.setItem("pendingPhone", mobileParam);
      }
      return;
    }

    const token = typeof window !== "undefined" ? localStorage.getItem("accessToken") : null;
    if (!token) return;

    const redirectParam = searchParams.get("redirect");

    UserService.me()
      .then((me) => {
        jotaiStore.set(currentUserAtom, me);
        jotaiStore.set(userLoadingAtom, false);
        if (redirectParam) {
          router.replace(redirectParam);
        } else {
          router.replace("/");
        }
      })
      .catch(() => {
        // stay on auth
      });
  }, [router, searchParams, pathname]);

  return (
    <main className="flex min-h-dvh items-start justify-center bg-background p-4 md:items-center">
      <div className="container mx-auto flex flex-col items-center justify-center gap-8 py-8 md:flex-row md:py-0">
        <div className="card w-full max-w-[630px] p-2">
          <div className="relative mx-auto max-w-[516px] px-2 py-4 md:py-6">
            <div className="mb-1 flex flex-col items-center gap-4 md:mb-5 md:gap-5">
              <div className="relative flex h-[56px] w-[90px] shrink-0 items-center justify-center md:h-[68px] md:w-[110px]">
                <StorefrontLogo href="/" width={110} height={68} />
              </div>
            </div>

            <Suspense fallback={<SuspenseLoader />}>{children}</Suspense>
          </div>
        </div>

        <div className="hidden w-full max-w-[350px] md:block md:max-w-[651px]">
          <AuthIllustration />
        </div>
      </div>
    </main>
  );
}

/**
 * Root auth shell: `useSearchParams` lives under `Suspense` so static generation
 * and `next build` do not fail on CSR bailout pages.
 */
export function AuthLayoutClient({ children }: { children: ReactNode }) {
  return (
    <Suspense fallback={<SuspenseLoader />}>
      <AuthLayoutInner>{children}</AuthLayoutInner>
    </Suspense>
  );
}
