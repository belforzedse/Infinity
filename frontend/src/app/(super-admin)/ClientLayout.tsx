"use client";

import Header from "@/components/SuperAdmin/Layout/Header";
import Sidebar from "@/components/SuperAdmin/Layout/Sidebar";
import ScrollToTop from "@/components/ScrollToTop";
import { Suspense, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { UserService } from "@/services";
import { HTTP_STATUS } from "@/constants/api";

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();

  useEffect(() => {
    const token = typeof window !== "undefined" ? localStorage.getItem("accessToken") : null;
    if (!token) {
      router.replace("/auth");
      return;
    }

    const redirectToPrevious = () => {
      if (typeof window !== "undefined" && window.history.length > 1) {
        router.back();
      } else {
        router.replace("/");
      }
    };

    UserService.me(true)
      .then((me) => {
        if (!me?.isAdmin) {
          redirectToPrevious();
        }
      })
      .catch((error) => {
        if (error?.status === HTTP_STATUS.UNAUTHORIZED) {
          router.replace("/auth");
          return;
        }
        redirectToPrevious();
      });
  }, [router]);

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
        <Header onMenuClick={() => {}} />
        {children}
      </div>
    </div>
  );
}
