import type { BlogComment } from "@/services/blog/blog.service";

function extractUserInfo(user?: BlogComment["user"]) {
  const candidate = user?.user_info;
  if (!candidate) {
    return null;
  }

  if (candidate.data?.attributes) {
    return candidate.data.attributes;
  }

  if (candidate.attributes) {
    return candidate.attributes;
  }

  return candidate;
}

export function resolveBlogCommentUserDisplayName(
  user?: BlogComment["user"],
  fallbackName?: string
): string {
  if (fallbackName?.trim()) {
    return fallbackName.trim();
  }

  if (!user) return "کاربر ناشناس";

  const normalizedInfo = extractUserInfo(user);
  const firstName = normalizedInfo?.FirstName?.trim() || "";
  const lastName = normalizedInfo?.LastName?.trim() || "";
  const fullName = [firstName, lastName].filter(Boolean).join(" ").trim();

  if (fullName) {
    return fullName;
  }

  const username = user.username?.trim();
  if (username) {
    return username;
  }

  const email = user.email?.trim();
  if (email) {
    return email;
  }

  return "کاربر ناشناس";
}
