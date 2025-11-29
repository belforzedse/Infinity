"use client";

import Header from "@/components/SuperAdmin/Layout/Header";
import Sidebar from "@/components/SuperAdmin/Layout/Sidebar";
import ScrollToTop from "@/components/ScrollToTop";
import { Suspense, useEffect, useState, useCallback } from "react";
import { useRouter, usePathname } from "next/navigation";
import { UserService } from "@/services";
import { HTTP_STATUS } from "@/constants/api";
import { currentUserAtom } from "@/lib/atoms/auth";
import { useAtom } from "jotai";

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [, setCurrentUser] = useAtom(currentUserAtom);

  const checkAdminAccess = useCallback(async () => {
    const token = typeof window !== "undefined" ? localStorage.getItem("accessToken") : null;
    if (!token) {
      router.replace("/auth");
      return false;
    }

    const redirectToPrevious = () => {
      if (typeof window !== "undefined" && window.history.length > 1) {
        router.back();
      } else {
        router.replace("/");
      }
    };

    try {
      // Force refresh user data by clearing cache first, then fetching fresh data
      setCurrentUser(null);
      const me = await UserService.me(true);

      // Update the cached user data with fresh data
      setCurrentUser(me);

      if (!me?.isAdmin) {
        redirectToPrevious();
        return false;
      }

      return true;
    } catch (error: any) {
      // Clear user data on auth errors
      setCurrentUser(null);

      if (error?.status === HTTP_STATUS.UNAUTHORIZED) {
        router.replace("/auth");
        return false;
      }
      if (error?.status === HTTP_STATUS.FORBIDDEN) {
        redirectToPrevious();
        return false;
      }
      redirectToPrevious();
      return false;
    }
  }, [router, setCurrentUser]);

  useEffect(() => {
    let isMounted = true;
    setIsLoading(true);

    checkAdminAccess().then((authorized) => {
      if (!isMounted) return;
      setIsAuthorized(authorized);
      setIsLoading(false);
    });

    return () => {
      isMounted = false;
    };
  }, [checkAdminAccess, pathname]); // Re-check on route changes

  // Also check on window focus to catch role changes from other tabs/windows
  useEffect(() => {
    const handleFocus = () => {
      checkAdminAccess().then((authorized) => {
        if (!authorized && isAuthorized) {
          // Role was revoked, redirect immediately
          setIsAuthorized(false);
        }
      });
    };

    window.addEventListener("focus", handleFocus);
    return () => window.removeEventListener("focus", handleFocus);
  }, [checkAdminAccess, isAuthorized]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-neutral-50">
        <div
          className="h-8 w-8 animate-spin rounded-full border-2 border-neutral-300 border-t-neutral-700"
          aria-label="Loading admin view"
        />
      </div>
    );
  }

  if (!isAuthorized) {
    return null;
  }

  return (
    <>
      <Suspense fallback={<div>Loading...</div>}>
        <div className="hidden md:block">
          <Desktop>{children}</Desktop>
        </div>

        <div className="block md:hidden">
          <Mobile>{children}</Mobile>
        </div>
      </Suspense>
      <div className="[&_button]:!left-4 [&_button]:!right-auto">
        <ScrollToTop />
      </div>
    </>
  );
}

function Mobile({ children }: { children: React.ReactNode }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  return (
    <div className="min-h-screen bg-neutral-50 p-4">
      <div className="flex w-full flex-col gap-4">
        <Header onMenuClick={() => setIsSidebarOpen(!isSidebarOpen)} />
        <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
        {children}
      </div>
    </div>
  );
}

function Desktop({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen gap-5 bg-neutral-50 pl-10">
      <div className="sticky top-0 h-screen w-[250px] overflow-y-auto">
        <Sidebar isOpen={true} onClose={() => {}} />
      </div>
      <div className="flex w-full flex-1 flex-col gap-4 p-4 lg:gap-7">
        <div className="w-full max-w-screen-3xl space-y-4 lg:space-y-7 mx-auto">
          <Header onMenuClick={() => {}} />
          {children}
        </div>
      </div>
    </div>
  );
}
