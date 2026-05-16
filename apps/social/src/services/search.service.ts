/**
 * Server-backed post search — `GET /posts` with Strapi `$containsi` filters on Title and Slug.
 */
import { apiClient } from "@/lib/api-client";
import { ENDPOINTS } from "@/lib/api-endpoints";
import {
  normalizeStrapiPostEntry,
  type HomeFeedPost,
} from "@/services/feed-post.service";

export type SearchPostsOptions = {
  /** Max results (default 24). Header suggestions use 6. */
  limit?: number;
  /** Page number for pagination (default 1). */
  page?: number;
  /** Aborts the in-flight request when the user types again. */
  signal?: AbortSignal;
};

const DEFAULT_PAGE_SIZE = 24;
const MAX_PAGE_SIZE = 48;

function buildSearchQuery(query: string, options?: SearchPostsOptions): string {
  const trimmed = query.trim();
  const pageSize = Math.min(
    Math.max(1, options?.limit ?? DEFAULT_PAGE_SIZE),
    MAX_PAGE_SIZE,
  );
  const page = Math.max(1, options?.page ?? 1);

  const p = new URLSearchParams();
  p.set("filters[$or][0][Title][$containsi]", trimmed);
  p.set("filters[$or][1][Slug][$containsi]", trimmed);
  p.set("fields[0]", "Title");
  p.set("fields[1]", "Slug");
  p.set("fields[2]", "Size");
  p.set("fields[3]", "ProductLink");
  p.set("populate[CoverImage][fields][0]", "url");
  p.set("populate[CoverImage][fields][1]", "alternativeText");
  p.set("populate[Media][fields][0]", "url");
  p.set("populate[Media][fields][1]", "mime");
  p.set("populate[Media][fields][2]", "alternativeText");
  p.set("populate[post_likes][count]", "true");
  p.set("populate[post_comments][count]", "true");
  p.set("pagination[page]", String(page));
  p.set("pagination[pageSize]", String(pageSize));
  p.set("sort", "createdAt:desc");
  return p.toString();
}

/**
 * Searches posts on the server. Returns an empty array for blank queries.
 */
export async function searchPosts(
  query: string,
  options?: SearchPostsOptions,
): Promise<readonly HomeFeedPost[]> {
  const q = query.trim();
  if (!q) return [];

  const qs = buildSearchQuery(q, options);
  const endpoint = `${ENDPOINTS.POSTS.LIST}?${qs}`;

  const res = await apiClient.get<unknown[]>(endpoint, {
    cache: "no-store",
    signal: options?.signal,
  });

  const rows = Array.isArray(res.data) ? res.data : [];
  const out: HomeFeedPost[] = [];
  for (const row of rows) {
    const post = normalizeStrapiPostEntry(row);
    if (post != null) out.push(post);
  }
  return out;
}

/** Suggested page size for header autocomplete. */
export const SEARCH_SUGGESTION_LIMIT = 6;

/** Suggested page size for the full search results page. */
export const SEARCH_RESULTS_PAGE_SIZE = 48;
