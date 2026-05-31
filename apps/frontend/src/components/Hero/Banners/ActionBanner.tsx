'use client';

import Image from 'next/image';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import {
  ActionBannerSpec,
  type ActionBannerVariant,
  type BannerImageSpec,
  type BackgroundSpec,
  type ActionBannerButtonSpec,
} from '../types';
import imageLoader from "@/utils/imageLoader";
import resolveAssetUrl from "@/utils/resolveAssetUrl";
import { useResolvedImage } from "@/hooks/useResolvedImage";
import {
  fontSizeClassFromToken,
  fontSizeTokenToInlineStyle,
} from "@/types/super-admin/heroSlider";
import { buildForegroundAnchorStyle } from "../utils/foregroundImageLayout";

interface ActionBannerProps {
  spec: ActionBannerSpec;
  variant?: ActionBannerVariant;
}

const DEFAULT_BG_COLOR = '#f8fafc';

function getBackgroundPosition(pos?: string): React.CSSProperties {
  const posValue = pos || 'center';
  const positionStyles: Record<string, React.CSSProperties> = {
    'center': { left: '50%', top: '50%', transform: 'translate(-50%, -50%)' },
    'bottom center': { left: '50%', bottom: 0, transform: 'translateX(-50%)' },
    'bottom left': { left: 0, bottom: 0, transform: 'none' },
    'bottom right': { right: 0, bottom: 0, transform: 'none' },
    'top center': { left: '50%', top: 0, transform: 'translateX(-50%)' },
    'top left': { left: 0, top: 0, transform: 'none' },
    'top right': { right: 0, top: 0, transform: 'none' },
    'center left': { left: 0, top: '50%', transform: 'translateY(-50%)' },
    'center right': { right: 0, top: '50%', transform: 'translateY(-50%)' },
  };
  return positionStyles[posValue] ?? positionStyles['center'];
}

function getCompactBackgroundPosition(background?: BackgroundSpec): React.CSSProperties {
  if (!background) {
    return { left: 0, right: 0, bottom: 0, top: '22%' };
  }

  const pos = background.position || 'center';
  if (pos.includes('bottom')) {
    return { left: 0, right: 0, bottom: 0, top: '22%' };
  }

  return getBackgroundPosition(pos);
}

function getOverflowImageStyle(image: BannerImageSpec): React.CSSProperties | null {
  const overflow = image.overflow;
  if (!overflow?.enabled) return null;

  const style: React.CSSProperties = {
    width: `${overflow.widthPercent}%`,
    height: "auto",
    maxWidth: "none",
    maxHeight: "none",
  };

  if (overflow.edge === "left" || overflow.edge === "right") {
    style[overflow.edge] = -overflow.amountPx;
    style.top = `${overflow.offsetYPercent}%`;
    style.transform = "translateY(-50%)";
  } else {
    style[overflow.edge] = -overflow.amountPx;
    style.left = `${overflow.offsetXPercent}%`;
    style.transform = "translateX(-50%)";
  }

  return style;
}

interface BackgroundProps {
  background: BackgroundSpec;
  bgStyle: React.CSSProperties;
  className?: string;
  positionStyle?: React.CSSProperties;
}

function Background({ background, bgStyle, className, positionStyle }: BackgroundProps) {
  const backgroundWidth = background?.width
    ? (typeof background.width === 'number' ? `${background.width}px` : background.width)
    : '100%';
  const backgroundHeight = background?.height
    ? (typeof background.height === 'number' ? `${background.height}px` : background.height)
    : '100%';
  const innerBorder = background.type === "color" ? background.innerBorder : undefined;
  const shouldRenderInnerBorder = Boolean(innerBorder?.enabled && innerBorder.widthPx > 0);

  return (
    <div
      className={`absolute ${background.className || ''} ${className || ''}`}
      style={{
        ...bgStyle,
        width: backgroundWidth,
        height: backgroundHeight,
        ...(positionStyle ?? getBackgroundPosition(background.position)),
      }}
    >
      {shouldRenderInnerBorder ? (
        <div
          aria-hidden="true"
          data-hero-inner-border="true"
          className="pointer-events-none absolute rounded-[inherit]"
          style={{
            inset: `${innerBorder?.offsetPx ?? 0}px`,
            border: `${innerBorder?.widthPx ?? 0}px solid ${innerBorder?.color || "#ffffff"}`,
            boxSizing: "border-box",
          }}
        />
      ) : null}
    </div>
  );
}

