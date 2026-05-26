const ROOT_FALLBACKS = new Map<string, string | null>([
  ["/", null],
  ["/about", "/"],
  ["/account", "/"],
  ["/blog", "/"],
  ["/cart", "/"],
  ["/contact", "/"],
  ["/faq", "/"],
  ["/favorites", "/account"],
  ["/orders", "/account"],
  ["/password", "/account"],
  ["/plp", "/"],
  ["/privileges", "/account"],
  ["/wallet", "/account"],
]);

const ACCOUNT_SECTION_PATHS = new Set([
  "/addresses",
  "/favorites",
  "/orders",
  "/password",
  "/privileges",
  "/wallet",
]);

const KNOWN_ROOT_PATHS = new Set([
  "/",
  "/about",
  "/account",
  "/addresses",
  "/auth",
  "/blog",
  "/cart",
  "/checkout",
  "/contact",
  "/faq",
  "/favorites",
  "/orders",
  "/password",
  "/payment",
  "/plp",
  "/privileges",
  "/super-admin",
  "/wallet",
]);

function normalizePathname(pathname: string): string {
  const [pathWithoutQuery] = pathname.split(/[?#]/);
  if (!pathWithoutQuery || pathWithoutQuery === "/") {
    return "/";
  }

  return pathWithoutQuery.replace(/\/+$/, "") || "/";
}

function isLikelyResourceId(segment: string): boolean {
  return /^\d+$/.test(segment);
}

function getSuperAdminFallbackHref(pathname: string): string | null {
  if (pathname === "/super-admin") {
    return null;
  }

  const segments = pathname.split("/").filter(Boolean);
  const sectionSegments = segments.slice(1);

  if (sectionSegments.length === 0) {
    return null;
  }

  const lastSegment = sectionSegments[sectionSegments.length - 1];
  const previousSegment = sectionSegments[sectionSegments.length - 2];

  if (lastSegment === "add") {
    sectionSegments.pop();
  } else if (previousSegment === "edit") {
    sectionSegments.splice(-2, 2);
  } else if (lastSegment === "cities" && isLikelyResourceId(previousSegment ?? "")) {
    sectionSegments.splice(-2, 2);
  } else if (isLikelyResourceId(lastSegment ?? "")) {
    sectionSegments.pop();
  } else {
    sectionSegments.pop();
  }

  if (sectionSegments.length === 0) {
    return "/super-admin";
  }

  return `/super-admin/${sectionSegments.join("/")}`;
}

function isRootBlogDetail(pathname: string): boolean {
  if (KNOWN_ROOT_PATHS.has(pathname)) {
    return false;
  }

  return pathname.split("/").filter(Boolean).length === 1;
}

export function getMobileBackFallbackHref(pathname: string): string | null {
  const normalizedPathname = normalizePathname(pathname);

  if (normalizedPathname.startsWith("/super-admin")) {
    return getSuperAdminFallbackHref(normalizedPathname);
  }

  if (normalizedPathname.startsWith("/pdp/")) {
    return "/plp";
  }

  if (normalizedPathname.startsWith("/plp/category/")) {
    return "/plp";
  }

  if (normalizedPathname === "/checkout") {
    return "/cart";
  }

  if (normalizedPathname.startsWith("/orders/reserve/")) {
    return "/orders";
  }

  if (/^\/orders\/[^/]+$/.test(normalizedPathname)) {
    return "/orders";
  }

  if (normalizedPathname.startsWith("/addresses/")) {
    return "/addresses";
  }

  if (ACCOUNT_SECTION_PATHS.has(normalizedPathname)) {
    return "/account";
  }

  if (ROOT_FALLBACKS.has(normalizedPathname)) {
    return ROOT_FALLBACKS.get(normalizedPathname) ?? null;
  }

  if (isRootBlogDetail(normalizedPathname)) {
    return "/blog";
  }

  return null;
}
