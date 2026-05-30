"use client";

import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import {
  getDefaultSlotKeyByDevice,
  getSlotKeysByDevice,
} from "@/components/SuperAdmin/HeroSliderEditor";
import {
  createDefaultHeroSliderPayload,
  normalizeHeroSliderPayload,
  syncTabletAndMobileFromDesktop,
  type HeroDesktopSlotKey,
  type HeroMobileSlotKey,
  type HeroSlideConfig,
  type HeroSlotConfig,
  type HeroSlotLink,
  type HeroSliderMeta,
  type HeroSliderPayload,
  type HeroTabletSlotKey,
  type HeroTracking,
} from "@/types/super-admin/heroSlider";
import {
  getHeroSliderDraftAndPublished,
  publishHeroSliderDraft,
  updateHeroSliderDraft,
} from "@/services/super-admin/settings/hero-slider";

type DeviceMode = "desktop" | "tablet" | "mobile";

const EMPTY_TRACKING: HeroTracking = {
  campaign: "",
  source: "",
  medium: "",
  content: "",
  custom: {},
};

function createEmptySlide(order: number): HeroSlideConfig {
  const id = `slide-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
  const normalized = normalizeHeroSliderPayload({
    slides: [{ id, order }],
  });

  return normalized.slides[0];
}

function normalizeSlideOrder(slides: HeroSlideConfig[]): HeroSlideConfig[] {
  return slides.map((slide, index) => ({
    ...slide,
    order: index,
  }));
}

function getSelectedSlot(
  slide: HeroSlideConfig | null,
  device: DeviceMode,
  slotKey: string | null,
): HeroSlotConfig | null {
  if (!slide || slotKey === null) return null;

  if (device === "desktop") {
    return slide.devices.desktop.slots[slotKey as HeroDesktopSlotKey] || null;
  }
  if (device === "tablet") {
    return slide.devices.tablet.slots[slotKey as HeroTabletSlotKey] || null;
  }
  return slide.devices.mobile.slots[slotKey as HeroMobileSlotKey] || null;
}

type HeroSlotKey = HeroDesktopSlotKey | HeroTabletSlotKey | HeroMobileSlotKey;

export function useHeroSliderEditor() {
  const [isLoading, setIsLoading] = useState(true);
  const [isSavingDraft, setIsSavingDraft] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);

  const [draft, setDraft] = useState<HeroSliderPayload>(createDefaultHeroSliderPayload());
  const [published, setPublished] = useState<HeroSliderPayload>(createDefaultHeroSliderPayload());
  const [meta, setMeta] = useState<HeroSliderMeta | null>(null);

  const [selectedSlideId, setSelectedSlideId] = useState<string | null>(null);
  const [selectedDevice, setSelectedDevice] = useState<DeviceMode>("desktop");
  const [selectedSlotKey, setSelectedSlotKey] = useState<HeroSlotKey | null>(
    getDefaultSlotKeyByDevice("desktop"),
  );

  useEffect(() => {
    const run = async () => {
      try {
        setIsLoading(true);
        const response = await getHeroSliderDraftAndPublished();
        setDraft(response.draft);
        setPublished(response.published);
        setMeta(response.meta);

        if (response.draft.slides.length > 0) {
          setSelectedSlideId(response.draft.slides[0].id);
        }
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
    if (selectedSlotKey === null) return;
    const keys = getSlotKeysByDevice(selectedDevice);
    if (!keys.includes(selectedSlotKey)) {
      setSelectedSlotKey(getDefaultSlotKeyByDevice(selectedDevice));
    }
  }, [selectedDevice, selectedSlotKey]);

  useEffect(() => {
    if (draft.slides.length === 0) {
      setSelectedSlideId(null);
      return;
    }

    if (!selectedSlideId || !draft.slides.some((slide) => slide.id === selectedSlideId)) {
      setSelectedSlideId(draft.slides[0].id);
    }
  }, [draft.slides, selectedSlideId]);

  const selectedSlide = useMemo(() => {
    if (!selectedSlideId) return null;
    return draft.slides.find((slide) => slide.id === selectedSlideId) || null;
  }, [draft.slides, selectedSlideId]);

  const selectedSlot = useMemo(
    () => getSelectedSlot(selectedSlide, selectedDevice, selectedSlotKey),
    [selectedDevice, selectedSlide, selectedSlotKey],
  );

  const slotTrackingForForm = useMemo(
    () => selectedSlot?.tracking ?? EMPTY_TRACKING,
    [selectedSlot],
  );

  const updateSlides = (slides: HeroSlideConfig[]) => {
    setDraft((prev) => ({
      ...prev,
      slides: normalizeSlideOrder(slides),
    }));
  };

  const addSlide = () => {
    setDraft((prev) => {
      const nextSlides = normalizeSlideOrder([...prev.slides, createEmptySlide(prev.slides.length)]);
      setSelectedSlideId(nextSlides[nextSlides.length - 1]?.id || null);
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

      const sourceSlide = prev.slides[sourceIndex];
      const duplicated: HeroSlideConfig = {
        ...sourceSlide,
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
      const nextSlides = prev.slides.filter((slide) => slide.id !== slideId);
      const normalized = normalizeSlideOrder(nextSlides);
      if (selectedSlideId === slideId) {
        setSelectedSlideId(normalized[0]?.id || null);
      }
      return {
        ...prev,
        slides: normalized,
      };
    });
  };

  const updateSelectedSlot = (nextSlot: HeroSlotConfig) => {
    if (!selectedSlideId || selectedSlotKey === null) return;

    setDraft((prev) => ({
      ...prev,
      slides: prev.slides.map((slide) => {
        if (slide.id !== selectedSlideId) return slide;

        if (selectedDevice === "desktop") {
          return {
            ...slide,
            devices: {
              ...slide.devices,
              desktop: {
                ...slide.devices.desktop,
                slots: {
                  ...slide.devices.desktop.slots,
                  [selectedSlotKey as HeroDesktopSlotKey]: nextSlot as HeroSlotConfig,
                },
              },
            },
          };
        }

        if (selectedDevice === "tablet") {
          return {
            ...slide,
            devices: {
              ...slide.devices,
              tablet: {
                ...slide.devices.tablet,
                slots: {
                  ...slide.devices.tablet.slots,
                  [selectedSlotKey as HeroTabletSlotKey]: nextSlot as HeroSlotConfig,
                },
              },
            },
          };
        }

        return {
          ...slide,
          devices: {
            ...slide.devices,
            mobile: {
              ...slide.devices.mobile,
              slots: {
                ...slide.devices.mobile.slots,
                [selectedSlotKey as HeroMobileSlotKey]: nextSlot as HeroSlotConfig,
              },
            },
          },
        };
      }),
    }));
  };

  const updateSelectedSlide = (updater: (slide: HeroSlideConfig) => HeroSlideConfig) => {
    if (!selectedSlideId) return;

    setDraft((prev) => ({
      ...prev,
      slides: prev.slides.map((slide) => (slide.id === selectedSlideId ? updater(slide) : slide)),
    }));
  };

  const handleSaveDraft = async () => {
    try {
      setIsSavingDraft(true);
      const savedDraft = await updateHeroSliderDraft(draft);
      setDraft(savedDraft);
      toast.success("پیش‌نویس هیرو ذخیره شد");
    } catch (error) {
      console.error(error);
      toast.error("ذخیره پیش‌نویس ناموفق بود");
    } finally {
      setIsSavingDraft(false);
    }
  };

  const syncTabletMobileFromDesktop = () => {
    setDraft((prev) => ({
      ...prev,
      slides: prev.slides.map(syncTabletAndMobileFromDesktop),
    }));
    toast.success("تبلت و موبایل از دسکتاپ همگام‌سازی شدند");
  };

  const handlePublish = async () => {
    try {
      setIsPublishing(true);
      const savedDraft = await updateHeroSliderDraft(draft);
      setDraft(savedDraft);
      const result = await publishHeroSliderDraft();
      setPublished(result.published);
      setMeta(result.meta);
      toast.success("اسلایدر هیرو منتشر شد");
    } catch (error) {
      console.error(error);
      toast.error("انتشار اسلایدر ناموفق بود");
    } finally {
      setIsPublishing(false);
    }
  };

  const handleSelectedSlotLinkChange = (link: HeroSlotLink | null) => {
    if (!selectedSlot) return;
    if (selectedSlot.kind === "card") {
      updateSelectedSlot({
        ...selectedSlot,
        link,
        buttonHref: link?.href || selectedSlot.buttonHref,
      });
      return;
    }

    updateSelectedSlot({
      ...selectedSlot,
      link,
    });
  };

  const handleSelectedSlotTrackingChange = (tracking: HeroTracking) => {
    if (!selectedSlot) return;
    updateSelectedSlot({
      ...selectedSlot,
      tracking,
    });
  };

  const updateAutoplayIntervalMs = (value: number) => {
    setDraft((prev) => ({
      ...prev,
      autoplayIntervalMs: value,
    }));
  };

  return {
    isLoading,
    isSavingDraft,
    isPublishing,
    draft,
    published,
    meta,
    selectedSlide,
    selectedSlot,
    slotTrackingForForm,
    selectedSlideId,
    selectedDevice,
    selectedSlotKey,
    setSelectedSlideId,
    setSelectedDevice,
    setSelectedSlotKey,
    updateSlides,
    addSlide,
    duplicateSlide,
    deleteSlide,
    updateSelectedSlot,
    updateSelectedSlide,
    handleSaveDraft,
    handlePublish,
    syncTabletMobileFromDesktop,
    handleSelectedSlotLinkChange,
    handleSelectedSlotTrackingChange,
    updateAutoplayIntervalMs,
  };
}
