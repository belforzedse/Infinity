"use client";

import { HERO_SCHEDULE_TIMEZONE, type HeroSlideSchedule } from "@/types/super-admin/heroSlider";

type Props = {
  schedule: HeroSlideSchedule;
  onChange: (schedule: HeroSlideSchedule) => void;
  autoplayEligible: boolean;
  onAutoplayEligibleChange: (value: boolean) => void;
  isActive: boolean;
  onActiveChange: (value: boolean) => void;
  order: number;
  onOrderChange: (value: number) => void;
};

const TEHRAN_OFFSET_MINUTES = 210;

function utcToTehranInput(value?: string): string {
  if (!value) return "";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "";

  const tehranMs = parsed.getTime() + TEHRAN_OFFSET_MINUTES * 60 * 1000;
  const tehran = new Date(tehranMs);

  const yyyy = tehran.getUTCFullYear();
  const mm = String(tehran.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(tehran.getUTCDate()).padStart(2, "0");
  const hh = String(tehran.getUTCHours()).padStart(2, "0");
  const min = String(tehran.getUTCMinutes()).padStart(2, "0");

  return `${yyyy}-${mm}-${dd}T${hh}:${min}`;
}

function tehranInputToUtc(value: string): string | undefined {
  const trimmed = value.trim();
  if (!trimmed) return undefined;

  const parsed = new Date(`${trimmed}:00+03:30`);
  if (Number.isNaN(parsed.getTime())) return undefined;
  return parsed.toISOString();
}

export default function SchedulePanel({
  schedule,
  onChange,
  autoplayEligible,
  onAutoplayEligibleChange,
  isActive,
  onActiveChange,
  order,
  onOrderChange,
}: Props) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-4">
      <h2 className="text-sm font-semibold text-slate-800">Slide Settings</h2>
      <p className="mt-1 text-xs text-slate-500">Timezone: {HERO_SCHEDULE_TIMEZONE}</p>

      <div className="mt-4 space-y-4">
        <label className="flex items-center justify-between rounded-lg border border-slate-100 bg-slate-50 px-3 py-2 text-sm text-slate-700">
          <span>Active</span>
          <input
            type="checkbox"
            checked={isActive}
            onChange={(event) => onActiveChange(event.target.checked)}
            className="h-4 w-4"
          />
        </label>

        <label className="flex items-center justify-between rounded-lg border border-slate-100 bg-slate-50 px-3 py-2 text-sm text-slate-700">
          <span>Autoplay Eligible</span>
          <input
            type="checkbox"
            checked={autoplayEligible}
            onChange={(event) => onAutoplayEligibleChange(event.target.checked)}
            className="h-4 w-4"
          />
        </label>

        <label className="text-xs text-slate-600">
          Order
          <input
            type="number"
            value={order}
            onChange={(event) => onOrderChange(Number(event.target.value) || 0)}
            className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
          />
        </label>

        <label className="text-xs text-slate-600">
          Start (Tehran)
          <input
            type="datetime-local"
            value={utcToTehranInput(schedule.startAtUtc)}
            onChange={(event) =>
              onChange({
                timezone: HERO_SCHEDULE_TIMEZONE,
                startAtUtc: tehranInputToUtc(event.target.value),
                endAtUtc: schedule.endAtUtc,
              })
            }
            className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
          />
        </label>

        <label className="text-xs text-slate-600">
          End (Tehran)
          <input
            type="datetime-local"
            value={utcToTehranInput(schedule.endAtUtc)}
            onChange={(event) =>
              onChange({
                timezone: HERO_SCHEDULE_TIMEZONE,
                startAtUtc: schedule.startAtUtc,
                endAtUtc: tehranInputToUtc(event.target.value),
              })
            }
            className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
          />
        </label>

        <button
          type="button"
          onClick={() =>
            onChange({
              timezone: HERO_SCHEDULE_TIMEZONE,
            })
          }
          className="text-xs text-slate-500 underline"
        >
          Clear schedule window
        </button>
      </div>
    </section>
  );
}
