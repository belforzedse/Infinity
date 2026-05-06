"use client";

import type { HeroCardSlot, HeroSlotConfig } from "@/types/super-admin/heroSlider";
import { SlotTextField } from "./SlotTextField";

interface ImageSettingsProps {
  slot: HeroCardSlot;
  onChange: (next: HeroSlotConfig) => void;
}

export function ImageSettings({ slot, onChange }: ImageSettingsProps) {
  return (
    <>
      <SlotTextField
        label="آدرس تصویر لینک"
        value={slot.imageHref}
        onChange={(value) => onChange({ ...slot, imageHref: value })}
      />
      <SlotTextField
        label="کلاس تصویر"
        value={slot.imageClassName}
        onChange={(value) => onChange({ ...slot, imageClassName: value })}
      />
      <SlotTextField
        label="موقعیت تصویر"
        value={slot.imageObjectPosition}
        onChange={(value) => onChange({ ...slot, imageObjectPosition: value })}
      />
      <SlotTextField
        label="عرض تصویر"
        value={slot.imageCustomWidth}
        onChange={(value) => onChange({ ...slot, imageCustomWidth: value })}
      />
      <SlotTextField
        label="ارتفاع تصویر"
        value={slot.imageCustomHeight}
        onChange={(value) => onChange({ ...slot, imageCustomHeight: value })}
      />
    </>
  );
}
