import React from "react";

type TextBannerProps = {
  title: string;
  subtitle?: string;
  className?: string;
  titleClassName?: string;
  subtitleClassName?: string;
};

export default function TextBanner({
  title,
  subtitle,
  className,
  titleClassName,
  subtitleClassName,
}: TextBannerProps) {
  return (
    <div className={className}>
      <h1 className={titleClassName}>{title}</h1>
      {subtitle ? <p className={subtitleClassName}>{subtitle}</p> : null}
    </div>
  );
}
