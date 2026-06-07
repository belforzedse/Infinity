"use client";

import ContentWrapper from "@/components/SuperAdmin/Layout/ContentWrapper";
import {
  PublishBar,
  SchedulePanel,
  SlideList,
  TemplatePreview,
} from "@/components/SuperAdmin/HeroSliderEditor";
import { useHeroSliderEditor } from "@/hooks/useHeroSliderEditor";

export default function HeroSliderCustomizationPage() {
  const editor = useHeroSliderEditor();

  if (editor.isLoading) {
    return <div>در حال بارگذاری تنظیمات اسلایدر هیرو...</div>;
  }

  return (
    <ContentWrapper title="سفارشی‌سازی اسلایدر هیرو">
      <div className="space-y-4">
        <PublishBar
          draft={editor.draft}
          published={editor.published}
          meta={editor.meta}
          isSavingDraft={editor.isSavingDraft}
          isPublishing={editor.isPublishing}
          onSaveDraft={editor.handleSaveDraft}
          onPublish={editor.handlePublish}
          onAddSlide={editor.addSlide}
        />

        <TemplatePreview
          slide={editor.selectedSlide}
          onChangeSlide={(nextSlide) => editor.updateSelectedSlide(() => nextSlide)}
          onImageChange={editor.persistSelectedSlide}
        />

        <SlideList
          slides={editor.draft.slides}
          selectedSlideId={editor.selectedSlideId}
          onSelectSlide={editor.setSelectedSlideId}
          onAddSlide={editor.addSlide}
          onDuplicateSlide={editor.duplicateSlide}
          onDeleteSlide={editor.deleteSlide}
          onReorderSlides={editor.updateSlides}
          orientation="horizontal"
        />

        <div className="grid grid-cols-12 gap-4">
          <div className="col-span-12">
            <SchedulePanel
              schedule={editor.selectedSlide?.schedule || { timezone: "Asia/Tehran" }}
              onChange={(schedule) =>
                editor.updateSelectedSlide((slide) => ({
                  ...slide,
                  schedule,
                }))
              }
              autoplayEligible={editor.selectedSlide?.autoplayEligible ?? true}
              onAutoplayEligibleChange={(value) =>
                editor.updateSelectedSlide((slide) => ({
                  ...slide,
                  autoplayEligible: value,
                }))
              }
              isActive={editor.selectedSlide?.isActive ?? true}
              onActiveChange={(value) =>
                editor.updateSelectedSlide((slide) => ({
                  ...slide,
                  isActive: value,
                }))
              }
              order={editor.selectedSlide?.order ?? 0}
              onOrderChange={(value) =>
                editor.updateSelectedSlide((slide) => ({
                  ...slide,
                  order: value,
                }))
              }
              globalAutoplayIntervalMs={editor.draft.autoplayIntervalMs}
              onGlobalAutoplayIntervalChange={editor.updateAutoplayIntervalMs}
              tracking={
                editor.selectedSlide?.tracking || {
                  campaign: "",
                  source: "",
                  medium: "",
                  content: "",
                  custom: {},
                }
              }
              onTrackingChange={(tracking) =>
                editor.updateSelectedSlide((slide) => ({
                  ...slide,
                  tracking,
                }))
              }
            />
          </div>
        </div>
      </div>
    </ContentWrapper>
  );
}
