/**
 * Client for the social `api::post.post` collection.
 */

import { IMAGE_BASE_URL } from "@repo/api";
import type { ApiError } from "@repo/api/types";
import {
  POST_SIZE_TO_STRAPI,
  type PostCreateSizeCode,
} from "@/components/posts/post-size-config";
import type { DesktopPostCardVariant } from "@/components/posts/post-card-variants";
import { apiClient } from "@/lib/api-client";
import { ENDPOINTS } from "@/lib/api-endpoints";
import { handleAuthErrors } from "@/utils/auth";

/** Wire-level enum on `api::post.post.Size`. Note the space in `"X Large"`. */
export type PostSize = "Small" | "Medium" | "Large" | "X Large";

/** Compact UI size code in create-post URLs and forms (`?size=xl|sm`). */
export type PostSizeCode = PostCreateSizeCode;

export const POST_SIZE_TO_ENUM: Readonly<Record<PostSizeCode, PostSize>> = {
  xl: POST_SIZE_TO_STRAPI.xl,
  sm: POST_SIZE_TO_STRAPI.sm,
};

export type PostMedia = {
  id: number;
  url: string;
  previewUrl: string;
  alternativeText?: string;
  mime?: string;
};

export type ProfilePost = {
  id: number;
  title: string;
  slug: string;
  description: string;
  productLink: string;
  size: PostSize;
  desktopVariant: DesktopPostCardVariant;
  cover: PostMedia;
  media: PostMedia[];
  likesCount: number;
  commentsCount: number;
};

export type CreatePostInput = {
  title: string;
  slug: string;
  /** TipTap-rendered HTML; backend field is `richtext`. */
  description: string;
  coverId: number;
  mediaIds: readonly number[];
  productLink?: string;
  size: PostSize;
};

export type UpdatePostInput = CreatePostInput;

export type CreatedPost = {
  id: number;
  Title?: string;
  Slug?: string;
};

const POST_TIMEOUT_MS = 30000;
const POST_CREATE_RETRIES = 0;
const PROFILE_PAGE_SIZE = 100;

type MaybeWrapped<T> = T | { data: T };

function unwrap<T>(value: unknown): T {
  const v = value as MaybeWrapped<T>;
  if (typeof v === "object" && v !== null && "data" in (v as Record<string, unknown>)) {
    const inner = (v as { data: unknown }).data;
    if (inner !== undefined) return inner as T;
  }
  return value as T;
}

function authHeaders(): Record<string, string> | undefined {
  const accessToken =
    typeof window !== "undefined" ? window.localStorage.getItem("accessToken") : null;
  return accessToken ? { Authorization: `Bearer ${accessToken}` } : undefined;
}

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

function normalizeMediaEntry(entry: unknown): PostMedia | null {
  if (!entry || typeof entry !== "object") return null;
  const root = entry as Record<string, unknown>;
  const attrs = readAttrs(entry);
  const rawId = typeof root.id === "number" ? root.id : attrs.id;
  const id = typeof rawId === "number" ? rawId : Number(rawId);
  const url = strapiMediaUrl(typeof attrs.url === "string" ? attrs.url : undefined);

  if (!Number.isFinite(id) || !url) return null;

  return {
    id,
    url,
    previewUrl: url,
    alternativeText:
      typeof attrs.alternativeText === "string" ? attrs.alternativeText : undefined,
    mime: typeof attrs.mime === "string" ? attrs.mime : undefined,
  };
}

function normalizeSingleMedia(raw: unknown): PostMedia | null {
  if (!raw || typeof raw !== "object") return null;
  const r = raw as Record<string, unknown>;
  const data = r.data;
  if (data && typeof data === "object") return normalizeMediaEntry(data);
  return normalizeMediaEntry(raw);
}

function normalizeMediaList(raw: unknown): PostMedia[] {
  if (!raw || typeof raw !== "object") return [];
  const r = raw as Record<string, unknown>;
  const data = r.data;
  if (Array.isArray(data)) return data.map(normalizeMediaEntry).filter(Boolean) as PostMedia[];
  if (Array.isArray(raw)) return raw.map(normalizeMediaEntry).filter(Boolean) as PostMedia[];
  const one = normalizeMediaEntry(data ?? raw);
  return one ? [one] : [];
}

function relationTotal(raw: unknown): number {
  if (raw == null || typeof raw !== "object") return 0;
  const r = raw as Record<string, unknown>;
  if (typeof r.count === "number") return r.count;
  const meta = r.meta as Record<string, unknown> | undefined;
  const pagination = meta?.pagination as Record<string, unknown> | undefined;
  if (typeof pagination?.total === "number") return pagination.total;
  const data = r.data;
  if (Array.isArray(data)) return data.length;
  return 0;
}

function normalizeSize(value: unknown): PostSize {
  if (value === "X Large" || value === "Large" || value === "Medium" || value === "Small") {
    return value;
  }
  return "Small";
}

export function postSizeToCode(size: PostSize): PostSizeCode {
  return size === "X Large" || size === "Large" ? "xl" : "sm";
}

function postSizeToVariant(size: PostSize): DesktopPostCardVariant {
  return postSizeToCode(size);
}

