"use client";

import Header from "@/components/SuperAdmin/Layout/Header";
import Sidebar from "@/components/SuperAdmin/Layout/Sidebar";
import ScrollToTop from "@/components/ScrollToTop";
import { Suspense, useEffect, useState, useRef, useCallback } from "react";
import { useRouter, usePathname } from "next/navigation";
import { UserService } from "@/services";
import { HTTP_STATUS } from "@/constants/api";
import { currentUserAtom } from "@/lib/atoms/auth";
import { useSetAtom } from "jotai";
import clsx from "clsx";

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const setCurrentUser = useSetAtom(currentUserAtom);
  const hasRunRef = useRef(false);
  const lastCheckRef = useRef<number>(0);
  const isCheckingRef = useRef(false);

  const redirectToPrevious = useCallback(() => {
    if (typeof window !== "undefined" && window.history.length > 1) {
      router.back();
    } else {
      router.replace("/");
    }
  }, [router]);

  // Silent background auth check - doesn't show loading state
  const checkAuthSilently = useCallback(async () => {
    // Prevent concurrent checks
    if (isCheckingRef.current) return;

    // Throttle: don't check more than once per 30 seconds
    const now = Date.now();
    if (now - lastCheckRef.current < 30000) return;

    isCheckingRef.current = true;
    lastCheckRef.current = now;

    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("accessToken") : null;
      if (!token) {
        setIsAuthorized(false);
        router.replace("/auth");
        return;
      }

      const me = await UserService.me(true);
      setCurrentUser(me);

      // Check if user is still admin - update isAuthorized state and redirect immediately
      if (!me?.isAdmin) {
        setIsAuthorized(false);
        // Redirect immediately - don't wait
        redirectToPrevious();
        return;
      }

      // Ensure isAuthorized is true if user is admin
      setIsAuthorized(true);
    } catch (error: any) {
      setCurrentUser(null);

      if (error?.status === HTTP_STATUS.UNAUTHORIZED) {
        setIsAuthorized(false);
        router.replace("/auth");
        return;
      }
      if (error?.status === HTTP_STATUS.FORBIDDEN) {
        setIsAuthorized(false);
        redirectToPrevious();
        return;
      }
      // For other errors, don't redirect - might be temporary network issues
      // But still update isAuthorized if we can't verify
      setIsAuthorized(false);
    } finally {
      isCheckingRef.current = false;
    }
  }, [router, setCurrentUser, redirectToPrevious]);

  // Initial mount check - with loading state
  useEffect(() => {
    // Prevent running multiple times
    if (hasRunRef.current) return;
    hasRunRef.current = true;

    let isMounted = true;
    setIsLoading(true);

    const token = typeof window !== "undefined" ? localStorage.getItem("accessToken") : null;
    if (!token) {
      router.replace("/auth");
      return;
    }

    // Force refresh user data by clearing cache first, then fetching fresh data
    setCurrentUser(null);
    UserService.me(true)
      .then((me) => {
        if (!isMounted) return;
        // Update the cached user data with fresh data
        setCurrentUser(me);

        if (!me?.isAdmin) {
          redirectToPrevious();
          return;
        }
        setIsAuthorized(true);
        setIsLoading(false);
        // Update last check time for initial mount
        lastCheckRef.current = Date.now();
      })
      .catch((error: any) => {
        if (!isMounted) return;
        // Clear user data on auth errors
        setCurrentUser(null);

        if (error?.status === HTTP_STATUS.UNAUTHORIZED) {
          router.replace("/auth");
          return;
        }
        if (error?.status === HTTP_STATUS.FORBIDDEN) {
          redirectToPrevious();
          return;
        }
        redirectToPrevious();
      });

    return () => {
      isMounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run once on mount - use ref to prevent re-runs

  // Background check on window focus (when user returns to tab)
  useEffect(() => {
    if (!isAuthorized) return; // Only check if already authorized

    const handleFocus = () => {
      checkAuthSilently();
    };

    window.addEventListener("focus", handleFocus);
    return () => {
      window.removeEventListener("focus", handleFocus);
    };
  }, [isAuthorized, checkAuthSilently]);

  // Periodic background check (every 5 minutes)
  useEffect(() => {
    if (!isAuthorized) return; // Only check if already authorized

    const interval = setInterval(() => {
      checkAuthSilently();
    }, 5 * 60 * 1000); // 5 minutes

    return () => {
      clearInterval(interval);
    };
  }, [isAuthorized, checkAuthSilently]);

  // Background check on route changes (throttled)
  useEffect(() => {
    if (!isAuthorized) return; // Only check if already authorized

    // Throttle route change checks - only if last check was more than 30 seconds ago
    const now = Date.now();
    if (now - lastCheckRef.current >= 30000) {
      checkAuthSilently();
    }
  }, [pathname, isAuthorized, checkAuthSilently]);

  // Immediately redirect if user loses authorization
  useEffect(() => {
    if (!isLoading && !isAuthorized) {
      // User is no longer authorized - redirect immediately
      redirectToPrevious();
    }
  }, [isLoading, isAuthorized, redirectToPrevious]);

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
        <div className="block md:hidden">
          <Mobile>{children}</Mobile>
        </div>

        <div className="hidden md:block lg:hidden">
          <Tablet>{children}</Tablet>
        </div>

        <div className="hidden lg:block">
          <Desktop>{children}</Desktop>
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

function Tablet({ children }: { children: React.ReactNode }) {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(true);
  const sidebarRef = useRef<HTMLDivElement>(null);

  // Handle click outside to collapse sidebar on tablets
  useEffect(() => {
    // Only add listener when sidebar is expanded
    if (isSidebarCollapsed) return;

    const handleClickOutside = (event: MouseEvent | TouchEvent) => {
      // Only collapse if click is outside sidebar
      if (
        sidebarRef.current &&
        !sidebarRef.current.contains(event.target as Node)
      ) {
        setIsSidebarCollapsed(true);
      }
    };

    // Add listeners for both mouse and touch events
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("touchstart", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
    };
  }, [isSidebarCollapsed]);

  return (
    <div className="flex min-h-screen gap-3 bg-neutral-50 pl-4 md:pl-6">
      <div
        ref={sidebarRef}
        className={clsx(
          "sticky top-0 h-screen overflow-y-auto transition-all duration-300 z-10 flex-shrink-0",
          isSidebarCollapsed ? "w-[80px]" : "w-[280px]"
        )}
      >
        <Sidebar
          isOpen={true}
          onClose={() => {}}
          isCollapsed={isSidebarCollapsed}
          onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
        />
      </div>
      <div className="flex w-full flex-1 flex-col gap-3 p-4 min-w-0 overflow-hidden">
        <div className="w-full max-w-screen-3xl space-y-3 mx-auto min-w-0">
          <Header onMenuClick={() => {}} />
          {children}
        </div>
      </div>
    </div>
  );
}

function Desktop({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen gap-5 bg-neutral-50 pl-6 lg:pl-10">
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