interface ImageRendererProps {
  image: BannerImageSpec;
  resolvedSrc: string;
  shouldRender: boolean;
  onError: () => void;
  objectPosition: string;
  objectFit: "cover" | "contain";
  zoom: number;
  variant: 'layered' | 'default' | 'compact';
}

function ImageRenderer({
  image,
  resolvedSrc,
  shouldRender,
  onError,
  objectPosition,
  objectFit,
  zoom,
  variant,
}: ImageRendererProps) {
  if (!shouldRender) return null;
  const isLayered = variant === 'layered' || variant === 'compact';
  const overflowStyle = isLayered ? getOverflowImageStyle(image) : null;

  if (isLayered && !overflowStyle) {
    const anchorLayout = buildForegroundAnchorStyle(image, {
      zoom,
      overflowStyle: null,
      objectFit,
    });
    const compactSizeStyle =
      variant === "compact"
        ? {
            width: image.customWidth?.trim() || "52%",
            height: image.customHeight?.trim() || "88%",
            maxWidth: image.customWidth?.trim() ? undefined : "52%",
            maxHeight: image.customHeight?.trim() ? undefined : "88%",
          }
        : {};

    return (
      <Image
        src={resolvedSrc}
        loader={imageLoader}
        alt={image.alt || "تصویر بنر"}
        width={image.width}
        height={image.height}
        sizes={image.sizes}
        priority={image.priority}
        loading={image.loading}
        onError={onError}
        className={anchorLayout.className}
        style={{ ...anchorLayout.style, ...compactSizeStyle }}
      />
    );
  }

  const transform = [
    overflowStyle?.transform,
    zoom !== 1 ? `scale(${zoom})` : null,
  ].filter(Boolean).join(" ") || undefined;

  const compactImageClass =
    variant === 'compact'
      ? `absolute left-0 top-0 z-10 h-[88%] w-[52%] max-w-[52%] ${image.className || "object-contain object-left-bottom"}`
      : `absolute ${image.className || "object-contain"}`;

  return (
    <Image
      src={resolvedSrc}
      loader={imageLoader}
      alt={image.alt || "تصویر بنر"}
      width={image.width}
      height={image.height}
      sizes={image.sizes}
      priority={image.priority}
      loading={image.loading}
      onError={onError}
      className={
        variant === 'default'
          ? `h-full w-full ${image.className || "object-contain"}`
          : compactImageClass
      }
      style={
        isLayered
          ? {
              objectPosition,
              objectFit,
              transform,
              zIndex: 10,
              width: variant === 'compact'
                ? undefined
                : image.customWidth ?? overflowStyle?.width ?? '100%',
              height: variant === 'compact'
                ? undefined
                : image.customHeight ?? overflowStyle?.height ?? '100%',
              left: variant === 'compact' ? 0 : overflowStyle ? overflowStyle.left : 0,
              right: overflowStyle?.right,
              top: variant === 'compact' ? 0 : overflowStyle ? overflowStyle.top : 0,
              bottom: overflowStyle?.bottom,
              maxWidth: overflowStyle?.maxWidth,
              maxHeight: overflowStyle?.maxHeight,
            }
          : {
              objectPosition: image.objectPosition || objectPosition || "center left",
              objectFit,
              transform: zoom !== 1 ? `scale(${zoom})` : undefined,
            }
      }
    />
  );
}

