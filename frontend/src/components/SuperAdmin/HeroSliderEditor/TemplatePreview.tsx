"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Pencil, PanelLeftClose, PanelRight } from "lucide-react";
import { mapHeroSlideToLayoutsForEditor } from "@/components/Hero/config/fromCms";
import {
  HERO_DESKTOP_SLOT_KEYS,
  HERO_MOBILE_SLOT_KEYS,
  HERO_TABLET_SLOT_KEYS,
  type HeroDesktopSlotKey,
  type HeroMobileSlotKey,
  type HeroSlideConfig,
  type HeroSlotConfig,
  type HeroTabletSlotKey,
} from "@/types/super-admin/heroSlider";
import { DesktopCanvas, MobileCanvas, TabletCanvas } from "./canvases";
import { SlotEditorContent } from "./editors";
import { getFrameByDevice, makeLayoutsSafe, slotLabelMap } from "./utils";
import type { DeviceMode, SlotKey } from "./utils";

export type { DeviceMode, SlotKey };

type Props = {
  slide: HeroSlideConfig | null;
  device: DeviceMode;
  selectedSlotKey: SlotKey | null;
  onSelectSlot: (slotKey: SlotKey) => void;
  onDeselectSlot?: () => void;
  onChangeSelectedSlot: (next: HeroSlotConfig) => void;
  onDeviceChange?: (device: DeviceMode) => void;
  useSidePanel?: boolean;
};

