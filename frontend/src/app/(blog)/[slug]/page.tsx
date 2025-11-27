import React from "react";
import { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import BlogPostDetail from "@/components/Blog/BlogPostDetail";
import BlogComments from "@/components/Blog/BlogComments";
import { blogService, BlogTag } from "@/services/blog/blog.service";
import { generateBlogPostMetadata, generateJSONLD } from "@/utils/seo";
import { IMAGE_BASE_URL } from "@/constants/api";
import { User, FolderOpen, Tag } from "lucide-react";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const runtime = "nodejs";

interface BlogPostPageProps {
  params: {
    slug: string;
  };
}

// Generate metadata for SEO
export async function generateMetadata({ params }: BlogPostPageProps): Promise<Metadata> {
  const { slug } = await params;

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
      category: post.blog_category,
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
  let post;

  try {
    const response = await blogService.getBlogPostBySlug(slug);
    post = response.data;
  } catch (error) {
    notFound();
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
    category: post.blog_category,
    publishedAt: post.PublishedAt,
    updatedAt: post.updatedAt,
  });

  const getAvatarUrl = (url?: string) => {
    if (!url) return null;
    if (url.startsWith("http")) return url;
    return `${IMAGE_BASE_URL}${url}`;
  };

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
            {/* Main Content */}
            <div className="lg:col-span-3">
              <BlogPostDetail post={post} />

              {/* Comments Section */}
              <div className="mt-12">
                <BlogComments postId={post.id} />
              </div>
            </div>

            {/* Sidebar */}
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
                            {post.blog_author.Name.charAt(0)}
                          </span>
                        </div>
                      )}
                      <div>
                        <h4 className="font-medium text-neutral-900">{post.blog_author.Name}</h4>
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
          </div>
        </div>
      </div>
    </>
  );
}
