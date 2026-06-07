import { apiClient } from "@/services";
import {
  createDefaultHeroSliderPayload,
  normalizeHeroSliderMeta,
  normalizeHeroSliderPayload,
  type HeroSliderMeta,
  type HeroSliderPayload,
} from "@/types/super-admin/heroSliderV3";

type HeroSliderStateResponse = {
  draft: HeroSliderPayload;
  published: HeroSliderPayload;
  meta: HeroSliderMeta | null;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function getResponseData(response: unknown): Record<string, unknown> {
  if (!isRecord(response) || !isRecord(response.data)) return {};
  return response.data;
}

export async function getHeroSliderDraftAndPublished(): Promise<HeroSliderStateResponse> {
  const response = await apiClient.get("/settings/hero-slider");
  const source = getResponseData(response);

  return {
    draft: normalizeHeroSliderPayload(source.draft),
    published: normalizeHeroSliderPayload(source.published),
    meta: normalizeHeroSliderMeta(source.meta),
  };
}

export async function updateHeroSliderDraft(payload: HeroSliderPayload): Promise<HeroSliderPayload> {
  const response = await apiClient.put("/settings/hero-slider/draft", {
    data: payload,
  });

  const source = getResponseData(response);
  const draft = source.draft;
  return normalizeHeroSliderPayload(draft);
}

export async function publishHeroSliderDraft(): Promise<{
  published: HeroSliderPayload;
  meta: HeroSliderMeta | null;
}> {
  const response = await apiClient.post("/settings/hero-slider/publish", {
    data: {},
  });

  const source = getResponseData(response);
  return {
    published: normalizeHeroSliderPayload(source.published),
    meta: normalizeHeroSliderMeta(source.meta),
  };
}

export function createInitialHeroSliderDraft(): HeroSliderPayload {
  return createDefaultHeroSliderPayload();
}
