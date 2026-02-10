"use client";

import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import ContentWrapper from "@/components/SuperAdmin/Layout/ContentWrapper";
import {
  PublishBar,
  SchedulePanel,
  SlideList,
  SlotPanel,
  TemplatePreview,
  getDefaultSlotKeyByDevice,
  getSlotKeysByDevice,
} from "@/components/SuperAdmin/HeroSliderEditor";
import {
  createDefaultHeroSliderPayload,
  normalizeHeroSliderPayload,
  type HeroSlideConfig,
  type HeroSliderMeta,
  type HeroSliderPayload,
} from "@/types/super-admin/heroSlider";
import {
  getHeroSliderDraftAndPublished,
  publishHeroSliderDraft,
  updateHeroSliderDraft,
} from "@/services/super-admin/settings/hero-slider";

type DeviceMode = "desktop" | "tablet" | "mobile";

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

export default function HeroSliderCustomizationPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [isSavingDraft, setIsSavingDraft] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);

  const [draft, setDraft] = useState<HeroSliderPayload>(createDefaultHeroSliderPayload());
  const [published, setPublished] = useState<HeroSliderPayload>(createDefaultHeroSliderPayload());
  const [meta, setMeta] = useState<HeroSliderMeta | null>(null);

  const [selectedSlideId, setSelectedSlideId] = useState<string | null>(null);
  const [selectedDevice, setSelectedDevice] = useState<DeviceMode>("desktop");
  const [selectedSlotKey, setSelectedSlotKey] = useState(getDefaultSlotKeyByDevice("desktop"));

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
        toast.error("Failed to load hero slider settings");
      } finally {
        setIsLoading(false);
      }
    };

    run();
  }, []);

  useEffect(() => {
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

  const selectedSlot = useMemo(() => {
    if (!selectedSlide) return null;
    const deviceData = selectedSlide.devices[selectedDevice] as any;
    return deviceData?.slots?.[selectedSlotKey] || null;
  }, [selectedDevice, selectedSlotKey, selectedSlide]);

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

  const updateSelectedSlot = (nextSlot: any) => {
    if (!selectedSlideId) return;

    setDraft((prev) => ({
      ...prev,
      slides: prev.slides.map((slide) => {
        if (slide.id !== selectedSlideId) return slide;

        const deviceData = slide.devices[selectedDevice] as any;
        return {
          ...slide,
          devices: {
            ...slide.devices,
            [selectedDevice]: {
              ...deviceData,
              slots: {
                ...deviceData.slots,
                [selectedSlotKey]: nextSlot,
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
      toast.success("Hero draft saved");
    } catch (error) {
      console.error(error);
      toast.error("Failed to save hero draft");
    } finally {
      setIsSavingDraft(false);
    }
  };

  const handlePublish = async () => {
    try {
      setIsPublishing(true);
      const result = await publishHeroSliderDraft();
      setPublished(result.published);
      setMeta(result.meta);
      toast.success("Hero slider published");
    } catch (error) {
      console.error(error);
      toast.error("Failed to publish hero slider");
    } finally {
      setIsPublishing(false);
    }
  };

  if (isLoading) {
    return <div>Loading hero slider settings...</div>;
  }

  return (
    <ContentWrapper title="Hero Slider Customization">
      <div className="space-y-4">
        <PublishBar
          draft={draft}
          published={published}
          meta={meta}
          isSavingDraft={isSavingDraft}
          isPublishing={isPublishing}
          onSaveDraft={handleSaveDraft}
          onPublish={handlePublish}
          onAddSlide={addSlide}
        />

        <div className="grid grid-cols-12 gap-4">
          <div className="col-span-12 xl:col-span-3">
            <SlideList
              slides={draft.slides}
              selectedSlideId={selectedSlideId}
              onSelectSlide={setSelectedSlideId}
              onAddSlide={addSlide}
              onDuplicateSlide={duplicateSlide}
              onDeleteSlide={deleteSlide}
              onReorderSlides={updateSlides}
            />
          </div>

          <div className="col-span-12 space-y-4 xl:col-span-5">
            <section className="rounded-2xl border border-slate-200 bg-white p-3">
              <div className="flex items-center gap-2">
                {(["desktop", "tablet", "mobile"] as DeviceMode[]).map((device) => (
                  <button
                    key={device}
                    type="button"
                    onClick={() => setSelectedDevice(device)}
                    className={`rounded-lg px-3 py-1.5 text-xs font-medium transition ${
                      selectedDevice === device
                        ? "bg-pink-500 text-white"
                        : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                    }`}
                  >
                    {device}
                  </button>
                ))}
              </div>
            </section>

            <TemplatePreview
              slide={selectedSlide}
              device={selectedDevice}
              selectedSlotKey={selectedSlotKey}
              onSelectSlot={(slotKey) => setSelectedSlotKey(slotKey)}
            />
          </div>

          <div className="col-span-12 space-y-4 xl:col-span-4">
            <SchedulePanel
              schedule={selectedSlide?.schedule || { timezone: "Asia/Tehran" }}
              onChange={(schedule) =>
                updateSelectedSlide((slide) => ({
                  ...slide,
                  schedule,
                }))
              }
              autoplayEligible={selectedSlide?.autoplayEligible ?? true}
              onAutoplayEligibleChange={(value) =>
                updateSelectedSlide((slide) => ({
                  ...slide,
                  autoplayEligible: value,
                }))
              }
              isActive={selectedSlide?.isActive ?? true}
              onActiveChange={(value) =>
                updateSelectedSlide((slide) => ({
                  ...slide,
                  isActive: value,
                }))
              }
              order={selectedSlide?.order ?? 0}
              onOrderChange={(value) =>
                updateSelectedSlide((slide) => ({
                  ...slide,
                  order: value,
                }))
              }
            />

            <SlotPanel
              slotKey={selectedSlotKey}
              slot={selectedSlot}
              onChange={updateSelectedSlot}
            />
          </div>
        </div>
      </div>
    </ContentWrapper>
  );
}
