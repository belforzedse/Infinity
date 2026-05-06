"use client";

import React from "react";
import PublishingPanel from "./PublishingPanel";
import CategoryTagsPanel from "./CategoryTagsPanel";
import FeaturedImagePanel, { FeaturedImageValue } from "./FeaturedImagePanel";
import PermalinkPanel from "./PermalinkPanel";
import type { BlogCategory, BlogTag } from "@/services/blog/blog.service";

export interface BlogSidebarProps {
  // Publishing
  status: "Draft" | "Published" | "Scheduled";
  onStatusChange: (status: "Draft" | "Published" | "Scheduled") => void;
  visibility?: "public" | "private";
  onVisibilityChange?: (visibility: "public" | "private") => void;
  publishedAt?: string;
  onPublishedAtChange?: (date: string) => void;
  onPublish: () => void;
  onSaveDraft: () => void;
  onPreview?: () => void;
  isLoading?: boolean;

  // Permalink
  slug?: string;
  slugError?: string;
  onSlugChange?: (slug: string) => void;
  onUseSuggestedSlug?: () => void;

  // Category
  selectedCategory?: number;
  onCategoryChange: (categoryId: number | undefined) => void;
  categories: BlogCategory[];
  onAddCategory?: (name: string, parentId?: number) => Promise<void>;

  // Featured Image
  featuredImage?: FeaturedImageValue;
  onFeaturedImageChange: (value: FeaturedImageValue | undefined) => void;
  onUploadImage?: () => void;

  // Tags
  selectedTags: number[];
  onTagsChange: (tagIds: number[]) => void;
  tags: BlogTag[];
  onAddTag?: (name: string) => Promise<void>;
}

export default function BlogSidebar({
  status,
  onStatusChange,
  visibility = "public",
  onVisibilityChange,
  publishedAt,
  onPublishedAtChange,
  onPublish,
  onSaveDraft,
  onPreview,
  isLoading = false,
  slug,
  slugError,
  onSlugChange,
  onUseSuggestedSlug,
  selectedCategory,
  onCategoryChange,
  categories,
  onAddCategory,
  featuredImage,
  onFeaturedImageChange,
  onUploadImage,
  selectedTags,
  onTagsChange,
  tags,
  onAddTag,
}: BlogSidebarProps) {
  return (
    <div className="sticky top-5 flex flex-col gap-3">
      {/* Permalink Panel */}
      <PermalinkPanel
        slug={slug || ""}
        error={slugError}
        onSlugChange={onSlugChange}
        onUseSuggestedSlug={onUseSuggestedSlug}
      />

      {/* Publishing Panel */}
      <PublishingPanel
        status={status}
        onStatusChange={onStatusChange}
        visibility={visibility}
        onVisibilityChange={onVisibilityChange}
        publishedAt={publishedAt}
        onPublishedAtChange={onPublishedAtChange}
        onPublish={onPublish}
        onSaveDraft={onSaveDraft}
        onPreview={onPreview}
        isLoading={isLoading}
      />

      {/* Category & Tags Panel */}
      <CategoryTagsPanel
        selectedCategory={selectedCategory}
        onCategoryChange={onCategoryChange}
        categories={categories}
        onAddCategory={onAddCategory}
        selectedTags={selectedTags}
        onTagsChange={onTagsChange}
        tags={tags}
        onAddTag={onAddTag}
      />

      {/* Featured Image Panel */}
      <FeaturedImagePanel
        featuredImage={featuredImage}
        onFeaturedImageChange={onFeaturedImageChange}
        onUploadImage={onUploadImage}
      />
    </div>
  );
}