interface ContentSectionProps {
  title: string;
  subtitle?: string;
  button?: ActionBannerButtonSpec;
  alignmentClass: string;
  spacingClass: string;
  titleClasses: string;
  subtitleClasses: string;
  buttonClasses: string;
  titleFontStyle?: React.CSSProperties;
  subtitleFontStyle?: React.CSSProperties;
  hasInlineTitleColor: boolean;
  hasInlineSubtitleColor: boolean;
  titleColor?: string;
  subtitleColor?: string;
  contentClassName?: string;
  variant?: ActionBannerVariant;
  ctaHref?: string;
}

function ContentSection({
  title,
  subtitle,
  button,
  alignmentClass,
  spacingClass,
  titleClasses,
  subtitleClasses,
  buttonClasses,
  titleFontStyle,
  subtitleFontStyle,
  hasInlineTitleColor,
  hasInlineSubtitleColor,
  titleColor,
  subtitleColor,
  contentClassName = '',
  variant = 'default',
  ctaHref,
}: ContentSectionProps) {
  const isCompact = variant === 'compact';
  const ctaLabel = title.trim() || button?.label || '';
  const href = ctaHref || button?.href || '#';
  const showSeparateButton = !isCompact && button && button.label;
  const titleStyle = {
    ...(hasInlineTitleColor && titleColor ? { color: titleColor } : {}),
    ...titleFontStyle,
  };
  const subtitleStyle = {
    ...(hasInlineSubtitleColor && subtitleColor ? { color: subtitleColor } : {}),
    ...subtitleFontStyle,
  };
  const buttonLinkStyle = button?.style;

  if (isCompact && ctaLabel && href !== '#') {
    return (
      <div
        className={`absolute inset-y-0 right-0 z-20 flex w-[48%] flex-col ${alignmentClass} px-3 ${contentClassName}`}
      >
        <Link
          href={href}
          className={`group flex w-full flex-row items-center justify-end gap-2 text-right ${buttonClasses}`}
          style={
            Object.keys({ ...buttonLinkStyle, ...titleStyle }).length
              ? { ...buttonLinkStyle, ...titleStyle }
              : undefined
          }
        >
          {(button?.showArrow ?? true) && (
            <ArrowLeft
              className={`h-5 w-5 shrink-0 transition-transform duration-200 group-hover:-translate-x-1 ${button?.arrowClassName || ''}`}
            />
          )}
          <span
            className={titleClasses}
            style={Object.keys(titleStyle).length ? titleStyle : undefined}
            data-hero-edit-field={title.trim() ? "title" : "buttonLabel"}
          >
            {ctaLabel}
          </span>
        </Link>
      </div>
    );
  }

  if (isCompact && ctaLabel) {
    return (
      <div
        className={`absolute inset-y-0 right-0 z-20 flex w-[48%] flex-col ${alignmentClass} px-3 ${contentClassName}`}
      >
        <span
          className={`flex w-full flex-row items-center justify-end gap-2 text-right ${buttonClasses}`}
          style={Object.keys(titleStyle).length ? titleStyle : undefined}
        >
          {(button?.showArrow ?? true) && (
            <ArrowLeft className={`h-5 w-5 shrink-0 ${button?.arrowClassName || ''}`} />
          )}
          <span className={titleClasses} data-hero-edit-field={title.trim() ? "title" : "buttonLabel"}>
            {ctaLabel}
          </span>
        </span>
      </div>
    );
  }

  return (
    <div className={`relative z-20 flex h-full flex-col ${alignmentClass} ${spacingClass} text-right ${contentClassName}`}>
      <h2
        className={titleClasses}
        style={Object.keys(titleStyle).length ? titleStyle : undefined}
        data-hero-edit-field="title"
      >
        {title}
      </h2>
      {subtitle && (
        <p
          className={`${subtitleClasses} mt-2`}
          style={Object.keys(subtitleStyle).length ? subtitleStyle : undefined}
          data-hero-edit-field="subtitle"
        >
          {subtitle}
        </p>
      )}
      {showSeparateButton && (
        <div className="mt-2">
          <Link
            href={button.href}
            className={`group ${buttonClasses}`}
            style={buttonLinkStyle}
          >
            {button.showArrow && (
              <ArrowLeft className={`inline-block mr-2 h-4 w-4 transition-transform duration-200 group-hover:-translate-x-1 ${button.arrowClassName || ''}`} />
            )}
            <span data-hero-edit-field="buttonLabel">{button.label}</span>
          </Link>
        </div>
      )}
    </div>
  );
}

