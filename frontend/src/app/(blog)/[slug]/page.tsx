import React from "react";
import { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import BlogPostDetail from "@/components/Blog/BlogPostDetail";
import BlogComments from "@/components/Blog/BlogComments";
import { blogService, BlogTag } from "@/services/blog/blog.service";
import { generateBlogPostMetadata, generateJSONLD } from "@/utils/seo";
import { IMAGE_BASE_URL, API_BASE_URL } from "@/constants/api";
import { User, FolderOpen, Tag } from "lucide-react";
import { resolveBlogAuthorDisplayName } from "@/utils/blogAuthorName";
import logger from "@/utils/logger";

// Use on-demand revalidation (triggered by Strapi lifecycle hooks)
// Fallback to 1 hour if revalidation API is not called
// This ensures pages stay fresh even if webhook fails
export const revalidate = 3600; // 1 hour fallback (on-demand is primary)

// Allow dynamic generation of blog posts not in generateStaticParams
// This ensures ISR can generate pages on-demand even if build-time generation failed
// CRITICAL: This allows routes to be generated at request time if they weren't pre-generated
// during build. This is essential for staging environments where build-time API calls might fail.
export const dynamicParams = true;

interface BlogPostPageProps {
  params: Promise<{
    slug: string;
  }>;
}

// Patterns that should NOT be handled as blog posts
const EXCLUDED_PATTERNS = [
  /\.(html|xml|json|txt|ico|png|jpg|jpeg|gif|svg|webp|css|js|woff|woff2|ttf|eot)$/i, // Static files
  /^_next/, // Next.js internal routes
  /^api\//, // API routes
  /^offline/, // Service worker offline page
  /^sw\.js/, // Service worker
  /^manifest/, // Web app manifest
  /^robots\.txt/, // Robots file
  /^sitemap/, // Sitemap
  /^favicon/, // Favicon
  /^(login|register|auth|signin|signup|logout|forgot-password|reset-password)$/i, // Auth routes
  /^super-admin/, // Admin routes
  /^user\//, // User routes
  /^orders/, // Order routes
  /^cart/, // Cart routes
  /^checkout/, // Checkout routes
  /^products/, // Product listing routes
  /^categories/, // Category routes
  /^search/, // Search routes
];

function shouldExcludeSlug(slug: string): boolean {
  return EXCLUDED_PATTERNS.some(pattern => pattern.test(slug));
}

/**
 * Generate static params for published blog posts
 * Pre-generates all published posts at build time for better SEO
 * Falls back to ISR if build-time generation fails (staging-safe)
 */
export async function generateStaticParams() {
  const env = process.env.NODE_ENV || 'development';
  const isStaging = process.env.NEXT_PUBLIC_SITE_URL?.includes('staging') || env === 'production';

  try {
    const allPosts: Array<{ slug: string }> = [];
    let currentPage = 1;
    const pageSize = 100;

    logger.info(`[generateStaticParams] Starting static params generation`, {
      env,
      isStaging,
      API_BASE_URL: API_BASE_URL || 'NOT_SET',
      hasApiBaseUrl: !!API_BASE_URL,
    });

    // Validate API_BASE_URL is set
    if (!API_BASE_URL || API_BASE_URL === 'undefined') {
      logger.error('[generateStaticParams] API_BASE_URL is not configured', {
        API_BASE_URL,
        envVar: process.env.NEXT_PUBLIC_API_BASE_URL,
        env,
      });
      logger.warn('[generateStaticParams] Returning empty array. ISR will handle blog post generation.');
      return [];
    }

    while (true) {
      const endpoint = `${API_BASE_URL}/blog-posts?` +
        `filters[Status][$eq]=Published&` +
        `pagination[page]=${currentPage}&` +
        `pagination[pageSize]=${pageSize}&` +
        `fields[0]=Slug`;

      logger.info(`[generateStaticParams] Fetching page ${currentPage}`, {
        endpoint: endpoint.replace(API_BASE_URL, '[API_BASE_URL]'),
        isStaging,
      });

      let fetchResponse: Response;
      try {
        fetchResponse = await fetch(endpoint, {
          next: { revalidate: 3600 }, // Cache for 1 hour
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
          },
        });
      } catch (fetchError) {
        logger.error('[generateStaticParams] Network error during fetch', {
          error: fetchError instanceof Error ? fetchError.message : String(fetchError),
          endpoint: endpoint.replace(API_BASE_URL, '[API_BASE_URL]'),
          isStaging,
          API_BASE_URL: API_BASE_URL || 'NOT_SET',
        });
        // If first page fails, return empty to let ISR handle it
        if (currentPage === 1) {
          logger.warn('[generateStaticParams] First page network error, returning empty array. ISR will handle posts.');
          return [];
        }
        // If later page fails, break and return what we have
        break;
      }

      if (!fetchResponse.ok) {
        const errorText = await fetchResponse.text().catch(() => 'Unable to read error response');
        logger.error(
          `[generateStaticParams] API request failed: ${fetchResponse.status} ${fetchResponse.statusText}`,
          {
            endpoint: endpoint.replace(API_BASE_URL, '[API_BASE_URL]'),
            status: fetchResponse.status,
            statusText: fetchResponse.statusText,
            errorText: errorText.slice(0, 500),
            isStaging,
            currentPage,
          }
        );
        // If first page fails, return empty to let ISR handle it
        if (currentPage === 1) {
          logger.warn('[generateStaticParams] First page failed, returning empty array. ISR will handle posts.');
          return [];
        }
        // If later page fails, break and return what we have
        break;
      }

      let response: any;
      try {
        response = await fetchResponse.json();
      } catch (parseError) {
        logger.error('[generateStaticParams] Failed to parse JSON response', {
          error: parseError instanceof Error ? parseError.message : String(parseError),
          status: fetchResponse.status,
          isStaging,
        });
        if (currentPage === 1) return [];
        break;
      }

      // Validate response structure
      if (!response || typeof response !== 'object') {
        logger.error('[generateStaticParams] Invalid response structure', {
          responseType: typeof response,
          hasData: !!response?.data,
          isStaging,
        });
        if (currentPage === 1) return [];
        break;
      }

      const posts = response?.data || [];
      if (posts.length === 0) {
        logger.info(`[generateStaticParams] No posts found on page ${currentPage}, stopping pagination`);
        break;
      }

      const validPosts = posts
        .map((post: any) => {
          const slug = post.attributes?.Slug || post.Slug || post.id?.toString();
          if (!slug) {
            logger.warn('[generateStaticParams] Post missing slug', { postId: post.id, post });
            return null;
          }
          return { slug };
        })
        .filter((post: { slug: string } | null): post is { slug: string } => post !== null);

      allPosts.push(...validPosts);

      const pageCount = response?.meta?.pagination?.pageCount || 1;
      logger.info(`[generateStaticParams] Page ${currentPage}/${pageCount}, total posts so far: ${allPosts.length}`);

      if (currentPage >= pageCount) break;

      currentPage++;
    }

    logger.info(`[generateStaticParams] Successfully generated ${allPosts.length} static params for blog posts`, {
      totalPosts: allPosts.length,
      isStaging,
      sampleSlugs: allPosts.slice(0, 5).map(p => p.slug),
    });

    if (allPosts.length === 0) {
      logger.warn('[generateStaticParams] No static params generated. This may cause 404s until ISR generates pages.', {
        isStaging,
        API_BASE_URL: API_BASE_URL || 'NOT_SET',
      });
    }

    return allPosts;
  } catch (error) {
    logger.error('[generateStaticParams] Error generating static params for blog:', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      API_BASE_URL: API_BASE_URL || 'NOT_SET',
      env,
      isStaging,
    });
    // Return empty array on error - ISR will handle remaining posts
    logger.warn('[generateStaticParams] Returning empty array. ISR will handle blog post generation.', {
      isStaging,
    });
    return [];
  }
}

