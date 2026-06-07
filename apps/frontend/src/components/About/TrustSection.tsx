import React from "react";

interface TrustSectionProps {
  title: string;
  children: React.ReactNode;
  className?: string;
}

export default function TrustSection({ title, children, className = "" }: TrustSectionProps) {
  return (
    <section className={`space-y-4 ${className}`}>
      <div className="flex items-start gap-3">
        <div className="h-12 w-1 rounded-full bg-infinity-primary flex-shrink-0" />
        <h2 className="text-2xl font-semibold text-foreground-primary lg:text-3xl">{title}</h2>
      </div>
      <div className="pr-4 space-y-4 text-base leading-relaxed text-neutral-700 lg:text-lg">
        {children}
      </div>
    </section>
  );
}
