"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function NavigationPage() {
  const router = useRouter();

  useEffect(() => {
    router.push("/super-admin/customization/navbar");
  }, [router]);

  return <div>در حال انتقال به صفحه سفارشی‌سازی ناوبری...</div>;
}
