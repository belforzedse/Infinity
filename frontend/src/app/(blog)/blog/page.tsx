import React from "react";
import { Metadata } from "next";
import BlogList from "@/components/Blog/BlogList";
import { generateBlogListingMetadata } from "@/utils/seo";

export const metadata: Metadata = generateBlogListingMetadata();

export default function BlogPage() {
  return (
    <div className="min-h-screen bg-slate-50" dir="rtl">
      {/* Hero Section */}
      <div className="bg-gradient-to-b from-pink-50 to-slate-50 py-16">
        <div className="container mx-auto px-4 text-center">
          <h1 className="mb-4 text-4xl font-bold text-neutral-900 md:text-5xl">
            وبلاگ فروشگاه اینفینیتی
          </h1>
          <p className="mx-auto max-w-2xl text-lg text-neutral-600">
            آخرین مقالات، آموزش‌ها و بینش‌های ما را در زمینه رنگ، طراحی و دکوراسیون کشف کنید
          </p>
        </div>
      </div>

      {/* Blog Content */}
      <div className="container mx-auto px-4 py-12">
        <BlogList />
      </div>
    </div>
  );
}
