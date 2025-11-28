import type { MetadataRoute } from 'next'

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://infinitycolor.org'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/admin',
          '/super-admin',
          '/account',
          '/api',
          '/_next',
          '/*.json$',
          '/cart',
          '/checkout',
          '/orders',
          '/payment',
        ],
      },
      {
        userAgent: 'Googlebot',
        allow: '/',
        disallow: [
          '/admin',
          '/super-admin',
          '/account',
          '/api',
          '/_next',
          '/*.json$',
          '/cart',
          '/checkout',
          '/orders',
          '/payment',
        ],
      },
    ],
    sitemap: `${BASE_URL}/sitemap.xml`,
  }
}


