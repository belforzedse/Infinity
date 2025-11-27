/**
 * Blog utility functions for author name resolution and other blog-related helpers
 */

/**
 * Resolves the display name for a blog author directly from the blog_author entity
 * @param blogAuthor - The blog author object returned from Strapi
 * @returns The resolved author name
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
      ResolvedAuthorName: resolvedName, // Add as separate field, don't override Name
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
