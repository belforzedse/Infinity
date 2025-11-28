import { Metadata } from 'next';

/**
 * Sanitizes user-controlled strings for safe JSON-LD injection
 * Prevents XSS by escaping closing script tags and angle brackets
 */
function sanitizeForJSONLD(value: string | undefined | null): string | undefined {
  if (!value) return undefined;
  
  return String(value)
    .replace(/<\/script>/gi, '<\\/script>') // Escape closing script tags
    .replace(/</g, '\\u003C') // Escape opening angle brackets
    .replace(/>/g, '\\u003E'); // Escape closing angle brackets
}

/**
 * Builds an absolute image URL with proper fallback
 * Ensures valid absolute URLs in all environments
 */
function buildImageUrl(imagePath: string, config: SEOConfig): string {
  // Use IMAGE_BASE_URL if available, otherwise fallback to siteUrl
  const baseUrl = process.env.NEXT_PUBLIC_IMAGE_BASE_URL || config.siteUrl;
  
  // Remove trailing slash from base URL
  const cleanBase = baseUrl.replace(/\/$/, '');
  
  // Ensure image path starts with a slash
  const cleanPath = imagePath.startsWith('/') ? imagePath : `/${imagePath}`;
  
  return `${cleanBase}${cleanPath}`;
}

export interface BlogPostSEO {
  title: string;
  slug: string;
  excerpt?: string;
  metaTitle?: string;
  metaDescription?: string;
  keywords?: string;
  featuredImage?: {
    url: string;
    alternativeText?: string;
    width?: number;
    height?: number;
  };
  author?: {
    Name: string;
  };
  category?: {
    Name: string;
  };
  publishedAt?: string;
  updatedAt?: string;
}

export interface SEOConfig {
  siteName: string;
  siteUrl: string;
  defaultImage: string;
  twitterHandle?: string;
}

const defaultSEOConfig: SEOConfig = {
  siteName: "فروشگاه اینفینیتی",
  siteUrl: process.env.NEXT_PUBLIC_SITE_URL || "https://infinitycolor.org",
  defaultImage: "/images/og-default.jpg",
  twitterHandle: "@infinitycolor",
};

export function generateBlogPostMetadata(
  post: BlogPostSEO,
  config: SEOConfig = defaultSEOConfig
): Metadata {
  const title = post.metaTitle || post.title;
  const description =
    post.metaDescription ||
    post.excerpt ||
    `مطالعه «${post.title}» در ${config.siteName}`;
  const url = `${config.siteUrl}/${post.slug}`;
  const imageUrl = post.featuredImage?.url
    ? buildImageUrl(post.featuredImage.url, config)
    : buildImageUrl(config.defaultImage, config);

  const metadata: Metadata = {
    title: `${title} | ${config.siteName}`,
    description,
    keywords: post.keywords,
    authors: post.author ? [{ name: post.author.Name }] : undefined,
    category: post.category?.Name,

    // Open Graph
    openGraph: {
      type: 'article',
      title,
      description,
      url,
      siteName: config.siteName,
      images: [
        {
          url: imageUrl,
          width: post.featuredImage?.width || 1200,
          height: post.featuredImage?.height || 630,
          alt: post.featuredImage?.alternativeText || post.title,
        },
      ],
      publishedTime: post.publishedAt,
      modifiedTime: post.updatedAt,
      authors: post.author ? [post.author.Name] : undefined,
      section: post.category?.Name,
    },

    // Twitter Card
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [imageUrl],
      creator: config.twitterHandle,
      site: config.twitterHandle,
    },

    // Additional metadata
    alternates: {
      canonical: url,
    },

    // Robots
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        'max-video-preview': -1,
        'max-image-preview': 'large',
        'max-snippet': -1,
      },
    },
  };

  return metadata;
}

export function generateBlogListingMetadata(
  config: SEOConfig = defaultSEOConfig
): Metadata {
  const title = `وبلاگ | ${config.siteName}`;
  const description = `آخرین مقالات، آموزش‌ها و بینش‌های ${config.siteName} را در این بخش بخوانید.`;
  const url = `${config.siteUrl}/blog`;

  return {
    title,
    description,

    openGraph: {
      type: "website",
      title,
      description,
      url,
      siteName: config.siteName,
      images: [
        {
          url: `${config.siteUrl}${config.defaultImage}`,
          width: 1200,
          height: 630,
          alt: `${config.siteName} | وبلاگ`,
        },
      ],
    },

    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [`${config.siteUrl}${config.defaultImage}`],
      creator: config.twitterHandle,
      site: config.twitterHandle,
    },

    alternates: {
      canonical: url,
    },

    robots: {
      index: true,
      follow: true,
    },
  };
}

export function generateJSONLD(post: BlogPostSEO, config: SEOConfig = defaultSEOConfig) {
  const imageUrl = post.featuredImage?.url
    ? buildImageUrl(post.featuredImage.url, config)
    : buildImageUrl(config.defaultImage, config);

  // Sanitize all user-controlled fields to prevent XSS
  const sanitizedTitle = sanitizeForJSONLD(post.title);
  const sanitizedDescription = sanitizeForJSONLD(post.metaDescription || post.excerpt);
  const sanitizedAuthorName = sanitizeForJSONLD(post.author?.Name);
  const sanitizedCategoryName = sanitizeForJSONLD(post.category?.Name);
  const sanitizedKeywords = sanitizeForJSONLD(post.keywords);

  return {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: sanitizedTitle,
    description: sanitizedDescription,
    image: imageUrl,
    url: `${config.siteUrl}/${post.slug}`,
    datePublished: post.publishedAt,
    dateModified: post.updatedAt,
    author: sanitizedAuthorName ? {
      '@type': 'Person',
      name: sanitizedAuthorName,
    } : undefined,
    publisher: {
      '@type': 'Organization',
      name: config.siteName,
      logo: {
        '@type': 'ImageObject',
        url: `${config.siteUrl}/images/logo.png`,
      },
    },
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': `${config.siteUrl}/${post.slug}`,
    },
    articleSection: sanitizedCategoryName,
    keywords: sanitizedKeywords,
  };
}
