"use client";

import React from "react";
import DOMPurify from "isomorphic-dompurify";
import { parseProductShortcodes } from "@/utils/blogShortcodes";
import BlogProductCarousel from "./BlogProductCarousel";

interface BlogContentRendererProps {
  content: string;
}

/**
 * Renders blog content with shortcode support
 * Parses [products:...] shortcodes and replaces them with carousel components
 */
const BlogContentRenderer: React.FC<BlogContentRendererProps> = ({ content }) => {
  // Parse shortcodes from content
  const shortcodes = parseProductShortcodes(content);

  if (shortcodes.length === 0) {
    // No shortcodes, render normally
    return (
      <div
        className="prose prose-md prose-neutral max-w-none prose-headings:font-bold prose-headings:text-neutral-900 prose-h1:text-4xl prose-h2:text-2xl prose-h3:text-xl prose-h4:text-md prose-p:text-neutral-700 prose-a:text-pink-600 prose-a:no-underline hover:prose-a:underline prose-pre:bg-slate-900 prose-img:rounded-xl"
        dangerouslySetInnerHTML={{
          __html: DOMPurify.sanitize(content),
        }}
        dir="rtl"
      />
    );
  }

  // Split content into segments (text and shortcodes)
  const segments: Array<{ type: "html" | "shortcode"; content: string; shortcode?: any }> = [];
  let lastIndex = 0;

  // Sort shortcodes by position
  const sortedShortcodes = [...shortcodes].sort((a, b) => a.startIndex - b.startIndex);

  sortedShortcodes.forEach((shortcode) => {
    // Add HTML segment before shortcode
    if (shortcode.startIndex > lastIndex) {
      const htmlSegment = content.slice(lastIndex, shortcode.startIndex);
      if (htmlSegment.trim()) {
        segments.push({ type: "html", content: htmlSegment });
      }
    }

    // Add shortcode segment
    segments.push({
      type: "shortcode",
      content: shortcode.originalMatch,
      shortcode,
    });

    lastIndex = shortcode.endIndex;
  });

  // Add remaining HTML after last shortcode
  if (lastIndex < content.length) {
    const htmlSegment = content.slice(lastIndex);
    if (htmlSegment.trim()) {
      segments.push({ type: "html", content: htmlSegment });
    }
  }

  // If no segments before first shortcode, add empty HTML segment
  if (sortedShortcodes.length > 0 && sortedShortcodes[0].startIndex === 0) {
    segments.unshift({ type: "html", content: "" });
  }

  return (
    <div
      className="prose-lg prose-h4:text-md prose prose-neutral max-w-none prose-headings:font-bold prose-headings:text-neutral-900 prose-h1:text-4xl prose-h2:text-2xl prose-h3:text-xl prose-p:text-neutral-700 prose-a:text-pink-600 prose-a:no-underline hover:prose-a:underline prose-pre:bg-slate-900 prose-img:rounded-xl"
      dir="rtl"
    >
      {segments.map((segment, index) => {
        if (segment.type === "html") {
          return (
            <div
              key={`html-${index}`}
              dangerouslySetInnerHTML={{
                __html: DOMPurify.sanitize(segment.content),
              }}
            />
          );
        } else {
          return (
            <BlogProductCarousel
              key={`shortcode-${index}`}
              identifiers={segment.shortcode.identifiers}
            />
          );
        }
      })}
    </div>
  );
};

export default BlogContentRenderer;