export default function TemplatePreview({
  slide,
  device,
  selectedSlotKey,
  onSelectSlot,
  onDeselectSlot,
  onChangeSelectedSlot,
  onDeviceChange,
  useSidePanel = true,
}: Props) {
  const viewportRef = useRef<HTMLDivElement | null>(null);
  const [viewportWidth, setViewportWidth] = useState(0);
  const [isPanelCollapsed, setIsPanelCollapsed] = useState(false);

  const frame = useMemo(() => getFrameByDevice(device), [device]);
  const panelOpenScaleFactor = useSidePanel && !isPanelCollapsed ? 0.9 : 1;
  const scale = useMemo(() => {
    if (!viewportWidth) return 1;
    const fitScale = Math.min(1, viewportWidth / frame.width);
    return fitScale * panelOpenScaleFactor;
  }, [frame.width, viewportWidth, panelOpenScaleFactor]);

  useEffect(() => {
    const target = viewportRef.current;
    if (!target) return;

    let debounceId: ReturnType<typeof setTimeout> | null = null;
    const resizeObserver = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (!entry) return;
      const w = entry.contentRect.width;
      if (debounceId) clearTimeout(debounceId);
      debounceId = setTimeout(() => {
        debounceId = null;
        setViewportWidth(w);
      }, 80);
    });

    resizeObserver.observe(target);
    return () => {
      if (debounceId) clearTimeout(debounceId);
      resizeObserver.disconnect();
    };
  }, []);

  const layouts = useMemo(() => {
    if (!slide) return null;
    return makeLayoutsSafe(mapHeroSlideToLayoutsForEditor(slide));
  }, [slide]);

  const selectedSlot = useMemo(() => {
    if (!slide || selectedSlotKey === null) return null;
    if (device === "desktop")
      return slide.devices.desktop.slots[selectedSlotKey as HeroDesktopSlotKey] || null;
    if (device === "tablet")
      return slide.devices.tablet.slots[selectedSlotKey as HeroTabletSlotKey] || null;
    return slide.devices.mobile.slots[selectedSlotKey as HeroMobileSlotKey] || null;
  }, [device, selectedSlotKey, slide]);

  const handleSlotSelect = (slotKey: SlotKey) => {
    onSelectSlot(slotKey);
  };

  const deviceLabel =
    device === "desktop" ? "دسکتاپ" : device === "tablet" ? "تبلت" : "موبایل";

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-4">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-sm font-semibold text-slate-800">پیش‌نمایش قالب</h2>
        <div className="flex items-center gap-2">
          {onDeviceChange ? (
            (["desktop", "tablet", "mobile"] as DeviceMode[]).map((d) => (
              <button
                key={d}
                type="button"
                onClick={() => onDeviceChange(d)}
                className={`rounded-lg px-3 py-1.5 text-xs font-medium transition ${
                  device === d
                    ? "bg-pink-500 text-white"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                {d === "desktop" ? "دسکتاپ" : d === "tablet" ? "تبلت" : "موبایل"}
              </button>
            ))
          ) : (
            <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-medium text-slate-600">
              {deviceLabel}
            </span>
          )}
          {slide && layouts && selectedSlotKey !== null && (
            <span className="rounded-lg bg-pink-50 px-2.5 py-1 text-[11px] font-medium text-pink-700">
              در حال ویرایش: {slotLabelMap[selectedSlotKey] ?? "اسلات"}
            </span>
          )}
          {useSidePanel && (
            <button
              type="button"
              onClick={() => setIsPanelCollapsed((prev) => !prev)}
              className="rounded-lg p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-700"
              title={isPanelCollapsed ? "نمایش پنل ویرایش" : "بستن پنل ویرایش"}
              aria-label={isPanelCollapsed ? "نمایش پنل ویرایش" : "بستن پنل ویرایش"}
            >
              {isPanelCollapsed ? (
                <PanelRight className="h-4 w-4" aria-hidden />
              ) : (
                <PanelLeftClose className="h-4 w-4" aria-hidden />
              )}
            </button>
          )}
        </div>
      </div>

      {!slide || !layouts ? (
        <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-slate-200 bg-slate-50/50 py-16 px-6 text-center">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100">
            <Pencil className="h-8 w-8 text-slate-400" aria-hidden />
          </div>
          <p className="mb-2 text-sm font-medium text-slate-700">هنوز اسلایدی وجود ندارد</p>
          <p className="max-w-sm text-xs text-slate-500">
            برای شروع، از دکمه «افزودن اسلاید» در بالا یک اسلاید جدید اضافه کنید.
          </p>
        </div>
      ) : (
        <div
          className={`flex flex-col gap-4 overflow-x-hidden ${useSidePanel ? "xl:flex-row" : ""}`}
        >
          <div className="min-w-0 flex-1 space-y-3">
            <p className="text-sm font-medium text-slate-600">
              پیش‌نمایش زنده — روی هر بخش کلیک کنید تا ویرایش شود
            </p>

            <div
              ref={viewportRef}
              className="w-full min-w-0 overflow-hidden rounded-xl border border-slate-200 bg-slate-50 p-3"
            >
              <div className="flex flex-col overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
                <div className="flex shrink-0 items-center gap-2 border-b border-slate-200 bg-slate-50 px-3 py-2">
                  <div className="flex gap-1.5">
                    <div className="h-2.5 w-2.5 rounded-full bg-slate-300" />
                    <div className="h-2.5 w-2.5 rounded-full bg-slate-300" />
                    <div className="h-2.5 w-2.5 rounded-full bg-slate-300" />
                  </div>
                  <div className="flex-1 rounded-md bg-white px-3 py-1.5 text-[11px] text-slate-400">
                    infinitycolor.co
                  </div>
                </div>
                <div className="flex min-h-0 flex-1 overflow-hidden">
                  <div
                    className="w-full overflow-hidden transition-[height] duration-300 ease-out"
                    style={{
                      height: frame.height * scale,
                    }}
                  >
                    <div
                      className="transition-transform duration-300 ease-out"
                      style={{
                        width: frame.width,
                        height: frame.height,
                        transform: `scale(${scale})`,
                        transformOrigin: "top right",
                      }}
                      onClickCapture={(event) => {
                        const target = event.target as HTMLElement;
                        if (target.closest("a")) {
                          event.preventDefault();
                          event.stopPropagation();
                        }
                      }}
                    >
                      {device === "desktop" ? (
                        <DesktopCanvas
                          layouts={layouts}
                          selectedSlotKey={selectedSlotKey ?? HERO_DESKTOP_SLOT_KEYS[0]}
                          onSelectSlot={handleSlotSelect}
                        />
                      ) : null}

                      {device === "tablet" ? (
                        <TabletCanvas
                          layouts={layouts}
                          selectedSlotKey={selectedSlotKey ?? HERO_TABLET_SLOT_KEYS[0]}
                          onSelectSlot={handleSlotSelect}
                        />
                      ) : null}

                      {device === "mobile" ? (
                        <MobileCanvas
                          layouts={layouts}
                          selectedSlotKey={selectedSlotKey ?? HERO_MOBILE_SLOT_KEYS[0]}
                          onSelectSlot={handleSlotSelect}
                        />
                      ) : null}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {useSidePanel ? (
            <motion.div
              className="flex flex-shrink-0 flex-col overflow-hidden rounded-xl border border-slate-200 bg-white xl:min-h-[400px]"
              initial={false}
              animate={{
                width: isPanelCollapsed ? 0 : 320,
                opacity: isPanelCollapsed ? 0 : 1,
              }}
              transition={{
                type: "spring",
                stiffness: 400,
                damping: 35,
              }}
              style={{ minWidth: 0 }}
            >
              <div className="w-[320px] shrink-0">
                {selectedSlot && onDeselectSlot ? (
                  <div className="flex h-full min-h-[320px] flex-col overflow-hidden p-3 xl:max-h-[min(70vh,680px)]">
                    <SlotEditorContent
                      slot={selectedSlot}
                      onChange={onChangeSelectedSlot}
                      onClose={onDeselectSlot}
                    />
                  </div>
                ) : (
                  <div className="flex flex-1 flex-col items-center justify-center p-6 text-center">
                    <p className="text-sm text-slate-500">یک بخش را برای ویرایش انتخاب کنید</p>
                  </div>
                )}
              </div>
            </motion.div>
          ) : null}
        </div>
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
