import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export default async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Security headers for SEO and performance
  const response = NextResponse.next();

  // Add security and performance headers
  response.headers.set('X-DNS-Prefetch-Control', 'on');
  response.headers.set('X-Frame-Options', 'SAMEORIGIN');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');

  // Permissions-Policy (formerly Feature-Policy) - safe security improvement
  response.headers.set(
    'Permissions-Policy',
    'camera=(), microphone=(), geolocation=(), interest-cohort=()'
  );

  // Cache control for static assets
  // Note: /_next/static and /api/ are excluded by matcher, so cache-control for those paths is handled by Next.js
  if (
    pathname.startsWith('/images/') ||
    pathname.startsWith('/fonts/')
  ) {
    response.headers.set(
      'Cache-Control',
      'public, max-age=31536000, immutable'
    );
  }

  // Handle trailing slashes - redirect to non-trailing slash for SEO
  if (pathname !== '/' && pathname.endsWith('/')) {
    const url = request.nextUrl.clone();
    url.pathname = pathname.slice(0, -1);
    return NextResponse.redirect(url, 301);
  }

  // Clean up empty category parameter in PLP - redirect /plp?category= to /plp
  if (pathname === '/plp') {
    const searchParams = request.nextUrl.searchParams;
    const category = searchParams.get('category');

    // If category param exists but is empty or just whitespace, remove it
    if (category !== null && category.trim() === '') {
      const url = request.nextUrl.clone();
      url.searchParams.delete('category');
      return NextResponse.redirect(url, 301); // Permanent redirect to clean URL
    }
  }

  // Redirect ID-based product URLs to slug-based URLs (SEO canonicalization)
  // Pattern: /pdp/123 → /pdp/product-slug
  if (pathname.startsWith('/pdp/')) {
    const segments = pathname.split('/');
    const identifier = segments[2]; // e.g., "123" or "product-slug"

    // Check if identifier is numeric (ID-based URL)
    if (identifier && /^\d+$/.test(identifier)) {
      try {
        // Fetch product slug from API
        const productId = identifier;
        const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://api.new.infinitycolor.co/api';
        const apiUrl = `${apiBaseUrl}/products/${productId}?fields[0]=Slug`;

        const apiResponse = await fetch(apiUrl, {
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
          },
          next: { revalidate: 86400 }, // Cache for 24 hours
        });

        if (apiResponse.ok) {
          const data = await apiResponse.json();
          const slug = data?.data?.attributes?.Slug;

          if (slug) {
            const url = request.nextUrl.clone();
            url.pathname = `/pdp/${slug}`;
            return NextResponse.redirect(url, 301); // Permanent redirect
          }
        }
      } catch (error) {
        // Log error but don't block request - let it pass through
        console.error('[Middleware] Error redirecting ID-based URL:', error);
      }
    }
  }

  // Redirect www to non-www (or vice versa) if needed
  // Uncomment and adjust if you have a preference
  // const hostname = request.headers.get('host') || '';
  // if (hostname.startsWith('www.')) {
  //   const url = request.nextUrl.clone();
  //   url.hostname = hostname.replace('www.', '');
  //   return NextResponse.redirect(url, 301);
  // }

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes) - excluded because Next.js handles API route caching
     * - _next/static (static files) - excluded because Next.js handles static file caching
     * - _next/image (image optimization files) - excluded for performance
     * - favicon.ico (favicon file) - excluded for performance
     *
     * Cache-control headers for excluded paths are handled by Next.js automatically.
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};

