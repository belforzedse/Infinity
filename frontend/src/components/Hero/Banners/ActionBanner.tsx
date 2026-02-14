'use client';

import Image from 'next/image';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { ActionBannerSpec, type BannerImageSpec, type BackgroundSpec, type ActionBannerButtonSpec } from '../types';
import imageLoader from "@/utils/imageLoader";
import resolveAssetUrl from "@/utils/resolveAssetUrl";
import { useResolvedImage } from "@/hooks/useResolvedImage";

interface ActionBannerProps {
  spec: ActionBannerSpec;
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

interface BackgroundProps {
  background: BackgroundSpec;
  bgStyle: React.CSSProperties;
  className?: string;
}

function Background({ background, bgStyle, className }: BackgroundProps) {
  const backgroundWidth = background?.width
    ? (typeof background.width === 'number' ? `${background.width}px` : background.width)
    : '100%';
  const backgroundHeight = background?.height
    ? (typeof background.height === 'number' ? `${background.height}px` : background.height)
    : '100%';
  return (
    <div
      className={`absolute ${background.className || ''}`}
      style={{
        ...bgStyle,
        width: backgroundWidth,
        height: backgroundHeight,
        ...getBackgroundPosition(background.position),
      }}
    />
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
  variant: 'layered' | 'default';
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
  const isLayered = variant === 'layered';
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
      className={isLayered ? `absolute ${image.className || "object-contain"}` : `h-full w-full ${image.className || "object-contain"}`}
      style={
        isLayered
          ? {
              objectPosition,
              objectFit,
              transform: zoom !== 1 ? `scale(${zoom})` : undefined,
              zIndex: 10,
              width: image.customWidth ?? '100%',
              height: image.customHeight ?? '100%',
              left: 0,
              top: 0,
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
  hasInlineTitleColor: boolean;
  hasInlineSubtitleColor: boolean;
  titleColor?: string;
  subtitleColor?: string;
  contentClassName?: string;
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
  hasInlineTitleColor,
  hasInlineSubtitleColor,
  titleColor,
  subtitleColor,
  contentClassName = '',
}: ContentSectionProps) {
  return (
    <div className={`relative z-20 flex h-full flex-col ${alignmentClass} ${spacingClass} text-right ${contentClassName}`}>
      <h2 className={titleClasses} style={hasInlineTitleColor && titleColor ? { color: titleColor } : undefined}>
        {title}
      </h2>
      {subtitle && (
        <p
          className={`${subtitleClasses} mt-2`}
          style={hasInlineSubtitleColor && subtitleColor ? { color: subtitleColor } : undefined}
        >
          {subtitle}
        </p>
      )}
      {button && (
        <div className="mt-2">
          <Link
            href={button.href}
            className={`group ${buttonClasses}`}
            style={button.style}
          >
            {button.showArrow && (
              <ArrowLeft className={`inline-block mr-2 h-4 w-4 transition-transform duration-200 group-hover:-translate-x-1 ${button.arrowClassName || ''}`} />
            )}
            {button.label}
          </Link>
        </div>
      )}
    </div>
  );
}

export function ActionBanner({ spec }: ActionBannerProps) {
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

  const { resolvedSrc, shouldRender: shouldRenderImage, handleError: handleImageError } =
    useResolvedImage(image.src);

  const alignmentClass =
    contentAlignment === "top"
      ? "justify-start"
      : contentAlignment === "bottom"
        ? "justify-end"
        : "justify-center";
  const spacingClass = spec.paddingClassName ?? "px-4 py-4 pr-8";
  const objectPosition =
    (typeof image.focalX === "number" && typeof image.focalY === "number")
      ? `${image.focalX}% ${image.focalY}%`
      : (image.objectPosition || "center");
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

  const titleClasses = [
    titleClassName,
    hasInlineTitleColor ? '' : (colors?.titleColor || 'text-gray-900'),
    typography?.titleFont || 'font-bold',
    typography?.titleSize || 'text-lg',
    typography?.titleWeight || 'font-bold',
    typography?.titleLeading || 'leading-tight',
    typography?.titleTracking || 'tracking-normal',
  ]
    .filter(Boolean)
    .join(' ');

  const subtitleClasses = [
    subtitleClassName,
    hasInlineSubtitleColor ? '' : (colors?.subtitleColor || 'text-gray-600'),
    typography?.subtitleFont || 'font-normal',
    typography?.subtitleSize || 'text-sm',
    typography?.subtitleWeight || 'font-semibold',
    typography?.subtitleLeading || 'leading-relaxed',
    typography?.subtitleTracking || 'tracking-normal',
  ]
    .filter(Boolean)
    .join(' ');

  const buttonClasses = button?.className || 'px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600';

  if (background) {
    return (
      <div dir="ltr" className={`relative w-full ${className}`}>
        <Background background={background} bgStyle={bgStyle} />
        <ImageRenderer
          image={image}
          resolvedSrc={resolvedSrc}
          shouldRender={shouldRenderImage}
          onError={handleImageError}
          objectPosition={objectPosition}
          objectFit={objectFit}
          zoom={zoom}
          variant="layered"
        />
        <ContentSection
          title={title}
          subtitle={subtitle}
          button={button}
          alignmentClass={alignmentClass}
          spacingClass={spacingClass}
          titleClasses={titleClasses}
          subtitleClasses={subtitleClasses}
          buttonClasses={buttonClasses}
          hasInlineTitleColor={hasInlineTitleColor}
          hasInlineSubtitleColor={hasInlineSubtitleColor}
          titleColor={colors?.titleColor}
          subtitleColor={colors?.subtitleColor}
        />
      </div>
    );
  }

  return (
    <div dir="ltr" className={`relative ${className}`} style={bgStyle}>
      <div className="absolute inset-0 left-0 w-1/3">
        <ImageRenderer
          image={image}
          resolvedSrc={resolvedSrc}
          shouldRender={shouldRenderImage}
          onError={handleImageError}
          objectPosition={objectPosition}
          objectFit={objectFit}
          zoom={zoom}
          variant="default"
        />
      </div>
      <ContentSection
        title={title}
        subtitle={subtitle}
        button={button}
        alignmentClass={alignmentClass}
        spacingClass={spacingClass}
        titleClasses={titleClasses}
        subtitleClasses={subtitleClasses}
        buttonClasses={buttonClasses}
        hasInlineTitleColor={hasInlineTitleColor}
        hasInlineSubtitleColor={hasInlineSubtitleColor}
        titleColor={colors?.titleColor}
        subtitleColor={colors?.subtitleColor}
        contentClassName="z-10"
      />
    </div>
  );
}
