import { apiClient } from "@/services";
import type { SiteIdentity } from "@/types/site-identity";
import { DEFAULT_SITE_IDENTITY, normalizeSiteIdentity } from "@/services/site-identity";

const POPULATE =
  "populate[stores][populate]=phones,socialLinks&populate[socialLinks]=true&populate[contactNumbers]=true";

/**
 * Strapi v4 PUT on a single type replaces repeatable components wholesale,
 * so we send the full arrays. Empty strings are normalized to null.
 */
function clean<T extends Record<string, unknown>>(obj: T): T {
  const out = {} as T;
  for (const [k, v] of Object.entries(obj)) {
    (out as Record<string, unknown>)[k] = v === "" ? null : v;
  }
  return out;
}

export async function updateSuperAdminSiteIdentity(
  identity: SiteIdentity,
): Promise<SiteIdentity> {
  const data = {
    siteName: identity.siteName?.trim() || DEFAULT_SITE_IDENTITY.siteName,
    brandDescription: identity.brandDescription?.trim() || null,
    contactEmail: identity.contactEmail?.trim() || null,
    supportHours: identity.supportHours?.trim() || null,
    hasPhysicalStores: Boolean(identity.hasPhysicalStores),
    hasMultipleStores: Boolean(identity.hasMultipleStores),
    stores: (identity.stores ?? []).map((s) =>
      clean({
        name: s.name ?? null,
        address: s.address ?? null,
        phones: (s.phones ?? [])
          .filter((p) => p.number?.trim())
          .map((p) => clean({ label: p.label ?? null, number: p.number })),
        wazeLink: s.wazeLink ?? null,
        neshanLink: s.neshanLink ?? null,
        baladLink: s.baladLink ?? null,
        googleMapsLink: s.googleMapsLink ?? null,
        showInFooter: Boolean(s.showInFooter),
        showInAbout: Boolean(s.showInAbout),
        socialLinks: (s.socialLinks ?? [])
          .filter((l) => l.url?.trim())
          .map((l) => clean({ platform: l.platform, url: l.url, label: l.label ?? null })),
      }),
    ),
    socialLinks: (identity.socialLinks ?? [])
      .filter((l) => l.url?.trim())
      .map((l) => clean({ platform: l.platform, url: l.url, label: l.label ?? null })),
    contactNumbers: (identity.contactNumbers ?? [])
      .filter((c) => c.number?.trim())
      .map((c) => clean({ label: c.label ?? null, number: c.number, type: c.type ?? null })),
  };

  const res = await apiClient.put(`/site-identity?${POPULATE}`, { data });
  const attributes = (res as { data?: { attributes?: unknown } })?.data?.attributes;
  return attributes ? normalizeSiteIdentity(attributes) : DEFAULT_SITE_IDENTITY;
}
