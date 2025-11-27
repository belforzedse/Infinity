"use client";

import React from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import BlurImage from "@/components/ui/BlurImage";
import imageLoader from "@/utils/imageLoader";

interface BlogCategoryBannerProps {
  /** Banner title */
  title: string;
  /** Banner subtitle/description */
  subtitle?: string;
  /** Background image URL */
  backgroundImage?: string;
  /** Background color (used if no image) */
  backgroundColor?: string;
  /** Link to category page */
  href: string;
  /** Link text */
  linkText?: string;
  /** Text color - 'light' for dark backgrounds, 'dark' for light backgrounds */
  textColor?: "light" | "dark";
  /** Banner height */
  height?: "sm" | "md" | "lg";
  /** Additional CSS classes */
  className?: string;
}

const heightClasses = {
  sm: "h-[200px] md:h-[240px]",
  md: "h-[280px] md:h-[320px]",
  lg: "h-[360px] md:h-[420px]",
};

const BlogCategoryBanner: React.FC<BlogCategoryBannerProps> = ({
  title,
  subtitle,
  backgroundImage,
  backgroundColor = "bg-gradient-to-br from-pink-100 to-pink-200",
  href,
  linkText = "مقالات بیشتر",
  textColor = "dark",
  height = "md",
  className = "",
}) => {
  const textColorClasses = textColor === "light"
    ? "text-white"
    : "text-neutral-800";

  const subtitleColorClasses = textColor === "light"
    ? "text-white/90"
    : "text-neutral-600";

  const linkColorClasses = textColor === "light"
    ? "text-white hover:text-white/80 border-white/30 hover:border-white/50"
    : "text-neutral-700 hover:text-pink-600 border-neutral-300 hover:border-pink-300";

  return (
    <div
      className={`relative w-full overflow-hidden rounded-[32px] ${heightClasses[height]} ${className}`}
    >
      {/* Background */}
      {backgroundImage ? (
        <BlurImage
          src={backgroundImage}
          alt={title}
          fill
          className="object-cover"
          sizes="100vw"
          loader={imageLoader}
        />
      ) : (
        <div className={`absolute inset-0 ${backgroundColor}`} />
      )}

      {/* Overlay for better text readability */}
      {backgroundImage && (
        <div className="absolute inset-0 bg-black/20" />
      )}

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center justify-center h-full px-6 text-center">
        <h2 className={`text-2xl md:text-4xl font-bold mb-2 ${textColorClasses}`}>
          {title}
        </h2>

        {subtitle && (
          <p className={`text-sm md:text-base mb-6 max-w-md ${subtitleColorClasses}`}>
            {subtitle}
          </p>
        )}

        <Link
          href={href}
          className={`inline-flex items-center gap-2 px-6 py-2.5 rounded-full border-2 text-sm font-medium transition-all duration-200 ${linkColorClasses}`}
        >
          <ArrowLeft className="h-4 w-4" />
          <span>{linkText}</span>
        </Link>
      </div>
    </div>
  );
};

export default BlogCategoryBanner;
