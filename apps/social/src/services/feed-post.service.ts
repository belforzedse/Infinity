/**
 * Homepage feed — `GET /api/posts` with Strapi populate (cover, media, relation counts).
 * Server-only fetch aligned with [`getActiveStories`](./story.service.ts) (`getStrapiServerUrl` + `next.revalidate`).
 */

import { getStrapiServerUrl, IMAGE_BASE_URL } from "@repo/api/config";
import type { DesktopPostCardVariant } from "@/components/posts/post-card-variants";

export type HomeFeedCardOverlay = "infinity" | "video" | "gallery" | null;

export type HomeFeedPost = {
  id: string;
  slug: string;
  title: string;
  desktopVariant: DesktopPostCardVariant;
  imageSrc: string;
  imageAlt: string;
  media: readonly {
    id: string;
    url: string;
    alternativeText?: string;
    mime?: string;
  }[];
  likesCount: number;
  commentsCount: number;
  overlay: HomeFeedCardOverlay;
};

type StrapiMediaAttrs = {
  url?: string;
  alternativeText?: string;
  mime?: string;
};

function strapiMediaUrl(relativeOrAbsolute: string | undefined): string | null {
  if (!relativeOrAbsolute?.trim()) return null;
  const u = relativeOrAbsolute.trim();
  if (u.startsWith("http://") || u.startsWith("https://")) return u;
  const base = IMAGE_BASE_URL.replace(/\/$/, "");
  return `${base}${u.startsWith("/") ? u : `/${u}`}`;
}

function readAttrs(entry: unknown): Record<string, unknown> {
  if (!entry || typeof entry !== "object") return {};
  const r = entry as Record<string, unknown>;
  const inner = r.attributes;
  if (inner && typeof inner === "object") return inner as Record<string, unknown>;
  return r;
}

function normalizeMediaEntry(entry: unknown): StrapiMediaAttrs {
  const attrs = readAttrs(entry);
  return {
    url: typeof attrs.url === "string" ? attrs.url : undefined,
    alternativeText:
      typeof attrs.alternativeText === "string" ? attrs.alternativeText : undefined,
    mime: typeof attrs.mime === "string" ? attrs.mime : undefined,
  };
}

function normalizeMediaList(raw: unknown): readonly StrapiMediaAttrs[] {
  if (!raw || typeof raw !== "object") return [];
  if (Array.isArray(raw)) return raw.map(normalizeMediaEntry);
  const r = raw as Record<string, unknown>;
  const data = r.data;
  if (Array.isArray(data)) return data.map(normalizeMediaEntry);
  if (data && typeof data === "object") return [normalizeMediaEntry(data)];
  return [];
}

function relationTotal(raw: unknown): number {
  if (raw == null) return 0;
  if (typeof raw !== "object") return 0;
  const r = raw as Record<string, unknown>;
  if (typeof r.count === "number") return r.count;
  const meta = r.meta as Record<string, unknown> | undefined;
  const pagination = meta?.pagination as Record<string, unknown> | undefined;
  if (typeof pagination?.total === "number") return pagination.total;
  const data = r.data;
  if (Array.isArray(data)) return data.length;
  return 0;
}

function mapSizeToDesktopVariant(size: unknown): DesktopPostCardVariant {
  if (size === "X Large" || size === "Large") return "xl";
  return "sm";
}

function inferOverlay(
  media: readonly StrapiMediaAttrs[],
  productLink: string | undefined,
): HomeFeedCardOverlay {
  if (productLink?.trim()) return "infinity";
  const mimes = media.map((m) => (m.mime ?? "").toLowerCase());
  if (mimes.some((m) => m.startsWith("video"))) return "video";
  if (media.length > 1) return "gallery";
  return null;
}

export function normalizeStrapiPostEntry(entry: unknown): HomeFeedPost | null {
  if (!entry || typeof entry !== "object") return null;
  const root = entry as Record<string, unknown>;
  const id = root.id;
  const attrs = readAttrs(entry);

  const coverRaw = attrs.CoverImage;
  const coverData =
    coverRaw && typeof coverRaw === "object"
      ? ((coverRaw as Record<string, unknown>).data ?? coverRaw)
      : undefined;
  const coverAttrs = normalizeMediaEntry(coverData);
  const imageSrc = strapiMediaUrl(coverAttrs.url);
  if (!imageSrc) return null;

  const title = typeof attrs.Title === "string" ? attrs.Title.trim() : "";
  const slug = typeof attrs.Slug === "string" ? attrs.Slug.trim() : "";
  const imageAlt = (coverAttrs.alternativeText?.trim() || title || "پست").slice(0, 500);

  const mediaList = normalizeMediaList(attrs.Media);
  const productLink = typeof attrs.ProductLink === "string" ? attrs.ProductLink : undefined;

  const likesCount = relationTotal(attrs.post_likes);
  const commentsCount = relationTotal(attrs.post_comments);

  const postId = typeof id === "number" ? String(id) : "";
  if (!postId || !slug) return null;

  return {
    id: postId,
    slug,
    title,
    desktopVariant: mapSizeToDesktopVariant(attrs.Size),
    imageSrc,
    imageAlt,
    media: mediaList
      .map((media, index) => {
        const url = strapiMediaUrl(media.url);
        if (!url) return null;
        return {
          id: `${postId}-${index}`,
          url,
          alternativeText: media.alternativeText,
          mime: media.mime,
        };
      })
      .filter((media): media is NonNullable<typeof media> => media != null),
    likesCount,
    commentsCount,
    overlay: inferOverlay(mediaList, productLink),
  };
}

function buildListQuery(includeRelationCounts: boolean): string {
  const p = new URLSearchParams();
  p.set("fields[0]", "Title");
  p.set("fields[1]", "Slug");
  p.set("fields[2]", "Size");
  p.set("populate[CoverImage][fields][0]", "url");
  p.set("populate[CoverImage][fields][1]", "alternativeText");
  p.set("populate[Media][fields][0]", "url");
  p.set("populate[Media][fields][1]", "mime");
  if (includeRelationCounts) {
    p.set("populate[post_likes][count]", "true");
    p.set("populate[post_comments][count]", "true");
  }
  p.set("pagination[pageSize]", "48");
  p.set("sort", "createdAt:desc");
  return p.toString();
}

/**
 * Loads posts for the home «پست ها» collage. Returns an empty array on HTTP or parse errors
 * (errors are logged; the page still renders).
 */
export async function getHomeFeedPosts(): Promise<readonly HomeFeedPost[]> {
  const base = getStrapiServerUrl().replace(/\/$/, "");

  const queryVariants = [buildListQuery(true), buildListQuery(false)];

  for (const qs of queryVariants) {
    const url = `${base}/posts?${qs}`;
    try {
      const res = await fetch(url, { next: { revalidate: 60 } });
      if (!res.ok) {
        const text = await res.text().catch(() => "");
        console.error(`getHomeFeedPosts: ${res.status} ${text}`);
        continue;
      }
      const json = (await res.json()) as { data?: unknown[] };
      const rows = Array.isArray(json.data) ? json.data : [];
      const out: HomeFeedPost[] = [];
      for (const row of rows) {
        const post = normalizeStrapiPostEntry(row);
        if (post != null) out.push(post);
      }
      return out;
    } catch (e) {
      console.error("getHomeFeedPosts:", e);
    }
  }

  return [];
}
