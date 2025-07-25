"use client";

import Header from "@/components/SuperAdmin/Layout/Header";
import Sidebar from "@/components/SuperAdmin/Layout/Sidebar";
import { Suspense, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function SuperAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();

  useEffect(() => {
    if (!localStorage.getItem("accessToken")) {
      router.push("/auth");
    }
  }, []);

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
    </>
  );
}

function Mobile({ children }: { children: React.ReactNode }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  return (
    <div className="bg-neutral-50 p-4 min-h-screen">
      <div className="w-full flex flex-col gap-4">
        <Header onMenuClick={() => setIsSidebarOpen(!isSidebarOpen)} />
        <Sidebar
          isOpen={isSidebarOpen}
          onClose={() => setIsSidebarOpen(false)}
        />
        {children}
      </div>
    </div>
  );
}

function Desktop({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-neutral-50 flex gap-5 pl-10 min-h-screen">
      <div className="w-[250px]">
        <Sidebar isOpen={true} onClose={() => {}} />
      </div>
      <div className="w-full flex-1 flex flex-col lg:gap-7 gap-4 p-4">
        <Header onMenuClick={() => {}} />
        {children}
      </div>
    </div>
  );
}