// Generate metadata for SEO
export async function generateMetadata({ params }: BlogPostPageProps): Promise<Metadata> {
  const { slug } = await params;

  // Exclude non-blog routes early to prevent API calls
  if (shouldExcludeSlug(slug)) {
    return {
      title: "صفحه یافت نشد | وبلاگ فروشگاه اینفینیتی",
      description: "صفحه مورد نظر یافت نشد.",
    };
  }

  try {
    const { data: post } = await blogService.getBlogPostBySlug(slug);

    return generateBlogPostMetadata({
      title: post.Title,
      slug: post.Slug,
      excerpt: post.Excerpt,
      metaTitle: post.MetaTitle,
      metaDescription: post.MetaDescription,
      keywords: post.Keywords,
      featuredImage: post.FeaturedImage,
      author: post.blog_author,
      category: post.blog_category?.Name ? { Name: post.blog_category.Name } : undefined,
      publishedAt: post.PublishedAt,
      updatedAt: post.updatedAt,
    });
  } catch (error) {
    return {
      title: "پست یافت نشد | وبلاگ فروشگاه اینفینیتی",
      description: "پست مورد نظر یافت نشد.",
    };
  }
}


export default async function BlogPostPage({ params }: BlogPostPageProps) {
  const { slug } = await params;
  const env = process.env.NODE_ENV || 'development';
  const isStaging = process.env.NEXT_PUBLIC_SITE_URL?.includes('staging') || env === 'production';

  // Exclude static files and other non-blog routes
  if (shouldExcludeSlug(slug)) {
    logger.info(`[BlogPostPage] Excluding slug from blog post handling`, {
      slug,
      reason: 'Matches excluded pattern',
      env,
      isStaging,
    });
    notFound();
    return;
  }

  logger.info(`[BlogPostPage] Route handler called`, {
    slug,
    env,
    isStaging,
    API_BASE_URL: API_BASE_URL || 'NOT_SET',
    hasApiBaseUrl: !!API_BASE_URL,
    timestamp: new Date().toISOString(),
  });

  let post;

  // Validate API_BASE_URL before attempting fetch
  if (!API_BASE_URL || API_BASE_URL === 'undefined') {
    logger.error(`[BlogPostPage] API_BASE_URL is not configured`, {
      slug,
      API_BASE_URL,
      envVar: process.env.NEXT_PUBLIC_API_BASE_URL,
      env,
      isStaging,
    });
    logger.error(`[BlogPostPage] Calling notFound() due to missing API_BASE_URL`);
    notFound();
    return;
  }

  try {
    logger.info(`[BlogPostPage] Fetching blog post with slug: ${slug}`, {
      slug,
      API_BASE_URL: API_BASE_URL || 'NOT_SET',
      env,
      isStaging,
    });

    // Add timeout to prevent hanging requests
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

    let response;
    try {
      response = await blogService.getBlogPostBySlug(slug);
      clearTimeout(timeoutId);
    } catch (fetchError) {
      clearTimeout(timeoutId);
      // If it's a timeout or network error, return 404 instead of crashing
      if (fetchError instanceof Error && (fetchError.name === 'AbortError' || fetchError.message.includes('timeout'))) {
        logger.error(`[BlogPostPage] Request timeout for slug: ${slug}`, {
          slug,
          error: fetchError.message,
        });
        notFound();
        return;
      }
      throw fetchError; // Re-throw other errors
    }

    if (!response || !response.data) {
      logger.error(`[BlogPostPage] Invalid response structure for slug: ${slug}`, {
        response: response ? { hasData: !!response.data, hasMeta: !!response.meta } : 'null',
        env,
        isStaging,
      });
      logger.error(`[BlogPostPage] Calling notFound() due to invalid response structure`);
      notFound();
      return;
    }

    post = response.data;
    logger.info(`[BlogPostPage] Successfully fetched blog post`, {
      slug,
      postId: post.id,
      title: post.Title || 'NO_TITLE',
      env,
      isStaging,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    const isNotFoundError = errorMessage.includes('not found') || errorMessage.includes('404');

    logger.error(`[BlogPostPage] Error fetching blog post with slug: ${slug}`, {
      error: errorMessage,
      stack: error instanceof Error ? error.stack : undefined,
      API_BASE_URL: API_BASE_URL || 'NOT_SET',
      slug,
      env,
      isStaging,
      isNotFoundError,
      errorType: error instanceof Error ? error.constructor.name : typeof error,
    });

    logger.error(`[BlogPostPage] Calling notFound() due to fetch error: ${errorMessage}`);
    notFound();
    return;
  }

  // Generate JSON-LD structured data
  const jsonLd = generateJSONLD({
    title: post.Title,
    slug: post.Slug,
    excerpt: post.Excerpt,
    metaTitle: post.MetaTitle,
    metaDescription: post.MetaDescription,
    keywords: post.Keywords,
    featuredImage: post.FeaturedImage,
    author: post.blog_author,
    category: post.blog_category?.Name ? { Name: post.blog_category.Name } : undefined,
    publishedAt: post.PublishedAt,
    updatedAt: post.updatedAt,
  });

  const getAvatarUrl = (url?: string) => {
    if (!url) return null;
    if (url.startsWith("http")) return url;
    return `${IMAGE_BASE_URL}${url}`;
  };

  const authorDisplayName = resolveBlogAuthorDisplayName(post.blog_author);
  const authorInitial = authorDisplayName.trim().charAt(0) || "ن";

  return (
    <>
      {/* JSON-LD Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <div className="min-h-screen bg-slate-50 py-8" dir="rtl">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-4">
            <div className="lg:col-span-1">
              <div className="sticky top-8 space-y-6">
                {/* Author Info */}
                {post.blog_author && (
                  <div className="rounded-2xl  bg-white p-5 shadow-sm">
                    <div className="mb-4 flex items-center gap-2">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100">
                        <User className="h-4 w-4 text-slate-500" />
                      </div>
                      <h3 className="text-sm font-medium text-neutral-800">درباره نویسنده</h3>
                    </div>
                    <div className="flex items-start gap-4">
                      {post.blog_author.Avatar?.url ? (
                        <img
                          src={getAvatarUrl(post.blog_author.Avatar.url) || ""}
                          alt={post.blog_author.Name}
                          className="h-14 w-14 rounded-full object-cover"
                        />
                      ) : (
                        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-pink-100">
                          <span className="text-lg font-medium text-pink-600">
                            {authorInitial}
                          </span>
                        </div>
                      )}
                      <div>
                        <h4 className="font-medium text-neutral-900">
                          {authorDisplayName}
                        </h4>
                        {post.blog_author.Bio && (
                          <p className="mt-1 text-sm text-neutral-600 line-clamp-3">
                            {post.blog_author.Bio}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Category */}
                {post.blog_category && (
                  <div className="rounded-2xl bg-white p-5 shadow-sm">
                    <div className="mb-4 flex items-center gap-2">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100">
                        <FolderOpen className="h-4 w-4 text-slate-500" />
                      </div>
                      <h3 className="text-sm font-medium text-neutral-800">دسته‌بندی</h3>
                    </div>
                    <Link
                      href={`/blog?category=${post.blog_category.Slug}`}
                      className="inline-flex items-center gap-2 rounded-xl bg-pink-50 px-4 py-2 text-sm font-medium text-pink-700 transition-colors hover:bg-pink-100"
                    >
                      <FolderOpen className="h-4 w-4" />
                      {post.blog_category.Name}
                    </Link>
                  </div>
                )}

                {/* Tags */}
                {post.blog_tags && post.blog_tags.length > 0 && (
                  <div className="rounded-2xl bg-white p-5 shadow-sm">
                    <div className="mb-4 flex items-center gap-2">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100">
                        <Tag className="h-4 w-4 text-slate-500" />
                      </div>
                      <h3 className="text-sm font-medium text-neutral-800">برچسب‌ها</h3>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {post.blog_tags.map((tag: BlogTag) => (
                        <Link
                          key={tag.id}
                          href={`/blog?tag=${tag.Slug}`}
                          className="rounded-full bg-slate-100 px-3 py-1 text-xs text-neutral-600 transition-colors hover:bg-slate-200"
                          style={tag.Color ? { backgroundColor: `${tag.Color}15`, color: tag.Color } : {}}
                        >
                          #{tag.Name}
                        </Link>
                      ))}
                    </div>
                  </div>
                )}

                {/* Back to Blog */}
                <Link
                  href="/blog"
                  className="flex items-center justify-center gap-2 rounded-2xl bg-white p-4 text-sm font-medium text-neutral-700 shadow-sm transition-colors hover:bg-slate-50"
                >
                  بازگشت به وبلاگ
                </Link>
              </div>
            </div>
            {/* Main Content */}
            <div className="lg:col-span-3">
              <BlogPostDetail post={post} />

              {/* Comments Section */}
              <div className="mt-12">
                <BlogComments postId={post.id} />
              </div>
            </div>

            {/* Sidebar */}

          </div>
        </div>
      </div>
    </>
  );
}
