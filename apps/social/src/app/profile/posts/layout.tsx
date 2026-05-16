"use client";

import type { ReactNode } from "react";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import SuspenseLoader from "@/components/ui/SuspenseLoader";
import { useCurrentUser } from "@/hooks/use-current-user";

export default function ProfilePostsLayout({ children }: { children: ReactNode }) {
  const router = useRouter();
  const { isLoading, canCreatePost } = useCurrentUser();

  useEffect(() => {
    if (!isLoading && !canCreatePost) {
      router.replace("/profile");
    }
  }, [canCreatePost, isLoading, router]);

  if (isLoading || !canCreatePost) {
    return <SuspenseLoader />;
  }

  return children;
}
