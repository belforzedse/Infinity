import Link from "next/link";
import type { LucideIcon } from "lucide-react";

export type EmptyStateProps = {
  icon: LucideIcon;
  title: string;
  description?: string;
  cta?: {
    label: string;
    href: string;
  };
  className?: string;
};

function cx(...parts: (string | false | undefined)[]): string {
  return parts.filter(Boolean).join(" ");
}

export function EmptyState({ icon: Icon, title, description, cta, className }: EmptyStateProps) {
  return (
    <div className={cx("empty-state", className)} role="status">
      <Icon className="empty-state-icon" strokeWidth={1.5} aria-hidden />
      <div className="space-y-2">
        <h2 className="empty-state-title">{title}</h2>
        {description ? <p className="empty-state-description">{description}</p> : null}
      </div>
      {cta ? (
        <Link
          href={cta.href}
          className="pressable inline-flex h-10 items-center justify-center rounded-full bg-infinity-primary px-5 font-peyda text-sm font-medium text-white transition-opacity hover:opacity-95 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-400/70"
        >
          {cta.label}
        </Link>
      ) : null}
    </div>
  );
}
