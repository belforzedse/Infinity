import type { Redirect } from "next/dist/lib/load-custom-routes";

/**
 * Permanent (301) redirects from legacy WordPress / old storefront URLs.
 * Applied via next.config `redirects()` before middleware and routes.
 */
export const legacyRedirects: Redirect[] = [
  {
    source: "/shop/:slug",
    destination: "/plp/category/:slug",
    permanent: true,
  },
  {
    source: "/product/:slug",
    destination: "/pdp/:slug",
    permanent: true,
  },
  {
    source: "/my-account",
    destination: "/account",
    permanent: true,
  },
  {
    source: "/shop",
    destination: "/plp",
    permanent: true,
  },
  {
    source: "/سوالات-متداول",
    destination: "/faq",
    permanent: true,
  },
];
