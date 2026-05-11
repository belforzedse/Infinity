const INFINITY_MARK_SRC = "/Infinity.svg";

export type InfinityMarkCircleProps = {
  /** Outer circle CSS size (e.g. `24px`). */
  circleSize: number;
  /** Infinity SVG width/height in px (height scales with width). */
  markSize: number;
  className?: string;
};

/**
 * Home-tab style: navy circle + white Infinity mark (scaled for sidebars / compact UI).
 */
export function InfinityMarkCircle({ circleSize, markSize, className }: InfinityMarkCircleProps) {
  return (
    <span
      className={`inline-flex shrink-0 items-center justify-center rounded-full bg-infinity-primary shadow-[0_0_2.175px_rgba(0,0,0,0.09)] ${className ?? ""}`}
      style={{ width: circleSize, height: circleSize }}
    >
      <img src={INFINITY_MARK_SRC} alt="" width={markSize} height={markSize} className="block" />
    </span>
  );
}
