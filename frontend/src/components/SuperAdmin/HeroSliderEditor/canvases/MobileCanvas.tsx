"use client";

import { ActionBanner } from "@/components/Hero/Banners/ActionBanner";
import { LeftBanner } from "@/components/Hero/Banners/LeftBanner";
import TextBanner from "@/components/Hero/Banners/TextBanner";
import type { CmsHeroEditorLayouts } from "@/components/Hero/config/fromCms";
import { EditableSlot } from "@/components/SuperAdmin/HeroSliderEditor/EditableSlot";
import type { SlotKey } from "@/components/SuperAdmin/HeroSliderEditor/utils";

type MobileCanvasProps = {
  layouts: CmsHeroEditorLayouts;
  selectedSlotKey: SlotKey;
  onSelectSlot: (slotKey: SlotKey, anchorEl: HTMLElement) => void;
};

export function MobileCanvas({
  layouts,
  selectedSlotKey,
  onSelectSlot,
}: MobileCanvasProps) {
  const layout = layouts.mobile;

  return (
    <div className="h-auto w-full max-w-full overflow-hidden" dir="rtl">
      <div className="flex flex-col gap-4">
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
        <div className="relative h-[360px] w-full overflow-hidden rounded-3xl">
          <EditableSlot
            slotKey="heroBanner"
            selected={selectedSlotKey === "heroBanner"}
            onSelect={(anchorEl) => onSelectSlot("heroBanner", anchorEl)}
            className="h-full w-full overflow-hidden block"
          >
            <LeftBanner spec={layout.heroBanner} className="h-full w-full" />
          </EditableSlot>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="relative overflow-visible rounded-xl">
            <EditableSlot
              slotKey="bottomActionBannerLeft"
              selected={selectedSlotKey === "bottomActionBannerLeft"}
              onSelect={(anchorEl) =>
                onSelectSlot("bottomActionBannerLeft", anchorEl)
              }
              className="h-full w-full block"
            >
              <ActionBanner spec={layout.bottomActionBannerLeft} />
            </EditableSlot>
          </div>
          <div className="relative overflow-visible rounded-xl">
            <EditableSlot
              slotKey="bottomActionBannerRight"
              selected={selectedSlotKey === "bottomActionBannerRight"}
              onSelect={(anchorEl) =>
                onSelectSlot("bottomActionBannerRight", anchorEl)
              }
              className="h-full w-full block"
            >
              <ActionBanner spec={layout.bottomActionBannerRight} />
            </EditableSlot>
          </div>
        </div>
      </div>
    </div>
  );
}
