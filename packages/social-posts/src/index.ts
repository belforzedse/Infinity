import { getStrapiServerUrl, IMAGE_BASE_URL } from "@repo/api/config";

export type PostCardVariant = "xl" | "sm" | "mobile-lg" | "mobile-sm";
export type DesktopPostCardVariant = "xl" | "sm";

export type PostCardLayout = {
  widthPx: number;
  imageHeightPx: number;
  columnGapPx: number;
};

export const POST_CARD_LAYOUTS: Readonly<Record<PostCardVariant, PostCardLayout>> = {
  xl: { widthPx: 383, imageHeightPx: 536, columnGapPx: 10 },
  sm: { widthPx: 184, imageHeightPx: 229, columnGapPx: 10 },
  "mobile-lg": { widthPx: 362, imageHeightPx: 484, columnGapPx: 10 },
  "mobile-sm": { widthPx: 184, imageHeightPx: 229, columnGapPx: 10 },
} as const;

export const POST_CARD_FLUID_MAX_EXTRA_PX = 10;

export function fluidMaxWidthCapPx(variant: PostCardVariant): number {
  return POST_CARD_LAYOUTS[variant].widthPx + POST_CARD_FLUID_MAX_EXTRA_PX;
}

export function toMobilePostCardVariant(
  variant: DesktopPostCardVariant,
): "mobile-lg" | "mobile-sm" {
  return variant === "xl" ? "mobile-lg" : "mobile-sm";
}

export type SocialFeedCardOverlay = "infinity" | "video" | "gallery" | null;

export type SocialFeedMedia = {
  id: string;
  url: string;
  alternativeText?: string;
  mime?: string;
};

export type SocialFeedPost = {
  id: string;
  slug: string;
  title: string;
  desktopVariant: DesktopPostCardVariant;
  imageSrc: string;
  imageAlt: string;
  previewMedia: SocialFeedMedia;
  media: readonly SocialFeedMedia[];
  likesCount: number;
  commentsCount: number;
  overlay: SocialFeedCardOverlay;
};

type StrapiMediaAttrs = {
  url?: string;
  alternativeText?: string;
  mime?: string;
};

export type GetSocialFeedPostsOptions = {
  limit?: number;
  includeRelationCounts?: boolean;
  revalidate?: number;
};

export function strapiMediaUrl(relativeOrAbsolute: string | undefined): string | null {
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
  if (raw == null || typeof raw !== "object") return 0;
  const r = raw as Record<string, unknown>;
  if (typeof r.count === "number") return r.count;
  const meta = r.meta as Record<string, unknown> | undefined;
  if (typeof meta?.count === "number") return meta.count;
  const pagination = meta?.pagination as Record<string, unknown> | undefined;
  if (typeof pagination?.total === "number") return pagination.total;
  if (typeof pagination?.count === "number") return pagination.count;
  const data = r.data;
  if (data && typeof data === "object" && !Array.isArray(data)) {
    const dataAttrs = (data as Record<string, unknown>).attributes as
      | Record<string, unknown>
      | undefined;
    if (typeof dataAttrs?.count === "number") return dataAttrs.count;
    if (typeof (data as Record<string, unknown>).count === "number") {
      return (data as Record<string, number>).count;
    }
  }
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
): SocialFeedCardOverlay {
  if (productLink?.trim()) return "infinity";
  const mimes = media.map((m) => (m.mime ?? "").toLowerCase());
  if (mimes.some((m) => m.startsWith("video"))) return "video";
  if (media.length > 1) return "gallery";
  return null;
}

function toSocialMedia(postId: string, media: StrapiMediaAttrs, index: number): SocialFeedMedia | null {
  const url = strapiMediaUrl(media.url);
  if (!url) return null;
  return {
    id: `${postId}-${index}`,
    url,
    alternativeText: media.alternativeText,
    mime: media.mime,
  };
}

