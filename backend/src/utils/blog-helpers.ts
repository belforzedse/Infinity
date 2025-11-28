/**
 * Blog utility functions for author name resolution and other blog-related helpers
 */

/**
 * Determine a display name for a blog author entity from Strapi.
 *
 * @param blogAuthor - The Strapi `blog_author` entity (may be `null`/`undefined`)
 * @returns The resolved author name. Prefers `Name`, then `DisplayName`, `Title`, `slug`, then the linked user's `username`; returns `نویسنده اینفینیتی` if none are available.
 */
export function resolveBlogAuthorName(blogAuthor: any): string {
  if (!blogAuthor) {
    return "نویسنده اینفینیتی";
  }

  if (blogAuthor.Name?.trim()) {
    return blogAuthor.Name.trim();
  }

  const fallbackTitle =
    blogAuthor.DisplayName?.trim() ||
    blogAuthor.Title?.trim() ||
    blogAuthor.slug?.trim();
  if (fallbackTitle) {
    return fallbackTitle;
  }

  const user = blogAuthor.users_permissions_user;
  if (user && typeof user === "object" && user.username?.trim()) {
    return user.username.trim();
  }

  return "نویسنده اینفینیتی";
}

/**
 * Resolve a user's display name from a user object.
 *
 * Prefers a full name composed from `user.user_info` (checks `data.attributes`, `attributes`, or the object directly),
 * then `user.username`, then `user.email`; falls back to the Persian string `کاربر ناشناس` when no name is available.
 *
 * @param user - The user object which may contain nested `user_info`, `username`, or `email` fields.
 * @returns The resolved display name: the concatenated `FirstName` and `LastName` if present, otherwise `username`, otherwise `email`, otherwise `کاربر ناشناس`.
 */
export function resolveUserDisplayName(user: any): string {
  if (!user) {
    return "کاربر ناشناس";
  }

  const userInfo =
    user.user_info?.data?.attributes ||
    user.user_info?.attributes ||
    user.user_info;

  if (userInfo) {
    const firstName = (userInfo.FirstName || "").trim();
    const lastName = (userInfo.LastName || "").trim();
    const fullName = [firstName, lastName].filter(Boolean).join(" ").trim();
    if (fullName) {
      return fullName;
    }
  }

  if (user.username?.trim()) {
    return user.username.trim();
  }

  if (user.email?.trim()) {
    return user.email.trim();
  }

  return "کاربر ناشناس";
}

/**
 * Attach a resolved author display name to a blog post's `blog_author` object.
 *
 * @param blogPost - Blog post object to enrich; if falsy it is returned unchanged
 * @returns The same `blogPost` object. When `blogPost.blog_author` exists, it will include a `ResolvedAuthorName` property with the resolved author name (existing fields are preserved)
 */
export function enrichBlogPostWithAuthorName(blogPost: any): any {
  if (!blogPost) {
    return blogPost;
  }

  if (blogPost.blog_author) {
    const resolvedName = resolveBlogAuthorName(blogPost.blog_author);
    blogPost.blog_author = {
      ...blogPost.blog_author,
      ResolvedAuthorName: resolvedName, // Add as separate field, don't override Name
    };
  }

  return blogPost;
}

/**
 * Add resolved author names to each blog post in the provided array.
 *
 * @param blogPosts - The array of blog post objects to enrich; if the argument is not an array, it is returned unchanged.
 * @returns The same array with each post transformed so that, when available, `blog_author` contains a `ResolvedAuthorName` property.
 */
export function enrichBlogPostsWithAuthorNames(blogPosts: any[]): any[] {
  if (!Array.isArray(blogPosts)) {
    return blogPosts;
  }

  return blogPosts.map(enrichBlogPostWithAuthorName);
}