import type { MetadataRoute } from 'next'
import { API_BASE_URL, ENDPOINTS } from '@/constants/api'
import logger from '@/utils/logger'

interface StrapiProduct {
  id: number
  attributes: {
    Title: string
    slug?: string
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
        `pagination[page]=${currentPage}&` +
        `pagination[pageSize]=${pageSize}&` +
        `fields[0]=Title&` +
        `fields[1]=updatedAt`

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

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'https://infinitycolor.org'

  // Fetch all products
  const products = await getAllProducts()

  // Build sitemap entries
  const sitemap: MetadataRoute.Sitemap = [
    // Homepage
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1,
    },

    // PLP (Product List Page) - Main category
    {
      url: `${baseUrl}/plp`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.9,
    },

    // Product Detail Pages (PDPs)
    ...products.map((product) => ({
      url: `${baseUrl}/pdp/${product.id}`,
      lastModified: new Date(product.attributes.updatedAt),
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    })),

    // Other static pages
    {
      url: `${baseUrl}/cart`,
      lastModified: new Date(),
      changeFrequency: 'never',
      priority: 0.7,
    },
  ]

  return sitemap
}