export function normalizeStrapiPostEntry(entry: unknown): SocialFeedPost | null {
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

  const postId = typeof id === "number" ? String(id) : "";
  if (!postId || !slug) return null;

  const mediaList = normalizeMediaList(attrs.Media);
  const media = mediaList
    .map((item, index) => toSocialMedia(postId, item, index))
    .filter((item): item is SocialFeedMedia => item != null);
  const coverMedia: SocialFeedMedia = {
    id: `${postId}-cover`,
    url: imageSrc,
    alternativeText: coverAttrs.alternativeText,
    mime: coverAttrs.mime ?? "image/*",
  };
  const videoPreview = media.find((item) => item.mime?.toLowerCase().startsWith("video"));
  const productLink = typeof attrs.ProductLink === "string" ? attrs.ProductLink : undefined;

  return {
    id: postId,
    slug,
    title,
    desktopVariant: mapSizeToDesktopVariant(attrs.Size),
    imageSrc,
    imageAlt,
    previewMedia: videoPreview ?? coverMedia,
    media,
    likesCount: relationTotal(attrs.post_likes),
    commentsCount: relationTotal(attrs.post_comments),
    overlay: inferOverlay(mediaList, productLink),
  };
}

export function buildSocialFeedPostsQuery({
  limit = 48,
  includeRelationCounts = true,
}: Pick<GetSocialFeedPostsOptions, "limit" | "includeRelationCounts"> = {}): string {
  const pageSize = Math.min(Math.max(1, Math.floor(limit)), 48);
  const p = new URLSearchParams();
  p.set("fields[0]", "Title");
  p.set("fields[1]", "Slug");
  p.set("fields[2]", "Size");
  p.set("fields[3]", "ProductLink");
  p.set("populate[CoverImage][fields][0]", "url");
  p.set("populate[CoverImage][fields][1]", "alternativeText");
  p.set("populate[CoverImage][fields][2]", "mime");
  p.set("populate[Media][fields][0]", "url");
  p.set("populate[Media][fields][1]", "mime");
  p.set("populate[Media][fields][2]", "alternativeText");
  if (includeRelationCounts) {
    p.set("populate[post_likes][count]", "true");
    p.set("populate[post_comments][count]", "true");
  }
  p.set("pagination[pageSize]", String(pageSize));
  p.set("sort", "createdAt:desc");
  return p.toString();
}

export async function getSocialFeedPosts({
  limit = 48,
  includeRelationCounts = true,
  revalidate = 60,
}: GetSocialFeedPostsOptions = {}): Promise<readonly SocialFeedPost[]> {
  const base = getStrapiServerUrl().replace(/\/$/, "");
  const queryVariants = [
    buildSocialFeedPostsQuery({ limit, includeRelationCounts }),
    includeRelationCounts
      ? buildSocialFeedPostsQuery({ limit, includeRelationCounts: false })
      : null,
  ].filter((query): query is string => query != null);

  for (const qs of queryVariants) {
    try {
      const res = await fetch(`${base}/posts?${qs}`, {
        next: { revalidate },
      } as RequestInit & { next: { revalidate: number } });
      if (!res.ok) {
        const text = await res.text().catch(() => "");
        console.error(`getSocialFeedPosts: ${res.status} ${text}`);
        continue;
      }

      const json = (await res.json()) as { data?: unknown[] };
      const rows = Array.isArray(json.data) ? json.data : [];
      const out: SocialFeedPost[] = [];
      for (const row of rows) {
        const post = normalizeStrapiPostEntry(row);
        if (post != null) out.push(post);
      }
      return out.slice(0, limit);
    } catch (error) {
      console.error("getSocialFeedPosts:", error);
    }
  }

  return [];
}

export type HomeFeedCardOverlay = SocialFeedCardOverlay;
export type HomeFeedPost = SocialFeedPost;

export const getHomeFeedPosts = getSocialFeedPosts;
