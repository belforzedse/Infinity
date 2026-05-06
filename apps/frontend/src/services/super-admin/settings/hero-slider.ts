import { apiClient } from "@/services";
import {
  createDefaultHeroSliderPayload,
  normalizeHeroSliderMeta,
  normalizeHeroSliderPayload,
  type HeroSliderMeta,
  type HeroSliderPayload,
} from "@/types/super-admin/heroSlider";

type HeroSliderStateResponse = {
  draft: HeroSliderPayload;
  published: HeroSliderPayload;
  meta: HeroSliderMeta | null;
};

export async function getHeroSliderDraftAndPublished(): Promise<HeroSliderStateResponse> {
  const response = await apiClient.get("/settings/hero-slider");
  const source = (response as any)?.data || {};

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

  const draft = (response as any)?.data?.draft;
  return normalizeHeroSliderPayload(draft);
}

export async function publishHeroSliderDraft(): Promise<{
  published: HeroSliderPayload;
  meta: HeroSliderMeta | null;
}> {
  const response = await apiClient.post("/settings/hero-slider/publish", {
    data: {},
  });

  const source = (response as any)?.data || {};
  return {
    published: normalizeHeroSliderPayload(source.published),
    meta: normalizeHeroSliderMeta(source.meta),
  };
}

export function createInitialHeroSliderDraft(): HeroSliderPayload {
  return createDefaultHeroSliderPayload();
}
