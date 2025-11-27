"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, BookOpen } from "lucide-react";
import BlogCard from "./BlogCard";
import BlogCardMobile from "./BlogCardMobile";
import BlogPagination from "./BlogPagination";
import { blogService, BlogPost } from "@/services/blog/blog.service";

interface BlogCarouselProps {
  /** Pre-fetched posts - if not provided, will fetch based on category */
  posts?: BlogPost[];
  /** Category slug for filtering - if provided, fetches posts from this category */
  category?: string;
  /** Section title */
  title: string;
  /** Custom href for view all link */
  viewAllHref?: string;
  /** If true, shows "مشاهده دسته بندی" instead of "مشاهده همه" */
  isCategory?: boolean;
  /** Additional CSS classes */
  className?: string;
}

const BlogCarousel: React.FC<BlogCarouselProps> = ({
  posts: initialPosts,
  category,
  title,
  viewAllHref,
  isCategory = false,
  className = "",
}) => {
  const [posts, setPosts] = useState<BlogPost[]>(initialPosts || []);
  const [loading, setLoading] = useState(!initialPosts && !!category);
  const [currentPage, setCurrentPage] = useState(0);
  const [isMobile, setIsMobile] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Fetch posts if category is provided and no initial posts
  useEffect(() => {
    if (category && !initialPosts) {
      const fetchCategoryPosts = async () => {
        try {
          setLoading(true);
          const response = await blogService.getBlogPosts({
            pageSize: 8,
            status: "Published",
            category: category,
            sort: "PublishedAt:desc",
          });
          setPosts(response.data || []);
        } catch (error) {
          console.error("Error fetching category posts:", error);
          setPosts([]);
        } finally {
          setLoading(false);
        }
      };
      fetchCategoryPosts();
    }
  }, [category, initialPosts]);

  // Update posts when initialPosts changes
  useEffect(() => {
    if (initialPosts) {
      setPosts(initialPosts);
    }
  }, [initialPosts]);

  // Check if we're on mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Desktop: 4 posts per page, Mobile: show 4 small cards
  const postsPerPage = 4;
  const totalPages = Math.ceil(posts.length / postsPerPage);
  const displayPosts = isMobile ? posts.slice(0, 4) : posts;
  const currentPosts = isMobile
    ? displayPosts
    : displayPosts.slice(currentPage * postsPerPage, (currentPage + 1) * postsPerPage);

  const nextPage = () => {
    setCurrentPage((prev) => (prev + 1) % totalPages);
  };

  const prevPage = () => {
    setCurrentPage((prev) => (prev - 1 + totalPages) % totalPages);
  };

  const goToPage = (page: number) => {
    setCurrentPage(page);
  };

  // Generate view all href
  const getViewAllHref = () => {
    if (viewAllHref) return viewAllHref;
    if (category) return `/blog?category=${category}`;
    return "/blog";
  };

  // Get button text
  const viewAllText = isCategory ? "مشاهده دسته بندی" : "مشاهده همه";

  // Loading state
  if (loading) {
    return (
      <section className={`w-full ${className}`}>
        <div className="flex items-center justify-between mb-3">
          <div className="h-8 w-48 bg-neutral-200 rounded animate-pulse" />
          <div className="h-6 w-32 bg-neutral-200 rounded animate-pulse" />
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="aspect-[304/260] rounded-[20px] bg-neutral-200 mb-2" />
              <div className="h-4 bg-neutral-200 rounded w-3/4 mb-2" />
              <div className="h-12 bg-neutral-200 rounded" />
            </div>
          ))}
        </div>
      </section>
    );
  }

  if (!posts || posts.length === 0) {
    return null;
  }

  return (
    <section className={`w-full ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        {/* Title */}
        <div className="flex items-center gap-2">
          {title === "اینفینیتی مگ" && (
            <BookOpen className="h-5 w-5 md:h-6 md:w-6 text-pink-600" />
          )}
          <h2 className="text-xl md:text-2xl font-medium text-neutral-800 leading-[1.24]">{title}</h2>
        </div>

        {/* Right Side - Navigation and View All */}
        <div className="flex items-center gap-4">
          {/* Desktop Navigation - only show if more than one page */}
          {totalPages > 1 && (
            <div className="hidden md:block">
              <BlogPagination
                total={totalPages}
                current={currentPage}
                onPageChange={goToPage}
                onNext={nextPage}
                onPrev={prevPage}
              />
            </div>
          )}

          {/* View All Link */}
          <Link
            href={getViewAllHref()}
            className="flex items-center gap-1 text-sm font-normal text-neutral-600 transition-colors hover:text-pink-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-pink-500 focus-visible:ring-offset-2"
          >
            <ArrowLeft className="h-4 w-4 md:h-5 md:w-5" />
            <span>{viewAllText}</span>
          </Link>
        </div>
      </div>

      {/* Desktop Carousel */}
      <div className="hidden md:block">
        <div
          ref={scrollRef}
          className="grid grid-cols-2 lg:grid-cols-4 gap-2 md:gap-3 transition-all duration-300 ease-out"
        >
          {currentPosts.map((post, index) => (
            <div
              key={post.id}
              className="transform transition-all duration-200 ease-out hover:-translate-y-1 flex justify-center"
            >
              <BlogCard post={post} priority={index === 0} />
            </div>
          ))}
        </div>
      </div>

      {/* Mobile Grid */}
      <div className="block md:hidden">
        <div className="flex flex-col gap-4 items-center">
          {currentPosts.map((post, index) => (
            <div key={post.id} className="w-full flex justify-center">
              <BlogCardMobile post={post} priority={index === 0} />
            </div>
          ))}
        </div>

        {/* Mobile View All Button - only show if there are more posts */}
        {posts.length > 4 && (
          <div className="mt-6 flex items-center justify-center">
            <Link
              href={getViewAllHref()}
              className="flex items-center gap-2 rounded-full border-2 border-pink-100 bg-white px-6 py-3 text-sm font-medium text-neutral-800 transition-colors hover:bg-pink-50 hover:text-pink-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-pink-500 focus-visible:ring-offset-2"
            >
              <span>{viewAllText}</span>
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </div>
        )}
      </div>
    </section>
  );
};

export default BlogCarousel;