export function normalizePost(entry: unknown): ProfilePost | null {
  if (!entry || typeof entry !== "object") return null;
  const root = entry as Record<string, unknown>;
  const id = typeof root.id === "number" ? root.id : Number(root.id);
  const attrs = readAttrs(entry);
  const cover = normalizeSingleMedia(attrs.CoverImage);

  if (!Number.isFinite(id) || !cover) return null;

  const size = normalizeSize(attrs.Size);

  return {
    id,
    title: typeof attrs.Title === "string" ? attrs.Title : "",
    slug: typeof attrs.Slug === "string" ? attrs.Slug : "",
    description: typeof attrs.Description === "string" ? attrs.Description : "",
    productLink: typeof attrs.ProductLink === "string" ? attrs.ProductLink : "",
    size,
    desktopVariant: postSizeToVariant(size),
    cover,
    media: normalizeMediaList(attrs.Media),
    likesCount: relationTotal(attrs.post_likes),
    commentsCount: relationTotal(attrs.post_comments),
  };
}

function postPayload(input: CreatePostInput | UpdatePostInput) {
  return {
    data: {
      Title: input.title,
      Slug: input.slug,
      Description: input.description,
      CoverImage: input.coverId,
      Media: [...input.mediaIds],
      ProductLink: input.productLink ?? "",
      Size: input.size,
    },
  };
}

function buildProfileParams(page: number): Record<string, string | number> {
  return {
    "populate[CoverImage][fields][0]": "url",
    "populate[CoverImage][fields][1]": "alternativeText",
    "populate[CoverImage][fields][2]": "mime",
    "populate[Media][fields][0]": "url",
    "populate[Media][fields][1]": "alternativeText",
    "populate[Media][fields][2]": "mime",
    "populate[post_likes][count]": "true",
    "populate[post_comments][count]": "true",
    "pagination[page]": page,
    "pagination[pageSize]": PROFILE_PAGE_SIZE,
    sort: "createdAt:desc",
  };
}

function buildDetailParams(): Record<string, string> {
  return {
    "populate[CoverImage][fields][0]": "url",
    "populate[CoverImage][fields][1]": "alternativeText",
    "populate[CoverImage][fields][2]": "mime",
    "populate[Media][fields][0]": "url",
    "populate[Media][fields][1]": "alternativeText",
    "populate[Media][fields][2]": "mime",
    "populate[post_likes][count]": "true",
    "populate[post_comments][count]": "true",
  };
}

export async function listAllForProfile(): Promise<ProfilePost[]> {
  try {
    const out: ProfilePost[] = [];
    let page = 1;
    let pageCount = 1;

    do {
      const response = await apiClient.get<unknown>(ENDPOINTS.POSTS.LIST, {
        headers: authHeaders(),
        params: buildProfileParams(page),
        cache: "no-store",
        timeout: POST_TIMEOUT_MS,
        retries: 1,
      });
      const outer = response as unknown as Record<string, unknown>;
      const rows = Array.isArray(outer.data) ? outer.data : [];
      rows.forEach((row) => {
        const post = normalizePost(row);
        if (post) out.push(post);
      });
      const meta = outer.meta as Record<string, unknown> | undefined;
      const pagination = meta?.pagination as Record<string, unknown> | undefined;
      pageCount = typeof pagination?.pageCount === "number" ? pagination.pageCount : page;
      page += 1;
    } while (page <= pageCount);

    return out;
  } catch (error: unknown) {
    handleAuthErrors(error as ApiError);
    throw error;
  }
}

export async function getPostById(id: number | string): Promise<ProfilePost> {
  try {
    const response = await apiClient.get<unknown>(ENDPOINTS.POSTS.DETAIL(id), {
      headers: authHeaders(),
      params: buildDetailParams(),
      cache: "no-store",
      timeout: POST_TIMEOUT_MS,
      retries: 1,
    });
    const post = normalizePost(unwrap<unknown>(unwrap<unknown>(response)));
    if (!post) throw new Error("پست یافت نشد.");
    return post;
  } catch (error: unknown) {
    handleAuthErrors(error as ApiError);
    throw error;
  }
}

export async function createPost(input: CreatePostInput): Promise<CreatedPost> {
  try {
    const response = await apiClient.post(ENDPOINTS.POSTS.CREATE, postPayload(input), {
      headers: authHeaders(),
      cache: "no-store",
      timeout: POST_TIMEOUT_MS,
      retries: POST_CREATE_RETRIES,
    });
    const outer = unwrap<unknown>(response);
    const inner = unwrap<unknown>(outer);
    const attr = (inner as { attributes?: Record<string, unknown> }).attributes;
    const flat = attr ? { ...(inner as { id: number }), ...attr } : (inner as Record<string, unknown>);
    return flat as CreatedPost;
  } catch (error: unknown) {
    handleAuthErrors(error as ApiError);
    throw error;
  }
}

export async function updatePost(id: number | string, input: UpdatePostInput): Promise<ProfilePost> {
  try {
    const response = await apiClient.put(ENDPOINTS.POSTS.DETAIL(id), postPayload(input), {
      headers: authHeaders(),
      cache: "no-store",
      timeout: POST_TIMEOUT_MS,
      retries: 0,
    });
    const post = normalizePost(unwrap<unknown>(unwrap<unknown>(response)));
    if (!post) return await getPostById(id);
    return post;
  } catch (error: unknown) {
    handleAuthErrors(error as ApiError);
    throw error;
  }
}

export async function deletePost(id: number | string): Promise<void> {
  try {
    await apiClient.delete(ENDPOINTS.POSTS.DETAIL(id), {
      headers: authHeaders(),
      cache: "no-store",
      timeout: POST_TIMEOUT_MS,
      retries: 0,
    });
  } catch (error: unknown) {
    handleAuthErrors(error as ApiError);
    throw error;
  }
}

export const PostService = {
  create: createPost,
  update: updatePost,
  delete: deletePost,
  getById: getPostById,
  listAllForProfile,
};
