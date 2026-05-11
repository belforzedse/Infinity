/**
 * Client for the social `api::post.post` collection — wraps `POST /posts`.
 *
 * The backend's create controller (`apps/backend/src/api/post/controllers/post.ts`)
 * requires `Title`, `Slug`, `Description`, `CoverImage`, `Media`, and `Size`. We map
 * the lowercase camelCase argument names below into Strapi's PascalCase field
 * names inside the wire payload so callers don't have to think about the schema.
 */

import type { ApiError } from "@repo/api/types";
import { apiClient } from "@/lib/api-client";
import { ENDPOINTS } from "@/lib/api-endpoints";
import { handleAuthErrors } from "@/utils/auth";

/** Wire-level enum on `api::post.post.Size`. Note the space in `"X Large"`. */
export type PostSize = "Small" | "Medium" | "Large" | "X Large";

/** Compact UI size code used across the multi-step create-post flow. */
export type PostSizeCode = "s" | "m" | "l" | "xl";

export const POST_SIZE_TO_ENUM: Readonly<Record<PostSizeCode, PostSize>> = {
  s: "Small",
  m: "Medium",
  l: "Large",
  xl: "X Large",
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

export type CreatedPost = {
  id: number;
  Title?: string;
  Slug?: string;
};

const POST_CREATE_TIMEOUT_MS = 30000;
const POST_CREATE_RETRIES = 0;

type MaybeWrapped<T> = T | { data: T };

function unwrap<T>(value: unknown): T {
  const v = value as MaybeWrapped<T>;
  if (typeof v === "object" && v !== null && "data" in (v as Record<string, unknown>)) {
    const inner = (v as { data: unknown }).data;
    if (inner !== undefined) return inner as T;
  }
  return value as T;
}

export async function createPost(input: CreatePostInput): Promise<CreatedPost> {
  const accessToken =
    typeof window !== "undefined" ? window.localStorage.getItem("accessToken") : null;

  const payload = {
    data: {
      Title: input.title,
      Slug: input.slug,
      Description: input.description,
      CoverImage: input.coverId,
      Media: [...input.mediaIds],
      Size: input.size,
      ...(input.productLink ? { ProductLink: input.productLink } : {}),
    },
  };

  try {
    const response = await apiClient.post(ENDPOINTS.POSTS.CREATE, payload, {
      headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : undefined,
      cache: "no-store",
      timeout: POST_CREATE_TIMEOUT_MS,
      retries: POST_CREATE_RETRIES,
    });
    // Strapi nests its payload in `{ data: { id, attributes? } | { id, ... } }`,
    // and the shared `ApiClient` wraps the body in its own `{ data }` envelope.
    // Peel both layers off so callers always receive a flat `CreatedPost`.
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

export const PostService = {
  create: createPost,
};
