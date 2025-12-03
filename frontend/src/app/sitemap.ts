import type { MetadataRoute } from 'next'
import { API_BASE_URL, ENDPOINTS } from '@/constants/api'
import logger from '@/utils/logger'

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://new.infinitycolor.co'

interface StrapiProduct {
  id: number
  attributes: {
    Title: string
    slug?: string
    Slug?: string
    updatedAt: string
  }
}

interface StrapiResponse {
  data: StrapiProduct[]
  meta?: {
    pagination?: {
      total: number
      pageCount: number
      page: number
      pageSize: number
    }
  }
}

interface BlogPost {
  id: number
  Slug: string
  PublishedAt?: string
  updatedAt: string
}

interface BlogCategory {
  id: number
  Slug: string
  updatedAt: string
}

/**
 * Fetch all active products from the backend API
 * Handles pagination to get all products regardless of count
 */
async function getAllProducts(): Promise<StrapiProduct[]> {
  const allProducts: StrapiProduct[] = []
  let currentPage = 1
  const pageSize = 100 // Fetch 100 at a time

  try {
    while (true) {
      const endpoint = `${ENDPOINTS.PRODUCT.PRODUCT}?` +
        `filters[Status][$eq]=Active&` +
        `filters[removedAt][$null]=true&` +
        `pagination[page]=${currentPage}&` +
        `pagination[pageSize]=${pageSize}&` +
        `fields[0]=Title&` +
        `fields[1]=Slug&` +
        `fields[2]=updatedAt`

      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        next: { revalidate: 3600 }, // Cache for 1 hour
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
      }).then(res => res.json())

      const data = response as StrapiResponse
      const products = data?.data || []

      if (products.length === 0) break

      allProducts.push(...products)

      const pageCount = data?.meta?.pagination?.pageCount || 1
      if (currentPage >= pageCount) break

      currentPage++
    }

    logger.info(`[Sitemap] Fetched ${allProducts.length} active products for sitemap`)
    return allProducts
  } catch (error: string | Error | any) {
    logger.error('[Sitemap] Error fetching products:', error)
    return []
  }
}

/**
 * Fetch all published blog posts from the backend API
 */
async function getAllBlogPosts(): Promise<BlogPost[]> {
  const allPosts: BlogPost[] = []
  let currentPage = 1
  const pageSize = 100

  try {
    while (true) {
      const endpoint = `${API_BASE_URL}/blog-posts?` +
        `filters[Status][$eq]=Published&` +
        `pagination[page]=${currentPage}&` +
        `pagination[pageSize]=${pageSize}&` +
        `fields[0]=Slug&` +
        `fields[1]=PublishedAt&` +
        `fields[2]=updatedAt`

      const response = await fetch(endpoint, {
        next: { revalidate: 3600 },
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
      }).then(res => res.json())

      const posts = response?.data || []
      if (posts.length === 0) break

      allPosts.push(...posts.map((post: any) => ({
        id: post.id,
        Slug: post.attributes?.Slug || post.attributes?.slug || post.Slug || post.slug,
        PublishedAt: post.attributes?.PublishedAt || post.attributes?.publishedAt || post.PublishedAt,
        updatedAt: post.attributes?.updatedAt || post.updatedAt,
      })))

      const pageCount = response?.meta?.pagination?.pageCount || 1
      if (currentPage >= pageCount) break

      currentPage++
    }

    logger.info(`[Sitemap] Fetched ${allPosts.length} blog posts for sitemap`)
    return allPosts
  } catch (error: string | Error | any) {
    logger.error('[Sitemap] Error fetching blog posts:', error)
    return []
  }
}

/**
 * Fetch all blog categories from the backend API
 */
async function getAllBlogCategories(): Promise<BlogCategory[]> {
  try {
    const endpoint = `${API_BASE_URL}/blog-categories?` +
      `pagination[pageSize]=100&` +
      `fields[0]=Slug&` +
      `fields[1]=updatedAt`

    const response = await fetch(endpoint, {
      next: { revalidate: 3600 },
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
    }).then(res => res.json())

    const categories = (response?.data || []).map((cat: any) => ({
      id: cat.id,
      Slug: cat.attributes?.Slug || cat.Slug,
      updatedAt: cat.attributes?.updatedAt || cat.updatedAt,
    }))

    logger.info(`[Sitemap] Fetched ${categories.length} blog categories for sitemap`)
    return categories
  } catch (error: string | Error | any) {
    logger.error('[Sitemap] Error fetching blog categories:', error)
    return []
  }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // Fetch all data in parallel
  const [products, blogPosts, blogCategories] = await Promise.all([
    getAllProducts(),
    getAllBlogPosts(),
    getAllBlogCategories(),
  ])

  // Calculate total URL count
  const totalUrls = 1 + // Homepage
    1 + // PLP
    1 + // Categories
    1 + // Blog listing
    products.length +
    blogPosts.length +
    blogCategories.length +
    1 // Cart

  // Note: If totalUrls exceeds 50,000, consider implementing sitemap index
  // Next.js 16 supports sitemap index by returning an array of sitemap objects
  // For now, we return a single sitemap (Next.js handles up to 50,000 URLs efficiently)
  if (totalUrls > 50000) {
    logger.warn(`[Sitemap] Total URLs (${totalUrls}) exceeds 50,000. Consider implementing sitemap index.`)
  }

  // Build sitemap entries
  const sitemap: MetadataRoute.Sitemap = [
    // Homepage
    {
      url: BASE_URL,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1.0,
    },

    // PLP (Product List Page)
    {
      url: `${BASE_URL}/plp`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.9,
    },

    // Categories page
    {
      url: `${BASE_URL}/categories`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.9,
    },

    // Blog listing page
    {
      url: `${BASE_URL}/blog`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.8,
    },

    // Product Detail Pages (PDPs) - use slug when available, fallback to ID
    ...products.map((product) => {
      const slug = product.attributes?.slug || product.attributes?.Slug
      const urlPath = slug ? `/pdp/${slug}` : `/pdp/${product.id}`
      return {
        url: `${BASE_URL}${urlPath}`,
        lastModified: new Date(product.attributes.updatedAt),
        changeFrequency: 'weekly' as const,
        priority: 0.8,
      }
    }),

    // Blog post pages
    ...blogPosts.map((post) => ({
      url: `${BASE_URL}/${post.Slug}`,
      lastModified: post.PublishedAt ? new Date(post.PublishedAt) : new Date(post.updatedAt),
      changeFrequency: 'monthly' as const,
      priority: 0.7,
    })),

    // Blog category pages
    ...blogCategories.map((category) => ({
      url: `${BASE_URL}/blog?category=${category.Slug}`,
      lastModified: new Date(category.updatedAt),
      changeFrequency: 'weekly' as const,
      priority: 0.6,
    })),

    // Other static pages (noindex pages excluded)
    {
      url: `${BASE_URL}/cart`,
      lastModified: new Date(),
      changeFrequency: 'never' as const,
      priority: 0.5,
    },
  ]

  return sitemap
}
