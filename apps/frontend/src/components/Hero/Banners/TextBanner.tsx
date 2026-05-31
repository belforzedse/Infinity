import React from "react";
import type { ColorScheme, Typography } from "../types";
import {
  fontSizeClassFromToken,
  fontSizeTokenToInlineStyle,
} from "@/types/super-admin/heroSlider";

type TextBannerProps = {
  title: string;
  subtitle?: string;
  marginBottomPx?: number;
  titleSubtitleGapPx?: number;
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
  titleSubtitleGapPx,
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
    fontSizeClassFromToken(typography?.titleSize),
    typography?.titleWeight,
    typography?.titleLeading,
    typography?.titleTracking,
  ]
    .filter(Boolean)
    .join(" ")
    .trim();

  const subtitleClass = [
    subtitleClassName,
    hasInlineSubtitleColor ? "" : colors?.subtitleColor,
    typography?.subtitleFont,
    fontSizeClassFromToken(typography?.subtitleSize),
    typography?.subtitleWeight,
    typography?.subtitleLeading,
    typography?.subtitleTracking,
  ]
    .filter(Boolean)
    .join(" ")
    .trim();

  const titleStyle: React.CSSProperties = {
    ...(hasInlineTitleColor ? { color: colors?.titleColor } : {}),
    ...fontSizeTokenToInlineStyle(typography?.titleSize),
  };

  const subtitleStyle: React.CSSProperties = {
    ...(hasInlineSubtitleColor ? { color: colors?.subtitleColor } : {}),
    ...fontSizeTokenToInlineStyle(typography?.subtitleSize),
  };

  const containerStyle: React.CSSProperties = {};
  if (hasInlineBackground) {
    containerStyle.backgroundColor = backgroundValue;
  }
  if (typeof marginBottomPx === "number" && Number.isFinite(marginBottomPx) && marginBottomPx > 0) {
    containerStyle.marginBottom = `${marginBottomPx}px`;
  }
  if (typeof titleSubtitleGapPx === "number" && Number.isFinite(titleSubtitleGapPx)) {
    containerStyle.display = "flex";
    containerStyle.flexDirection = "column";
    containerStyle.gap = `${Math.max(0, titleSubtitleGapPx)}px`;
  }

  return (
    <div className={containerClass} style={Object.keys(containerStyle).length ? containerStyle : undefined}>
      <h1
        className={titleClass}
        style={Object.keys(titleStyle).length ? titleStyle : undefined}
        data-hero-edit-field="title"
      >
        {title}
      </h1>
      {subtitle ? (
        <p
          className={subtitleClass}
          style={Object.keys(subtitleStyle).length ? subtitleStyle : undefined}
          data-hero-edit-field="subtitle"
        >
          {subtitle}
        </p>
      ) : null}
    </div>
  );
}
