import type { ProductReview } from "@/services/product/product-review.service";

function extractUserInfo(user?: ProductReview["user"]) {
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

export function resolveProductReviewUserDisplayName(
  user?: ProductReview["user"],
  fallbackPhone?: string
): string {
  if (!user) return fallbackPhone || "کاربر ناشناس";

  const normalizedInfo = extractUserInfo(user);
  const firstName = normalizedInfo?.FirstName?.trim() || "";
  const lastName = normalizedInfo?.LastName?.trim() || "";
  const fullName = [firstName, lastName].filter(Boolean).join(" ").trim();

  if (fullName) {
    return fullName;
  }

  if (user.Phone) {
    // Format phone number to mask middle digits for privacy
    const phone = user.Phone.trim();
    if (phone.length > 7) {
      return `${phone.slice(0, 4)}***${phone.slice(-4)}`;
    }
    return phone;
  }

  const username = user.username?.trim();
  if (username) {
    return username;
  }

  return fallbackPhone || "کاربر ناشناس";
}

