/**
 * Utility function to resolve blog author display name
 * Uses the same pattern as other admin interfaces (orders, users, etc.)
 */

import type { BlogAuthor } from "@/services/blog/blog.service";

function unwrapAuthor(author?: BlogAuthor | null) {
  if (!author) return null;
  if ((author as any).data?.attributes) {
    return { ...(author as any).data.attributes, id: (author as any).data.id };
  }
  return author;
}

export function resolveBlogAuthorDisplayName(author?: BlogAuthor | null): string {
  const normalized = unwrapAuthor(author);
  if (!normalized) return " - ";

  const resolvedName =
    normalized.ResolvedAuthorName?.trim() ||
    normalized.ResolvedName?.trim() ||
    normalized.Name?.trim() ||
    normalized.DisplayName?.trim() ||
    normalized.Title?.trim();

  if (resolvedName) {
    return resolvedName;
  }

  const username = normalized.users_permissions_user?.username?.trim();
  if (username) {
    return username;
  }

  const email = normalized.users_permissions_user?.email?.trim();
  if (email) {
    return email;
  }

  return normalized.slug || " - ";
}
