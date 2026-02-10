import React from "react";
import type { ColorScheme, Typography } from "../types";

type TextBannerProps = {
  title: string;
  subtitle?: string;
  className?: string;
  titleClassName?: string;
  subtitleClassName?: string;
  colors?: ColorScheme;
  typography?: Typography;
};

export default function TextBanner({
  title,
  subtitle,
  className = "",
  titleClassName = "",
  subtitleClassName = "",
  colors,
  typography,
}: TextBannerProps) {
  const backgroundValue = colors?.background || "";
  const hasInlineBackground =
    /^#([0-9a-f]{3,8})$/i.test(backgroundValue) ||
    /^(rgba?|hsla?)\(/i.test(backgroundValue);
  const containerClass = `${className} ${hasInlineBackground ? "" : backgroundValue}`.trim();

  const titleClass = [
    titleClassName,
    colors?.titleColor,
    typography?.titleFont,
    typography?.titleSize,
    typography?.titleWeight,
    typography?.titleLeading,
    typography?.titleTracking,
  ].filter(Boolean).join(" ").trim();

  const subtitleClass = [
    subtitleClassName,
    colors?.subtitleColor,
    typography?.subtitleFont,
    typography?.subtitleSize,
    typography?.subtitleWeight,
    typography?.subtitleLeading,
    typography?.subtitleTracking,
  ].filter(Boolean).join(" ").trim();

  return (
    <div
      className={containerClass}
      style={hasInlineBackground ? { backgroundColor: backgroundValue } : undefined}
    >
      <h1 className={titleClass}>{title}</h1>
      {subtitle ? <p className={subtitleClass}>{subtitle}</p> : null}
    </div>
  );
}
