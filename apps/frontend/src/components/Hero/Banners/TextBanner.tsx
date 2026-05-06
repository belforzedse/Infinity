import React from "react";
import type { ColorScheme, Typography } from "../types";

type TextBannerProps = {
  title: string;
  subtitle?: string;
  marginBottomPx?: number;
  className?: string;
  titleClassName?: string;
  subtitleClassName?: string;
  colors?: ColorScheme;
  typography?: Typography;
};

export default function TextBanner({
  title,
  subtitle,
  marginBottomPx,
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
  const hasInlineTitleColor =
    /^#([0-9a-f]{3,8})$/i.test(colors?.titleColor || "") ||
    /^(rgba?|hsla?)\(/i.test(colors?.titleColor || "");
  const hasInlineSubtitleColor =
    /^#([0-9a-f]{3,8})$/i.test(colors?.subtitleColor || "") ||
    /^(rgba?|hsla?)\(/i.test(colors?.subtitleColor || "");
  const containerClass = `${className} ${hasInlineBackground ? "" : backgroundValue}`.trim();

  const titleClass = [
    titleClassName,
    hasInlineTitleColor ? "" : colors?.titleColor,
    typography?.titleFont,
    typography?.titleSize,
    typography?.titleWeight,
    typography?.titleLeading,
    typography?.titleTracking,
  ].filter(Boolean).join(" ").trim();

  const subtitleClass = [
    subtitleClassName,
    hasInlineSubtitleColor ? "" : colors?.subtitleColor,
    typography?.subtitleFont,
    typography?.subtitleSize,
    typography?.subtitleWeight,
    typography?.subtitleLeading,
    typography?.subtitleTracking,
  ].filter(Boolean).join(" ").trim();

  const containerStyle: React.CSSProperties = {};
  if (hasInlineBackground) {
    containerStyle.backgroundColor = backgroundValue;
  }
  if (typeof marginBottomPx === "number" && Number.isFinite(marginBottomPx) && marginBottomPx > 0) {
    containerStyle.marginBottom = `${marginBottomPx}px`;
  }

  return (
    <div className={containerClass} style={Object.keys(containerStyle).length ? containerStyle : undefined}>
      <h1 className={titleClass} style={hasInlineTitleColor ? { color: colors?.titleColor } : undefined}>
        {title}
      </h1>
      {subtitle ? (
        <p
          className={subtitleClass}
          style={hasInlineSubtitleColor ? { color: colors?.subtitleColor } : undefined}
        >
          {subtitle}
        </p>
      ) : null}
    </div>
  );
}
