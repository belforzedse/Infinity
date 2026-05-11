/**
 * Shared pseudo-element glass crossfade used by `Button` variant `default` and profile nav active row.
 * @see apps/social/src/components/ui/Button.tsx
 */
function cx(...parts: (string | undefined | false)[]): string {
  return parts.filter(Boolean).join(" ");
}

export function glassDefaultCrossfadeSurface(
  beforeRounded: string,
  afterRounded: string,
): string {
  return cx(
    "relative isolate overflow-hidden border-0 bg-transparent shadow-none",
    "before:pointer-events-none before:absolute before:inset-0 before:z-0 before:content-['']",
    beforeRounded,
    "before:bg-[linear-gradient(179.66deg,rgba(255,255,255,0.54)_26.71%,rgba(217,226,255,0.54)_105.94%)]",
    "before:opacity-100 before:transition-opacity before:duration-300 before:ease-out",
    "after:pointer-events-none after:absolute after:inset-0 after:z-0 after:content-['']",
    afterRounded,
    "after:bg-[linear-gradient(22.48deg,rgba(255,255,255,0.54)_-104.7%,rgba(217,226,255,0.54)_88.1%)]",
    "after:opacity-0 after:transition-opacity after:duration-300 after:ease-out",
    "hover:before:opacity-0 hover:after:opacity-100 motion-reduce:hover:before:opacity-100 motion-reduce:hover:after:opacity-0",
  );
}
