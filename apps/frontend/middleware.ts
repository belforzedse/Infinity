import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export const LEGACY_REDIRECT_STATUS = 301;

const PRIVATE_ROUTE_PREFIXES = [
  '/account',
  '/addresses',
  '/cart',
  '/checkout',
  '/favorites',
  '/orders',
  '/password',
  '/payment',
  '/privileges',
  '/super-admin',
  '/wallet',
];

const PDP_REDIRECT_TIMEOUT_MS = 1500;
const WOO_VARIATION_PARAM_NAMES = new Set(['رنگ', 'سایز', 'طرح']);
const RETIRED_LEGACY_PATHS = new Set(['/offer/best-sellers', '/offer/week-style']);
type LegacyRedirectSourceUrl = Pick<URL, 'href' | 'pathname' | 'search' | 'searchParams'>;

function safeDecodeURIComponent(value: string) {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

export function stripTrailingSlash(pathname: string) {
  if (pathname === '/') {
    return pathname;
  }

  return pathname.replace(/\/+$/, '') || '/';
}

export function getSegments(pathname: string) {
  return stripTrailingSlash(pathname)
    .split('/')
    .filter(Boolean)
    .map((segment) => safeDecodeURIComponent(segment));
}

function getDecodedPathname(pathname: string) {
  const segments = getSegments(pathname);
  return segments.length > 0 ? `/${segments.join('/')}` : '/';
}

export function lastCategorySegmentFromShopPath(segments: string[]) {
  const pathSegments = segments[0] === 'shop' ? segments.slice(1) : segments;
  const pageIndex = pathSegments.lastIndexOf('page');
  const categorySegments = pageIndex >= 0 ? pathSegments.slice(0, pageIndex) : pathSegments;

  return categorySegments.length > 0 ? categorySegments[categorySegments.length - 1] : null;
}

function buildRedirectUrl(
  sourceUrl: LegacyRedirectSourceUrl,
  pathname: string,
  searchParams?: URLSearchParams,
) {
  const url = new URL(sourceUrl.href);
  url.pathname = pathname;
  url.search = searchParams?.toString() ? `?${searchParams.toString()}` : '';

  return url;
}

export function redirectTo(
  request: NextRequest,
  pathname: string,
  searchParams?: URLSearchParams,
) {
  return buildRedirectUrl(request.nextUrl, pathname, searchParams);
}

export function isWooVariationParam(name: string) {
  return name.startsWith('pa_') || WOO_VARIATION_PARAM_NAMES.has(name);
}

export function hasWooVariationParams(searchParams: URLSearchParams) {
  return Array.from(searchParams.keys()).some(isWooVariationParam);
}

function encodePathSegment(segment: string) {
  return encodeURIComponent(segment);
}

function redirectIfChanged(
  sourceUrl: LegacyRedirectSourceUrl,
  pathname: string,
  searchParams?: URLSearchParams,
) {
  const target = buildRedirectUrl(sourceUrl, pathname, searchParams);

  if (target.pathname === sourceUrl.pathname && target.search === sourceUrl.search) {
    return null;
  }

  return target;
}

export function isRetiredLegacyPath(pathname: string) {
  return RETIRED_LEGACY_PATHS.has(getDecodedPathname(pathname));
}

function isWordPressInternalPath(pathname: string) {
  const decodedPathname = getDecodedPathname(pathname);

  return (
    decodedPathname === '/xmlrpc.php' ||
    decodedPathname.startsWith('/wp-json') ||
    decodedPathname.startsWith('/wp-content') ||
    decodedPathname.startsWith('/wp-includes')
  );
}

export function getLegacyRedirectUrl(sourceUrl: LegacyRedirectSourceUrl) {
  const { pathname, searchParams } = sourceUrl;
  const segments = getSegments(pathname);
  const decodedPathname = getDecodedPathname(pathname);

  if (segments[0] === 'product' && segments[1]) {
    return redirectIfChanged(sourceUrl, `/pdp/${encodePathSegment(segments[1])}`);
  }

  if (segments[0] === 'shop') {
    const pageIndex = segments.lastIndexOf('page');
    const page = pageIndex >= 0 ? segments[pageIndex + 1] : null;
    const hasPagination = Boolean(page && /^\d+$/.test(page));
    const pageParams = new URLSearchParams();

    if (hasPagination && page) {
      pageParams.set('page', page);
    }

    if (segments.length === 1) {
      return redirectIfChanged(sourceUrl, '/plp');
    }

    if (segments[1] === 'page' && hasPagination) {
      return redirectIfChanged(sourceUrl, '/plp', pageParams);
    }

    const categorySlug = lastCategorySegmentFromShopPath(segments);
    if (categorySlug) {
      return redirectIfChanged(
        sourceUrl,
        `/plp/category/${encodePathSegment(categorySlug)}`,
        hasPagination ? pageParams : undefined,
      );
    }

    return redirectIfChanged(sourceUrl, '/plp', hasPagination ? pageParams : undefined);
  }

  if (segments[0] === 'category' && segments[1]) {
    const categorySlug = segments[segments.length - 1];
    const params = new URLSearchParams();
    params.set('category', categorySlug);
    return redirectIfChanged(sourceUrl, '/blog', params);
  }

  if ((segments[0] === 'tag' || segments[0] === 'author') && segments[1]) {
    return redirectIfChanged(sourceUrl, '/blog');
  }

  if (decodedPathname === '/offer/oppsi' || decodedPathname === '/محصولات-زده-دار') {
    const params = new URLSearchParams();
    params.set('search', 'Oppsi');
    return redirectIfChanged(sourceUrl, '/plp', params);
  }

  const exactRedirects = new Map<string, string>([
    ['/سوالات-متداول', '/faq'],
    ['/شرایط-و-مقررات-تعویض-و-مرجوع', '/faq'],
    ['/my-account/orders', '/orders'],
    ['/my-account', '/account'],
    ['/user-login', '/auth'],
    ['/cart', '/cart'],
    ['/checkout', '/checkout'],
    ['/payment', '/checkout'],
    ['/sitemap_index.xml', '/sitemap.xml'],
  ]);
  const exactDestination = exactRedirects.get(decodedPathname);

  if (exactDestination) {
    return redirectIfChanged(sourceUrl, exactDestination);
  }

  if (segments[0] === 'product' && segments[1] && hasWooVariationParams(searchParams)) {
    return redirectIfChanged(sourceUrl, `/pdp/${encodePathSegment(segments[1])}`);
  }

  return null;
}

function isPrivateRoute(pathname: string) {
  return PRIVATE_ROUTE_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  );
}

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

  if (isPrivateRoute(pathname)) {
    response.headers.set('Cache-Control', 'no-store, max-age=0');
  }

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

  const legacyRedirectUrl = getLegacyRedirectUrl(request.nextUrl);
  if (legacyRedirectUrl) {
    return NextResponse.redirect(legacyRedirectUrl, LEGACY_REDIRECT_STATUS);
  }

  if (isRetiredLegacyPath(pathname) || isWordPressInternalPath(pathname)) {
    return response;
  }

  // Handle trailing slashes - redirect to non-trailing slash for SEO
  if (pathname !== '/' && pathname.endsWith('/')) {
    const url = request.nextUrl.clone();
    url.pathname = pathname.slice(0, -1);
    return NextResponse.redirect(url, LEGACY_REDIRECT_STATUS);
  }

  // Clean up empty category parameter in PLP - redirect /plp?category= to /plp
  if (pathname === '/plp') {
    const searchParams = request.nextUrl.searchParams;
    const category = searchParams.get('category');

    // If category param exists but is empty or just whitespace, remove it
    if (category !== null && category.trim() === '') {
      const url = request.nextUrl.clone();
      url.searchParams.delete('category');
      return NextResponse.redirect(url, LEGACY_REDIRECT_STATUS); // Permanent redirect to clean URL
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
        // Fetch product slug from API using internal URL (bypasses TLS/DNS)
        const productId = identifier;
        // Use internal URL for server-side middleware calls to avoid hairpin routing
        const apiBaseUrl = process.env.STRAPI_INTERNAL_URL || process.env.NEXT_PUBLIC_API_BASE_URL || 'https://api.infinitycolor.co/api';
        const apiUrl = `${apiBaseUrl}/products/${productId}?fields[0]=Slug`;
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), PDP_REDIRECT_TIMEOUT_MS);

        const apiResponse = await fetch(apiUrl, {
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'Accept-Encoding': 'gzip',
          },
          next: { revalidate: 86400 }, // Cache for 24 hours
          signal: controller.signal,
        }).finally(() => clearTimeout(timeoutId));

        if (apiResponse.ok) {
          const data = await apiResponse.json();
          const slug = data?.data?.attributes?.Slug;

          if (slug) {
            const url = request.nextUrl.clone();
            url.pathname = `/pdp/${slug}`;
            return NextResponse.redirect(url, LEGACY_REDIRECT_STATUS); // Permanent redirect
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
  runtime: 'nodejs',
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

