import { Metadata } from 'next';

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
  siteName: 'Infinity Color',
  siteUrl: process.env.NEXT_PUBLIC_SITE_URL || 'https://infinitycolor.org',
  defaultImage: '/images/og-default.jpg',
  twitterHandle: '@infinitycolor',
};

export function generateBlogPostMetadata(
  post: BlogPostSEO,
  config: SEOConfig = defaultSEOConfig
): Metadata {
  const title = post.metaTitle || post.title;
  const description = post.metaDescription || post.excerpt || `Read ${post.title} on ${config.siteName}`;
  const url = `${config.siteUrl}/${post.slug}`;
  const imageUrl = post.featuredImage?.url
    ? `${process.env.NEXT_PUBLIC_IMAGE_BASE_URL}${post.featuredImage.url}`
    : `${config.siteUrl}${config.defaultImage}`;

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
  const title = `Blog | ${config.siteName}`;
  const description = `Explore our latest articles, tutorials, and insights on ${config.siteName}`;
  const url = `${config.siteUrl}/blog`;

  return {
    title,
    description,

    openGraph: {
      type: 'website',
      title,
      description,
      url,
      siteName: config.siteName,
      images: [
        {
          url: `${config.siteUrl}${config.defaultImage}`,
          width: 1200,
          height: 630,
          alt: `${config.siteName} Blog`,
        },
      ],
    },

    twitter: {
      card: 'summary_large_image',
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
    ? `${process.env.NEXT_PUBLIC_IMAGE_BASE_URL}${post.featuredImage.url}`
    : `${config.siteUrl}${config.defaultImage}`;

  return {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: post.title,
    description: post.metaDescription || post.excerpt,
    image: imageUrl,
    url: `${config.siteUrl}/${post.slug}`,
    datePublished: post.publishedAt,
    dateModified: post.updatedAt,
    author: post.author ? {
      '@type': 'Person',
      name: post.author.Name,
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
    articleSection: post.category?.Name,
    keywords: post.keywords,
  };
}
