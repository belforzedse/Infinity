"use client";

import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import {
  createDefaultHeroSliderPayload,
  createEmptyHeroSlide,
  normalizeHeroSliderPayload,
  type HeroSlideConfig,
  type HeroSliderMeta,
  type HeroSliderPayload,
} from "@/types/super-admin/heroSliderV3";
import {
  getHeroSliderDraftAndPublished,
  publishHeroSliderDraft,
  updateHeroSliderDraft,
} from "@/services/super-admin/settings/hero-slider";

function normalizeSlideOrder(slides: HeroSlideConfig[]): HeroSlideConfig[] {
  return slides.map((slide, index) => ({
    ...slide,
    order: index,
  }));
}

export function useHeroSliderEditor() {
  const [isLoading, setIsLoading] = useState(true);
  const [isSavingDraft, setIsSavingDraft] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);

  const [draft, setDraft] = useState<HeroSliderPayload>(createDefaultHeroSliderPayload());
  const [published, setPublished] = useState<HeroSliderPayload>(createDefaultHeroSliderPayload());
  const [meta, setMeta] = useState<HeroSliderMeta | null>(null);
  const [selectedSlideId, setSelectedSlideId] = useState<string | null>(null);

  useEffect(() => {
    const run = async () => {
      try {
        setIsLoading(true);
        const response = await getHeroSliderDraftAndPublished();
        setDraft(response.draft);
        setPublished(response.published);
        setMeta(response.meta);
        setSelectedSlideId(response.draft.slides[0]?.id || null);
      } catch (error) {
        console.error(error);
        toast.error("بارگذاری تنظیمات اسلایدر هیرو ناموفق بود");
      } finally {
        setIsLoading(false);
      }
    };

    run();
  }, []);

  useEffect(() => {
    if (draft.slides.length === 0) {
      setSelectedSlideId(null);
      return;
    }

    if (!selectedSlideId || !draft.slides.some((slide) => slide.id === selectedSlideId)) {
      setSelectedSlideId(draft.slides[0]?.id || null);
    }
  }, [draft.slides, selectedSlideId]);

  const selectedSlide = useMemo(() => {
    if (!selectedSlideId) return null;
    return draft.slides.find((slide) => slide.id === selectedSlideId) || null;
  }, [draft.slides, selectedSlideId]);

  const updateSlides = (slides: HeroSlideConfig[]) => {
    setDraft((prev) => ({
      ...prev,
      slides: normalizeSlideOrder(slides),
    }));
  };

  const addSlide = () => {
    setDraft((prev) => {
      const nextSlide = createEmptyHeroSlide(prev.slides.length);
      const nextSlides = normalizeSlideOrder([...prev.slides, nextSlide]);
      setSelectedSlideId(nextSlide.id);
      return {
        ...prev,
        slides: nextSlides,
      };
    });
  };

  const duplicateSlide = (slideId: string) => {
    setDraft((prev) => {
      const sourceIndex = prev.slides.findIndex((slide) => slide.id === slideId);
      if (sourceIndex < 0) return prev;

      const duplicated: HeroSlideConfig = {
        ...prev.slides[sourceIndex],
        id: `slide-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      };
      const nextSlides = [...prev.slides];
      nextSlides.splice(sourceIndex + 1, 0, duplicated);
      const normalized = normalizeSlideOrder(nextSlides);
      setSelectedSlideId(duplicated.id);

      return {
        ...prev,
        slides: normalized,
      };
    });
  };

  const deleteSlide = (slideId: string) => {
    setDraft((prev) => {
      const normalized = normalizeSlideOrder(prev.slides.filter((slide) => slide.id !== slideId));
      if (selectedSlideId === slideId) {
        setSelectedSlideId(normalized[0]?.id || null);
      }
      return {
        ...prev,
        slides: normalized,
      };
    });
  };

  const updateSelectedSlide = (updater: (slide: HeroSlideConfig) => HeroSlideConfig) => {
    if (!selectedSlideId) return;
    setDraft((prev) => ({
      ...prev,
      slides: prev.slides.map((slide) => (slide.id === selectedSlideId ? updater(slide) : slide)),
    }));
  };

  const updateAutoplayIntervalMs = (autoplayIntervalMs: number) => {
    setDraft((prev) => normalizeHeroSliderPayload({ ...prev, autoplayIntervalMs }));
  };

  const handleSaveDraft = async () => {
    try {
      setIsSavingDraft(true);
      const updated = await updateHeroSliderDraft(draft);
      setDraft(updated);
      toast.success("پیش‌نویس اسلایدر هیرو ذخیره شد");
    } catch (error) {
      console.error(error);
      toast.error("ذخیره پیش‌نویس اسلایدر هیرو ناموفق بود");
    } finally {
      setIsSavingDraft(false);
    }
  };

  const handlePublish = async () => {
    try {
      setIsPublishing(true);
      const response = await publishHeroSliderDraft();
      setPublished(response.published);
      setMeta(response.meta);
      toast.success("اسلایدر هیرو منتشر شد");
    } catch (error) {
      console.error(error);
      toast.error("انتشار اسلایدر هیرو ناموفق بود");
    } finally {
      setIsPublishing(false);
    }
  };

  return {
    isLoading,
    isSavingDraft,
    isPublishing,
    draft,
    published,
    meta,
    selectedSlideId,
    selectedSlide,
    setSelectedSlideId,
    addSlide,
    duplicateSlide,
    deleteSlide,
    updateSlides,
    updateSelectedSlide,
    updateAutoplayIntervalMs,
    handleSaveDraft,
    handlePublish,
  };
}
