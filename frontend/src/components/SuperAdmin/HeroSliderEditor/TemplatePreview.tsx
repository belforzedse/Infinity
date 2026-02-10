"use client";

import {
  HERO_DESKTOP_SLOT_KEYS,
  HERO_MOBILE_SLOT_KEYS,
  HERO_TABLET_SLOT_KEYS,
  type HeroDesktopSlotKey,
  type HeroMobileSlotKey,
  type HeroSlideConfig,
  type HeroTabletSlotKey,
} from "@/types/super-admin/heroSlider";

type DeviceMode = "desktop" | "tablet" | "mobile";
type SlotKey = HeroDesktopSlotKey | HeroTabletSlotKey | HeroMobileSlotKey;

type Props = {
  slide: HeroSlideConfig | null;
  device: DeviceMode;
  selectedSlotKey: SlotKey;
  onSelectSlot: (slotKey: SlotKey) => void;
};

const slotLabelMap: Record<string, string> = {
  topLeftTextBanner: "Headline",
  bottomActionBannerLeft: "Card #1",
  bottomActionBannerRight: "Card #2",
  rightBanner: "Main Visual",
  primaryBanner: "Primary Text",
  heroBanner: "Hero Visual",
};

function SlotCard({
  slotKey,
  title,
  subtitle,
  selected,
  onClick,
}: {
  slotKey: SlotKey;
  title: string;
  subtitle: string;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex min-h-[96px] flex-col items-start justify-between rounded-xl border p-3 text-left transition ${
        selected
          ? "border-pink-400 bg-pink-50 shadow-sm"
          : "border-slate-200 bg-white hover:border-pink-300"
      }`}
      data-slot={slotKey}
    >
      <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
        {slotLabelMap[slotKey] || slotKey}
      </span>
      <div className="space-y-1">
        <div className="line-clamp-1 text-sm font-medium text-slate-800">{title || "(empty title)"}</div>
        <div className="line-clamp-2 text-xs text-slate-500">{subtitle || "(empty subtitle)"}</div>
      </div>
    </button>
  );
}

export default function TemplatePreview({
  slide,
  device,
  selectedSlotKey,
  onSelectSlot,
}: Props) {
  const desktopSlots = slide?.devices.desktop.slots;
  const tabletSlots = slide?.devices.tablet.slots;
  const mobileSlots = slide?.devices.mobile.slots;

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-4">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-slate-800">Template Preview</h2>
        <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-medium text-slate-600">
          {device}
        </span>
      </div>

      {!slide ? (
        <div className="rounded-lg border border-dashed border-slate-200 p-8 text-center text-sm text-slate-500">
          Select or create a slide to start editing.
        </div>
      ) : (
        <>
          {device === "desktop" && (
            <div className="grid grid-cols-12 gap-2">
              <div className="col-span-7 space-y-2">
                <SlotCard
                  slotKey="topLeftTextBanner"
                  title={desktopSlots?.topLeftTextBanner.title || ""}
                  subtitle={desktopSlots?.topLeftTextBanner.subtitle || ""}
                  selected={selectedSlotKey === "topLeftTextBanner"}
                  onClick={() => onSelectSlot("topLeftTextBanner")}
                />
                <div className="grid grid-cols-2 gap-2">
                  <SlotCard
                    slotKey="bottomActionBannerLeft"
                    title={desktopSlots?.bottomActionBannerLeft.title || ""}
                    subtitle={desktopSlots?.bottomActionBannerLeft.subtitle || ""}
                    selected={selectedSlotKey === "bottomActionBannerLeft"}
                    onClick={() => onSelectSlot("bottomActionBannerLeft")}
                  />
                  <SlotCard
                    slotKey="bottomActionBannerRight"
                    title={desktopSlots?.bottomActionBannerRight.title || ""}
                    subtitle={desktopSlots?.bottomActionBannerRight.subtitle || ""}
                    selected={selectedSlotKey === "bottomActionBannerRight"}
                    onClick={() => onSelectSlot("bottomActionBannerRight")}
                  />
                </div>
              </div>
              <div className="col-span-5">
                <SlotCard
                  slotKey="rightBanner"
                  title={desktopSlots?.rightBanner.title || ""}
                  subtitle={desktopSlots?.rightBanner.subtitle || ""}
                  selected={selectedSlotKey === "rightBanner"}
                  onClick={() => onSelectSlot("rightBanner")}
                />
              </div>
            </div>
          )}

          {device === "tablet" && (
            <div className="grid grid-cols-2 gap-2">
              <div className="col-span-2">
                <SlotCard
                  slotKey="primaryBanner"
                  title={tabletSlots?.primaryBanner.title || ""}
                  subtitle={tabletSlots?.primaryBanner.subtitle || ""}
                  selected={selectedSlotKey === "primaryBanner"}
                  onClick={() => onSelectSlot("primaryBanner")}
                />
              </div>
              <div className="space-y-2">
                <SlotCard
                  slotKey="bottomActionBannerLeft"
                  title={tabletSlots?.bottomActionBannerLeft.title || ""}
                  subtitle={tabletSlots?.bottomActionBannerLeft.subtitle || ""}
                  selected={selectedSlotKey === "bottomActionBannerLeft"}
                  onClick={() => onSelectSlot("bottomActionBannerLeft")}
                />
                <SlotCard
                  slotKey="bottomActionBannerRight"
                  title={tabletSlots?.bottomActionBannerRight.title || ""}
                  subtitle={tabletSlots?.bottomActionBannerRight.subtitle || ""}
                  selected={selectedSlotKey === "bottomActionBannerRight"}
                  onClick={() => onSelectSlot("bottomActionBannerRight")}
                />
              </div>
              <SlotCard
                slotKey="heroBanner"
                title={tabletSlots?.heroBanner.title || ""}
                subtitle={tabletSlots?.heroBanner.subtitle || ""}
                selected={selectedSlotKey === "heroBanner"}
                onClick={() => onSelectSlot("heroBanner")}
              />
            </div>
          )}

          {device === "mobile" && (
            <div className="grid grid-cols-1 gap-2">
              {HERO_MOBILE_SLOT_KEYS.map((slotKey) => (
                <SlotCard
                  key={slotKey}
                  slotKey={slotKey}
                  title={mobileSlots?.[slotKey].title || ""}
                  subtitle={mobileSlots?.[slotKey].subtitle || ""}
                  selected={selectedSlotKey === slotKey}
                  onClick={() => onSelectSlot(slotKey)}
                />
              ))}
            </div>
          )}
        </>
      )}
    </section>
  );
}

export function getDefaultSlotKeyByDevice(device: DeviceMode): SlotKey {
  if (device === "desktop") return HERO_DESKTOP_SLOT_KEYS[0];
  if (device === "tablet") return HERO_TABLET_SLOT_KEYS[0];
  return HERO_MOBILE_SLOT_KEYS[0];
}

export function getSlotKeysByDevice(device: DeviceMode): readonly SlotKey[] {
  if (device === "desktop") return HERO_DESKTOP_SLOT_KEYS;
  if (device === "tablet") return HERO_TABLET_SLOT_KEYS;
  return HERO_MOBILE_SLOT_KEYS;
}
