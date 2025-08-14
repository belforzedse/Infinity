"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function SuperAdminLogoutPage() {
  const router = useRouter();

  useEffect(() => {
    try {
      if (typeof window !== "undefined") {
        localStorage.removeItem("accessToken");
        localStorage.removeItem("refreshToken");
      }
    } finally {
      router.replace("/auth");
    }
  }, [router]);

  return (
    <div className="min-h-[50vh] flex items-center justify-center text-neutral-600 text-sm">
      در حال خروج...
    </div>
  );
}


