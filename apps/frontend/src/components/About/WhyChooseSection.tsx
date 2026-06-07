import React from "react";

interface WhyChooseSectionProps {
  title: string;
  items: string[];
  className?: string;
}

export default function WhyChooseSection({ title, items, className = "" }: WhyChooseSectionProps) {
  return (
    <section className={`space-y-6 ${className}`}>
      <div className="flex items-start gap-3">
        <div className="h-12 w-1 rounded-full bg-infinity-primary flex-shrink-0" />
        <h2 className="text-2xl font-semibold text-foreground-primary lg:text-3xl">{title}</h2>
      </div>
      <ul className="space-y-4 pr-4">
        {items.map((item, index) => (
          <li key={index} className="flex items-start gap-3">
            <span className="mt-1.5 h-2 w-2 rounded-full bg-infinity-primary flex-shrink-0" />
            <p className="text-base leading-relaxed text-neutral-700 lg:text-lg">{item}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}
