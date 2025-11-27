/**
 * Blog utility functions for author name resolution and other blog-related helpers
 */

/**
 * Resolves the display name for a blog author from user_info with fallbacks
 * @param blogAuthor - The blog author object with potential user relations
 * @returns The resolved author name
 */
export function resolveBlogAuthorName(blogAuthor: any): string {
  if (!blogAuthor) {
    return "نویسنده اینفینیتی";
  }

  // Try to get name from linked users-permissions user's user_info
  const userInfo = blogAuthor.users_permissions_user?.user_info;
  if (userInfo && (userInfo.FirstName || userInfo.LastName)) {
    const firstName = userInfo.FirstName?.trim() || "";
    const lastName = userInfo.LastName?.trim() || "";
    const fullName = [firstName, lastName].filter(Boolean).join(" ").trim();
    if (fullName) {
      return fullName;
    }
  }

  // Fallback to blog_author.Name field
  if (blogAuthor.Name?.trim()) {
    return blogAuthor.Name.trim();
  }

  // Fallback to username from users-permissions user (but not email)
  const user = blogAuthor.users_permissions_user;
  if (user && user.username?.trim()) {
    return user.username.trim();
  }

  // Final fallback
  return "نویسنده اینفینیتی";
}

/**
 * Enriches a blog post object with resolved author names
 * @param blogPost - The blog post object to enrich
 * @returns The enriched blog post with resolved author name
 */
export function enrichBlogPostWithAuthorName(blogPost: any): any {
  if (!blogPost) {
    return blogPost;
  }

  if (blogPost.blog_author) {
    const resolvedName = resolveBlogAuthorName(blogPost.blog_author);
    blogPost.blog_author = {
      ...blogPost.blog_author,
      ResolvedName: resolvedName, // Add as separate field, don't override Name
    };
  }

  return blogPost;
}

/**
 * Enriches multiple blog posts with resolved author names
 * @param blogPosts - Array of blog post objects to enrich
 * @returns Array of enriched blog posts with resolved author names
 */
export function enrichBlogPostsWithAuthorNames(blogPosts: any[]): any[] {
  if (!Array.isArray(blogPosts)) {
    return blogPosts;
  }

  return blogPosts.map(enrichBlogPostWithAuthorName);
}
