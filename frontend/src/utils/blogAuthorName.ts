/**
 * Utility function to resolve blog author display name
 * Uses the same pattern as other admin interfaces (orders, users, etc.)
 */

import type { BlogAuthor } from "@/services/blog/blog.service";

export function resolveBlogAuthorDisplayName(author?: BlogAuthor | null): string {
  if (!author) return " - ";

  // Try to get name from users_permissions_user.user_info (same as other admin interfaces)
  // Handle both normalized structure and raw API response structure
  let userInfo = author.users_permissions_user?.user_info;
  
  // If user_info is wrapped in data.attributes (raw API response)
  if (!userInfo && author.users_permissions_user) {
    const upUserData = (author.users_permissions_user as any)?.data;
    const upUserAttrs = upUserData?.attributes || upUserData;
    const userInfoData = upUserAttrs?.user_info?.data;
    userInfo = userInfoData?.attributes || userInfoData || upUserAttrs?.user_info;
  }
  
  const firstName = userInfo?.FirstName ?? "";
  const lastName = userInfo?.LastName ?? "";
  const fullName = `${firstName} ${lastName}`.trim();

  // Fallback to blog_author.Name if no user_info
  return fullName || author.Name || " - ";
}
