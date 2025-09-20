"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import ConfirmDialog from "@/components/Kits/ConfirmDialog";

export default function SuperAdminLogoutPage() {
  const router = useRouter();
  const [showConfirm, setShowConfirm] = useState(false);

  useEffect(() => {
    setShowConfirm(true);
  }, []);

  const handleLogout = useCallback(() => {
    try {
      if (typeof window !== "undefined") {
        localStorage.removeItem("accessToken");
        localStorage.removeItem("refreshToken");
      }
    } finally {
      router.replace("/auth");
    }
  }, [router]);

  const handleCancel = useCallback(() => {
    setShowConfirm(false);
    router.replace("/super-admin");
  }, [router]);

  return (
    <div className="flex min-h-[50vh] items-center justify-center">
      <ConfirmDialog
        isOpen={showConfirm}
        title="خروج از حساب کاربری"
        description="آیا از خروج از حساب کاربری خود مطمئن هستید؟"
        confirmText="بله، خارج شو"
        cancelText="انصراف"
        onConfirm={handleLogout}
        onCancel={handleCancel}
      />
    </div>
  );
}
