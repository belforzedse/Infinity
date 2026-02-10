"use client";

import ImageUploadField from "@/components/SuperAdmin/UpsertPage/ContentWrapper/Fields/ImageUploadField";
import type {
  HeroPaddingToken,
  HeroRadiusToken,
  HeroShadowToken,
  HeroSlotConfig,
  HeroSlotFit,
  HeroSlotLink,
  HeroOverlayToken,
} from "@/types/super-admin/heroSlider";

type Props = {
  slotKey: string;
  slot: HeroSlotConfig | null;
  onChange: (next: HeroSlotConfig) => void;
};

const radiusOptions: HeroRadiusToken[] = ["none", "sm", "md", "lg", "xl", "full"];
const overlayOptions: HeroOverlayToken[] = ["none", "soft", "medium", "strong"];
const paddingOptions: HeroPaddingToken[] = ["none", "sm", "md", "lg"];
const shadowOptions: HeroShadowToken[] = ["none", "sm", "md", "lg"];
const fitOptions: HeroSlotFit[] = ["cover", "contain"];

function parseLinkType(value: string): HeroSlotLink["type"] {
  return value === "external" ? "external" : "internal";
}

export default function SlotPanel({ slotKey, slot, onChange }: Props) {
  if (!slot) {
    return (
      <section className="rounded-2xl border border-slate-200 bg-white p-4">
        <h2 className="text-sm font-semibold text-slate-800">Slot Configuration</h2>
        <p className="mt-3 text-sm text-slate-500">Select a slot from the preview to edit.</p>
      </section>
    );
  }

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-4">
      <h2 className="text-sm font-semibold text-slate-800">Slot: {slotKey}</h2>

      <div className="mt-4 space-y-4">
        <div className="grid grid-cols-1 gap-3">
          <label className="text-xs text-slate-600">
            Title
            <input
              type="text"
              value={slot.title}
              onChange={(event) => onChange({ ...slot, title: event.target.value })}
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
            />
          </label>

          <label className="text-xs text-slate-600">
            Subtitle
            <textarea
              value={slot.subtitle}
              onChange={(event) => onChange({ ...slot, subtitle: event.target.value })}
              rows={2}
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
            />
          </label>

          <label className="text-xs text-slate-600">
            CTA Label
            <input
              type="text"
              value={slot.label}
              onChange={(event) => onChange({ ...slot, label: event.target.value })}
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
            />
          </label>
        </div>

        <div className="rounded-xl border border-slate-100 bg-slate-50 p-3">
          <h3 className="mb-2 text-xs font-semibold uppercase text-slate-500">Media</h3>
          <ImageUploadField
            value={slot.media.imageUrl}
            onChange={(value) =>
              onChange({
                ...slot,
                media: { ...slot.media, imageUrl: value },
              })
            }
          />

          <div className="mt-3 grid grid-cols-2 gap-3">
            <label className="text-xs text-slate-600">
              Alt
              <input
                type="text"
                value={slot.media.alt}
                onChange={(event) =>
                  onChange({
                    ...slot,
                    media: { ...slot.media, alt: event.target.value },
                  })
                }
                className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
              />
            </label>

            <label className="text-xs text-slate-600">
              Fit
              <select
                value={slot.media.fit}
                onChange={(event) =>
                  onChange({
                    ...slot,
                    media: { ...slot.media, fit: event.target.value as HeroSlotFit },
                  })
                }
                className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
              >
                {fitOptions.map((fit) => (
                  <option key={fit} value={fit}>
                    {fit}
                  </option>
                ))}
              </select>
            </label>

            <label className="text-xs text-slate-600">
              Object Position
              <input
                type="text"
                value={slot.media.objectPosition}
                onChange={(event) =>
                  onChange({
                    ...slot,
                    media: { ...slot.media, objectPosition: event.target.value },
                  })
                }
                className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
              />
            </label>

            <label className="text-xs text-slate-600">
              Zoom ({slot.media.zoom.toFixed(2)}x)
              <input
                type="range"
                min={1}
                max={2.5}
                step={0.01}
                value={slot.media.zoom}
                onChange={(event) =>
                  onChange({
                    ...slot,
                    media: { ...slot.media, zoom: Number(event.target.value) },
                  })
                }
                className="mt-2 w-full"
              />
            </label>

            <label className="text-xs text-slate-600">
              Focal X ({slot.media.focalX}%)
              <input
                type="range"
                min={0}
                max={100}
                value={slot.media.focalX}
                onChange={(event) =>
                  onChange({
                    ...slot,
                    media: { ...slot.media, focalX: Number(event.target.value) },
                  })
                }
                className="mt-2 w-full"
              />
            </label>

            <label className="text-xs text-slate-600">
              Focal Y ({slot.media.focalY}%)
              <input
                type="range"
                min={0}
                max={100}
                value={slot.media.focalY}
                onChange={(event) =>
                  onChange({
                    ...slot,
                    media: { ...slot.media, focalY: Number(event.target.value) },
                  })
                }
                className="mt-2 w-full"
              />
            </label>
          </div>
        </div>

        <div className="rounded-xl border border-slate-100 bg-slate-50 p-3">
          <h3 className="mb-2 text-xs font-semibold uppercase text-slate-500">Style</h3>
          <div className="grid grid-cols-2 gap-3">
            <label className="text-xs text-slate-600">
              Background Color
              <input
                type="color"
                value={slot.style.backgroundColor || "#ffffff"}
                onChange={(event) =>
                  onChange({
                    ...slot,
                    style: { ...slot.style, backgroundColor: event.target.value },
                  })
                }
                className="mt-1 h-10 w-full rounded-lg border border-slate-200"
              />
            </label>

            <div>
              <label className="text-xs text-slate-600">Background Image</label>
              <div className="mt-1">
                <ImageUploadField
                  value={slot.style.backgroundImageUrl}
                  onChange={(value) =>
                    onChange({
                      ...slot,
                      style: { ...slot.style, backgroundImageUrl: value },
                    })
                  }
                />
              </div>
            </div>

            <label className="text-xs text-slate-600">
              Radius
              <select
                value={slot.style.radiusToken}
                onChange={(event) =>
                  onChange({
                    ...slot,
                    style: {
                      ...slot.style,
                      radiusToken: event.target.value as HeroRadiusToken,
                    },
                  })
                }
                className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
              >
                {radiusOptions.map((token) => (
                  <option key={token} value={token}>
                    {token}
                  </option>
                ))}
              </select>
            </label>

            <label className="text-xs text-slate-600">
              Overlay
              <select
                value={slot.style.overlayToken}
                onChange={(event) =>
                  onChange({
                    ...slot,
                    style: {
                      ...slot.style,
                      overlayToken: event.target.value as HeroOverlayToken,
                    },
                  })
                }
                className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
              >
                {overlayOptions.map((token) => (
                  <option key={token} value={token}>
                    {token}
                  </option>
                ))}
              </select>
            </label>

            <label className="text-xs text-slate-600">
              Padding
              <select
                value={slot.style.paddingToken}
                onChange={(event) =>
                  onChange({
                    ...slot,
                    style: {
                      ...slot.style,
                      paddingToken: event.target.value as HeroPaddingToken,
                    },
                  })
                }
                className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
              >
                {paddingOptions.map((token) => (
                  <option key={token} value={token}>
                    {token}
                  </option>
                ))}
              </select>
            </label>

            <label className="text-xs text-slate-600">
              Shadow
              <select
                value={slot.style.shadowToken}
                onChange={(event) =>
                  onChange({
                    ...slot,
                    style: {
                      ...slot.style,
                      shadowToken: event.target.value as HeroShadowToken,
                    },
                  })
                }
                className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
              >
                {shadowOptions.map((token) => (
                  <option key={token} value={token}>
                    {token}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </div>

        <div className="rounded-xl border border-slate-100 bg-slate-50 p-3">
          <h3 className="mb-2 text-xs font-semibold uppercase text-slate-500">Link</h3>
          <div className="grid grid-cols-2 gap-3">
            <label className="text-xs text-slate-600">
              Link Type
              <select
                value={slot.link?.type || "internal"}
                onChange={(event) => {
                  const type = parseLinkType(event.target.value);
                  onChange({
                    ...slot,
                    link: {
                      type,
                      href: slot.link?.href || "/",
                    },
                  });
                }}
                className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
              >
                <option value="internal">internal</option>
                <option value="external">external</option>
              </select>
            </label>

            <label className="text-xs text-slate-600">
              Href
              <input
                type="text"
                value={slot.link?.href || ""}
                onChange={(event) =>
                  onChange({
                    ...slot,
                    link: {
                      type: slot.link?.type || "internal",
                      href: event.target.value,
                    },
                  })
                }
                className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                placeholder="/category/new or https://example.com"
              />
            </label>
          </div>

          <button
            type="button"
            onClick={() => onChange({ ...slot, link: null })}
            className="mt-2 text-xs text-slate-500 underline"
          >
            Remove link
          </button>
        </div>
      </div>
    </section>
  );
}
