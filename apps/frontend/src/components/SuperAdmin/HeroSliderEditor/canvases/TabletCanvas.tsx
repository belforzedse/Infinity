"use client";

import { ActionBanner } from "@/components/Hero/Banners/ActionBanner";
import { LeftBanner } from "@/components/Hero/Banners/LeftBanner";
import TextBanner from "@/components/Hero/Banners/TextBanner";
import type { CmsHeroEditorLayouts } from "@/components/Hero/config/fromCms";
import { EditableSlot } from "@/components/SuperAdmin/HeroSliderEditor/EditableSlot";
import type { SlotKey } from "@/components/SuperAdmin/HeroSliderEditor/utils";

type TabletCanvasProps = {
  layouts: CmsHeroEditorLayouts;
  selectedSlotKey: SlotKey | null;
  onSelectSlot: (slotKey: SlotKey, anchorEl: HTMLElement) => void;
};

export function TabletCanvas({
  layouts,
  selectedSlotKey,
  onSelectSlot,
}: TabletCanvasProps) {
  const layout = layouts.tablet;

  return (
    <div className="h-auto w-full max-w-full overflow-hidden">
      <div className="grid grid-cols-1 gap-4">
        <div className="overflow-hidden rounded-3xl">
          <EditableSlot
            slotKey="primaryBanner"
            selected={selectedSlotKey === "primaryBanner"}
            onSelect={(anchorEl) => onSelectSlot("primaryBanner", anchorEl)}
            className="block"
          >
            <TextBanner
              title={layout.primaryBanner.title}
              subtitle={layout.primaryBanner.subtitle}
              marginBottomPx={layout.primaryBanner.marginBottomPx}
              className={layout.primaryBanner.className}
              titleClassName={layout.primaryBanner.titleClassName}
              subtitleClassName={layout.primaryBanner.subtitleClassName}
              colors={layout.primaryBanner.colors}
              typography={layout.primaryBanner.typography}
            />
          </EditableSlot>
        </div>
        <div className="grid gap-4 grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] [direction:ltr]">
          <div className="flex flex-col gap-4 h-full justify-end" dir="rtl">
            <div className="relative aspect-[176/118] overflow-hidden rounded-[20px] md:aspect-auto md:min-h-[118px]">
              <EditableSlot
                slotKey="bottomActionBannerLeft"
                selected={selectedSlotKey === "bottomActionBannerLeft"}
                onSelect={(anchorEl) =>
                  onSelectSlot("bottomActionBannerLeft", anchorEl)
                }
                className="block h-full w-full"
              >
                <ActionBanner spec={layout.bottomActionBannerLeft} variant="compact" />
              </EditableSlot>
            </div>
            <div className="relative aspect-[176/118] overflow-hidden rounded-[20px] md:aspect-auto md:min-h-[118px]">
              <EditableSlot
                slotKey="bottomActionBannerRight"
                selected={selectedSlotKey === "bottomActionBannerRight"}
                onSelect={(anchorEl) =>
                  onSelectSlot("bottomActionBannerRight", anchorEl)
                }
                className="block h-full w-full"
              >
                <ActionBanner spec={layout.bottomActionBannerRight} variant="compact" />
              </EditableSlot>
            </div>
          </div>
          <div
            className="relative aspect-square overflow-hidden rounded-[20px]"
            dir="rtl"
          >
            <EditableSlot
              slotKey="heroBanner"
              selected={selectedSlotKey === "heroBanner"}
              onSelect={(anchorEl) => onSelectSlot("heroBanner", anchorEl)}
              className="block h-full w-full"
            >
              <LeftBanner spec={layout.heroBanner} className="h-full w-full" />
            </EditableSlot>
          </div>
        </div>
      </div>
    </div>
  );
}
