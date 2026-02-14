"use client";

import { ActionBanner } from "@/components/Hero/Banners/ActionBanner";
import { LeftBanner } from "@/components/Hero/Banners/LeftBanner";
import TextBanner from "@/components/Hero/Banners/TextBanner";
import type { CmsHeroEditorLayouts } from "@/components/Hero/config/fromCms";
import { EditableSlot } from "../EditableSlot";
import type { SlotKey } from "../utils";

type DesktopCanvasProps = {
  layouts: CmsHeroEditorLayouts;
  selectedSlotKey: SlotKey;
  onSelectSlot: (slotKey: SlotKey, anchorEl: HTMLElement) => void;
};

export function DesktopCanvas({
  layouts,
  selectedSlotKey,
  onSelectSlot,
}: DesktopCanvasProps) {
  const layout = layouts.desktop;

  return (
    <div className="h-[480px] w-full max-w-[1358px] overflow-hidden mx-auto">
      <div className="relative h-full w-full">
        <div className="flex h-full items-stretch gap-0">
          <div className="w-7/12 mt-[50px] flex-none overflow-hidden h-full">
            <div className="flex flex-col h-full">
              <div>
                <EditableSlot
                  slotKey="topLeftTextBanner"
                  selected={selectedSlotKey === "topLeftTextBanner"}
                  onSelect={(anchorEl) => onSelectSlot("topLeftTextBanner", anchorEl)}
                >
                  <TextBanner
                    title={layout.topLeftTextBanner.title}
                    subtitle={layout.topLeftTextBanner.subtitle}
                    marginBottomPx={layout.topLeftTextBanner.marginBottomPx}
                    className={layout.topLeftTextBanner.className}
                    titleClassName={layout.topLeftTextBanner.titleClassName}
                    subtitleClassName={layout.topLeftTextBanner.subtitleClassName}
                    colors={layout.topLeftTextBanner.colors}
                    typography={layout.topLeftTextBanner.typography}
                  />
                </EditableSlot>
              </div>
              <div className="flex-1 grid grid-cols-2 gap-3 items-end">
                <div className="h-full overflow-hidden rounded-lg">
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
                <div className="h-full overflow-hidden rounded-lg">
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
          <div className="w-5/12 flex-none overflow-hidden">
            <div className="h-full w-full overflow-hidden rounded-lg">
              <EditableSlot
                slotKey="rightBanner"
                selected={selectedSlotKey === "rightBanner"}
                onSelect={(anchorEl) => onSelectSlot("rightBanner", anchorEl)}
                className="h-full w-full block"
              >
                <LeftBanner spec={layout.rightBanner} className="h-full w-full" />
              </EditableSlot>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
