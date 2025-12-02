  "use client";

  import React from "react";
  import Link from "next/link";
  import Image from "next/image";
  import { ArrowLeft } from "lucide-react";
  import imageLoader from "@/utils/imageLoader";

  interface BlogCategoryBannerProps {
    title: string;
    subtitle?: string;
    backgroundImage?: string;
    href: string;
    linkText?: string;

    textColor?: string;
    linkColor?: string;
    subtitleColor?: string;

    height?: "sm" | "md" | "lg";
    className?: string;
  }

  const heightClasses = {
    sm: "h-[200px] md:h-[240px]",
    md: "h-[340px] md:h-[380px]",
    lg: "h-[300px] md:h-[490px]",
  };

  const BlogCategoryBanner: React.FC<BlogCategoryBannerProps> = ({
    title,
    subtitle,
    backgroundImage,
    href,
    linkText = "مشاهده مقالات",
    textColor,
    linkColor,
    subtitleColor,
    height = "lg",
    className = "",
  }) => {
  const textColorClasses = textColor ?? "text-neutral-800";
  const subtitleColorClasses = subtitleColor ?? "text-neutral-600";
  const linkColorClasses = linkColor ?? "text-neutral-800";




    return (
      <div
        className={`relative w-full overflow-hidden rounded-2xl ${heightClasses[height]} ${className}`}
      >
        {/* Background Image */}
        {backgroundImage && (
          <Image
            src={backgroundImage}
            alt={title}
            fill
            loader={imageLoader}
            sizes="100vw"
            className="scale-105 object-cover"
          />
        )}

        {/* Global dark overlay */}
        <div className="absolute inset-0 bg-black/10 " />

        {/* Content */}
        <div className="relative z-10 flex h-full flex-col items-start justify-center px-6 text-right md:px-24">
          <h2 className={`mb-3 text-3xl leading-snug md:text-[66px] ${textColorClasses}`}>
            {title}
          </h2>

          {subtitle && (
            <p className={`text-md mb-6 max-w-xl md:text-[30px] ${subtitleColorClasses}`}>
              {subtitle}
            </p>
          )}

          <Link
            href={href}
            className={`inline-flex items-center gap-2 rounded-full px-6 py-2.5 text-sm font-medium backdrop-blur-md transition-all duration-200 ${linkColorClasses}`}
          >
            {linkText}
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </div>
      </div>
    );
  };

  export default BlogCategoryBanner;
