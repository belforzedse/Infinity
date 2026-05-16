/**
 * Story API — same endpoints and normalization as storefront `story.service.ts`.
 */
import { getStrapiServerUrl } from "@repo/api/config";
import type { CreateStoryData, Story, StoryListParams, UpdateStoryData } from "@/types/story";
import { apiClient } from "@/lib/api-client";
import { ENDPOINTS } from "@/lib/api-endpoints";

function normalizeMediaAsset(raw: unknown) {
  if (!raw || typeof raw !== "object") return undefined;
  const r = raw as Record<string, unknown>;
  const attrs = (r.attributes as Record<string, unknown>) ?? r;
  return {
    id: (r.id as number) ?? (attrs.id as number),
    url: attrs.url as string,
    alternativeText: attrs.alternativeText as string | undefined,
    width: attrs.width as number | undefined,
    height: attrs.height as number | undefined,
    mime: attrs.mime as string | undefined,
    formats: attrs.formats as Story["Media"] extends undefined
      ? never
      : Story["Media"] extends { formats?: infer F }
        ? F
        : never,
  };
}

function normalizeStory(raw: unknown): Story {
  if (!raw || typeof raw !== "object") throw new Error("Invalid story data");
  const r = raw as Record<string, unknown>;
  const attrs = (r.attributes as Record<string, unknown>) ?? r;
  return {
    id: r.id as number,
    Title: attrs.Title as string,
    Slug: attrs.Slug as string,
    IsActive: attrs.IsActive as boolean,
    SortOrder: (attrs.SortOrder as number) ?? 0,
    MediaType: attrs.MediaType as Story["MediaType"],
    Media: normalizeMediaAsset(attrs.Media) as Story["Media"],
    Thumbnail: normalizeMediaAsset(attrs.Thumbnail) as Story["Thumbnail"],
    StartAt: attrs.StartAt as string | undefined,
    EndAt: attrs.EndAt as string | undefined,
    DurationMs: (attrs.DurationMs as number) ?? 5000,
    CtaLabel: attrs.CtaLabel as string | undefined,
    CtaUrl: attrs.CtaUrl as string | undefined,
    Overlays: attrs.Overlays as Story["Overlays"],
    createdAt: attrs.createdAt as string,
    updatedAt: attrs.updatedAt as string,
  };
}

interface StrapiListResponse<T> {
  data: T[];
  meta?: {
    pagination?: {
      page: number;
      pageSize: number;
      pageCount: number;
      total: number;
    };
  };
}

export async function getActiveStories(): Promise<Story[]> {
  const baseUrl = getStrapiServerUrl();
  const url = `${baseUrl}${ENDPOINTS.STORIES.ACTIVE}`;

  const res = await fetch(url, {
    next: { revalidate: 60 },
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Failed to fetch active stories: ${res.status} ${text}`);
  }

  const json = (await res.json()) as { data?: unknown[] };
  const items = Array.isArray(json.data) ? json.data : [];
  return items.map(normalizeStory);
}

export async function getMySeenStoryIds(): Promise<number[]> {
  const res = await apiClient.get<number[]>(ENDPOINTS.STORIES.SEEN_MINE);
  return res.data ?? [];
}

export async function markStorySeen(storyId: number): Promise<{ created: boolean }> {
  const res = await apiClient.post<{ success: boolean; created: boolean }>(
    ENDPOINTS.STORIES.SEEN_MARK,
    { storyId },
  );
  return { created: res.data?.created ?? false };
}

export async function listStories(params: StoryListParams = {}): Promise<StrapiListResponse<Story>> {
  const query = new URLSearchParams();
  if (params.page) query.set("pagination[page]", String(params.page));
  if (params.pageSize) query.set("pagination[pageSize]", String(params.pageSize));
  if (params.sort) query.set("sort", params.sort);
  if (typeof params.isActive === "boolean") {
    query.set("filters[IsActive][$eq]", String(params.isActive));
  }
  if (params.search) query.set("filters[Title][$containsi]", params.search);

  const suffix = query.toString();
  const endpoint = suffix ? `${ENDPOINTS.STORIES.LIST}?${suffix}` : ENDPOINTS.STORIES.LIST;
  const res = await apiClient.get<unknown[]>(endpoint, { cache: "no-store" });
  return {
    data: (res.data ?? []).map(normalizeStory),
    meta: res.meta,
  };
}

export async function getStory(id: number): Promise<Story> {
  const res = await apiClient.get<unknown>(ENDPOINTS.STORIES.DETAIL(id), { cache: "no-store" });
  if (res.data === undefined) throw new Error("Invalid story response");
  return normalizeStory(res.data);
}

export async function createStory(data: CreateStoryData): Promise<Story> {
  const res = await apiClient.post<unknown>(ENDPOINTS.STORIES.LIST, { data });
  if (res.data === undefined) throw new Error("Invalid story response");
  return normalizeStory(res.data);
}

export async function updateStory(id: number, data: UpdateStoryData): Promise<Story> {
  const res = await apiClient.put<unknown>(ENDPOINTS.STORIES.DETAIL(id), { data });
  if (res.data === undefined) throw new Error("Invalid story response");
  return normalizeStory(res.data);
}

export async function deleteStory(id: number): Promise<void> {
  await apiClient.delete(ENDPOINTS.STORIES.DETAIL(id));
}

export const StoryService = {
  getActiveStories,
  getMySeenStoryIds,
  markStorySeen,
  listStories,
  getStory,
  createStory,
  updateStory,
  deleteStory,
};
