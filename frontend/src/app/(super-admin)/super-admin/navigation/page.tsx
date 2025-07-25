"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function NavigationPage() {
  const router = useRouter();

  useEffect(() => {
    router.push("/super-admin/navigation/edit");
  }, [router]);

  return <div>در حال انتقال به صفحه ویرایش ناوبری...</div>;
}
