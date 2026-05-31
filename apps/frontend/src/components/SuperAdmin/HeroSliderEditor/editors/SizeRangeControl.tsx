"use client";

type SizeRangeControlProps = {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  unit: string;
  onChange: (next: number) => void;
  disabled?: boolean;
};

function clamp(value: number, min: number, max: number): number {
  if (!Number.isFinite(value)) return min;
  return Math.min(max, Math.max(min, value));
}

export function SizeRangeControl({
  label,
  value,
  min,
  max,
  step = 1,
  unit,
  onChange,
  disabled = false,
}: SizeRangeControlProps) {
  return (
    <label className="text-xs text-slate-600">
      {label}
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        disabled={disabled}
        onChange={(event) => onChange(clamp(Number(event.target.value), min, max))}
        className="mt-1 w-full"
      />
      <span className="text-[11px] text-slate-500">
        {step < 1 ? value.toFixed(1) : value}
        {unit}
      </span>
    </label>
  );
}
