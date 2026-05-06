import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useCurrentUser } from "@/hooks/useCurrentUser";

/**
 * Hook to redirect editor role users away from restricted pages
 * @param redirectTo - The path to redirect to (default: "/super-admin/blog")
 */
export const useEditorRedirect = (redirectTo: string = "/super-admin/blog") => {
  const router = useRouter();
  const { roleName } = useCurrentUser();

  useEffect(() => {
    const normalizedRole = (roleName ?? "").toLowerCase().trim();
    if (normalizedRole === "editor") {
      router.replace(redirectTo);
    }
  }, [roleName, router, redirectTo]);
};