export function ActionBanner({ spec, variant = 'default' }: ActionBannerProps) {
  const {
    title,
    subtitle,
    image,
    button,
    className,
    titleClassName,
    subtitleClassName,
    colors,
    typography,
    background,
    contentAlignment,
  } = spec;

  const isCompact = variant === 'compact';

  const { resolvedSrc, shouldRender: shouldRenderImage, handleError: handleImageError } =
    useResolvedImage(image.src);

  const alignmentClass =
    contentAlignment === "top"
      ? "justify-start"
      : contentAlignment === "bottom"
        ? "justify-end"
        : "justify-center";
  const spacingClass = isCompact
    ? (spec.paddingClassName ?? "px-3 py-3 pl-2")
    : (spec.paddingClassName ?? "px-4 py-4 pr-8");
  const objectPosition =
    (typeof image.focalX === "number" && typeof image.focalY === "number")
      ? `${image.focalX}% ${image.focalY}%`
      : (image.objectPosition || "left bottom");
  const objectFit = image.objectFit || "contain";
  const zoom = typeof image.zoom === "number" ? image.zoom : 1;
  const hasInlineTitleColor =
    /^#([0-9a-f]{3,8})$/i.test(colors?.titleColor || "") ||
    /^(rgba?|hsla?)\(/i.test(colors?.titleColor || "");
  const hasInlineSubtitleColor =
    /^#([0-9a-f]{3,8})$/i.test(colors?.subtitleColor || "") ||
    /^(rgba?|hsla?)\(/i.test(colors?.subtitleColor || "");

  const resolvedBgImageUrl =
    background?.type === 'image' && background?.value
      ? resolveAssetUrl(background.value)
      : "";
  const bgStyle: React.CSSProperties = background
    ? background.type === 'color'
      ? { backgroundColor: background.value }
      : {
          backgroundImage: resolvedBgImageUrl ? `url(${resolvedBgImageUrl})` : undefined,
          backgroundColor: !resolvedBgImageUrl ? (colors?.background || DEFAULT_BG_COLOR) : undefined,
          backgroundSize: background.backgroundSize || 'cover',
          backgroundPosition: background.position || 'center'
        }
    : { backgroundColor: colors?.background || DEFAULT_BG_COLOR };

  const titleSizeToken = typography?.titleSize;
  const subtitleSizeToken = typography?.subtitleSize;
  const titleFontStyle = fontSizeTokenToInlineStyle(titleSizeToken);
  const subtitleFontStyle = fontSizeTokenToInlineStyle(subtitleSizeToken);

  const titleClasses = [
    titleClassName,
    hasInlineTitleColor ? '' : (colors?.titleColor || 'text-gray-900'),
    typography?.titleFont || (isCompact ? 'font-peyda-fanum' : 'font-bold'),
    titleSizeToken ? fontSizeClassFromToken(titleSizeToken) : isCompact ? 'text-lg' : 'text-lg',
    typography?.titleWeight || (isCompact ? 'font-normal' : 'font-bold'),
    typography?.titleLeading || 'leading-tight',
    typography?.titleTracking || 'tracking-normal',
  ]
    .filter(Boolean)
    .join(' ');

  const subtitleClasses = [
    subtitleClassName,
    hasInlineSubtitleColor ? '' : (colors?.subtitleColor || 'text-gray-600'),
    typography?.subtitleFont || 'font-normal',
    subtitleSizeToken ? fontSizeClassFromToken(subtitleSizeToken) : 'text-sm',
    typography?.subtitleWeight || 'font-semibold',
    typography?.subtitleLeading || 'leading-relaxed',
    typography?.subtitleTracking || 'tracking-normal',
  ]
    .filter(Boolean)
    .join(' ');

  const buttonClasses = button?.className || (isCompact
    ? 'text-neutral-800 text-lg font-normal'
    : 'px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600');

  const ctaHref = button?.href || image.href;
  const rootDir = 'ltr';
  const rootOverflow = isCompact ? 'overflow-hidden' : 'overflow-visible';
  const rootMinH = isCompact ? 'min-h-0' : 'min-h-[150px]';

  if (background) {
    const compactBgPosition = isCompact ? getCompactBackgroundPosition(background) : undefined;
    const compactBgHeight = isCompact ? '78%' : undefined;
    const compactBgWidth = isCompact ? '100%' : undefined;

    return (
      <div dir={rootDir} className={`relative h-full w-full ${rootMinH} ${rootOverflow} ${className}`}>
        <Background
          background={{
            ...background,
            width: compactBgWidth ?? background.width,
            height: compactBgHeight ?? background.height,
          }}
          bgStyle={bgStyle}
          className={isCompact ? 'rounded-[20px]' : undefined}
          positionStyle={compactBgPosition}
        />
        <ImageRenderer
          image={image}
          resolvedSrc={resolvedSrc}
          shouldRender={shouldRenderImage}
          onError={handleImageError}
          objectPosition={objectPosition}
          objectFit={objectFit}
          zoom={zoom}
          variant={isCompact ? 'compact' : 'layered'}
        />
        <ContentSection
          title={title}
          subtitle={isCompact ? undefined : subtitle}
          button={button}
          alignmentClass={alignmentClass}
          spacingClass={spacingClass}
          titleClasses={titleClasses}
          subtitleClasses={subtitleClasses}
          buttonClasses={buttonClasses}
          titleFontStyle={titleFontStyle}
          subtitleFontStyle={subtitleFontStyle}
          hasInlineTitleColor={hasInlineTitleColor}
          hasInlineSubtitleColor={hasInlineSubtitleColor}
          titleColor={colors?.titleColor}
          subtitleColor={colors?.subtitleColor}
          variant={variant}
          ctaHref={ctaHref}
        />
      </div>
    );
  }

  return (
    <div dir={rootDir} className={`relative h-full ${rootMinH} ${rootOverflow} ${className}`} style={bgStyle}>
      <div className={isCompact ? "absolute inset-y-0 left-0 w-[52%]" : "absolute inset-0 left-0 w-1/3"}>
        <ImageRenderer
          image={image}
          resolvedSrc={resolvedSrc}
          shouldRender={shouldRenderImage}
          onError={handleImageError}
          objectPosition={objectPosition}
          objectFit={objectFit}
          zoom={zoom}
          variant={isCompact ? 'compact' : 'default'}
        />
      </div>
      <ContentSection
        title={title}
        subtitle={isCompact ? undefined : subtitle}
        button={button}
        alignmentClass={alignmentClass}
        spacingClass={spacingClass}
        titleClasses={titleClasses}
        subtitleClasses={subtitleClasses}
        buttonClasses={buttonClasses}
        titleFontStyle={titleFontStyle}
        subtitleFontStyle={subtitleFontStyle}
        hasInlineTitleColor={hasInlineTitleColor}
        hasInlineSubtitleColor={hasInlineSubtitleColor}
        titleColor={colors?.titleColor}
        subtitleColor={colors?.subtitleColor}
        contentClassName="z-10"
        variant={variant}
        ctaHref={ctaHref}
      />
    </div>
  );
}
