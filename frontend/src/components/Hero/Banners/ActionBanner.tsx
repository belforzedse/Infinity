'use client';

import Image from 'next/image';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { ActionBannerSpec } from '../types';

interface ActionBannerProps {
  spec: ActionBannerSpec;
}

export function ActionBanner({ spec }: ActionBannerProps) {
  const { title, subtitle, image, button, className, titleClassName, subtitleClassName, colors, typography, background } = spec;

  // Determine background styling
  const bgStyle = background
    ? background.type === 'color'
      ? { backgroundColor: background.value }
      : {
          backgroundImage: `url(${background.value})`,
          backgroundSize: background.backgroundSize || 'cover',
          backgroundPosition: background.position || 'center'
        }
    : { backgroundColor: colors?.background || 'bg-slate-50' };

  // For Tailwind class approach (fallback when no background config)
  const bgColor = background ? '' : (colors?.background || 'bg-slate-50');

  // Background dimensions
  const backgroundWidth = background?.width ? (typeof background.width === 'number' ? `${background.width}px` : background.width) : '100%';
  const backgroundHeight = background?.height ? (typeof background.height === 'number' ? `${background.height}px` : background.height) : '100%';

  // Calculate background position based on position value
  const getBackgroundPosition = (pos?: string) => {
    const posValue = pos || 'center';
    const positionStyles: { [key: string]: any } = {
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
    return positionStyles[posValue] || positionStyles['center'];
  };

  // Build title classes
  const titleClasses = [
    titleClassName,
    colors?.titleColor || 'text-gray-900',
    typography?.titleFont || 'font-bold',
    typography?.titleSize || 'text-lg',
    typography?.titleWeight || 'font-bold',
    typography?.titleLeading || 'leading-tight',
    typography?.titleTracking || 'tracking-normal',
  ]
    .filter(Boolean)
    .join(' ');

  // Build subtitle classes
  const subtitleClasses = [
    subtitleClassName,
    colors?.subtitleColor || 'text-gray-600',
    typography?.subtitleFont || 'font-normal',
    typography?.subtitleSize || 'text-sm',
    typography?.subtitleWeight || 'font-semibold',
    typography?.subtitleLeading || 'leading-relaxed',
    typography?.subtitleTracking || 'tracking-normal',
  ]
    .filter(Boolean)
    .join(' ');

  // Build button classes
  const buttonClasses = button?.className || 'px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600';

  // If background is configured, use layered layout (like LeftBanner)
  if (background) {
    return (
      <div dir="ltr" className={`relative w-full h-full ${className}`}>
        {/* Background element */}
        <div
          className={`absolute ${background.className || ''}`}
          style={{
            ...bgStyle,
            width: backgroundWidth,
            height: backgroundHeight,
            ...getBackgroundPosition(background.position),
          }}
        />
        {/* Foreground image - can overlap background */}
        <Image
          src={image.src}
          alt={image.alt}
          width={image.width}
          height={image.height}
          sizes={image.sizes}
          priority={image.priority}
          loading={image.loading}
          className={`absolute ${image.className || "object-contain"}`}
          style={{
            objectPosition: image.objectPosition || "center",
            zIndex: 10,
            width: '100%',
            height: '100%',
            left: 0,
            top: 0,
          }}
        />
        {/* Content overlay */}
        <div className="relative z-20 flex h-full flex-col justify-center px-4 py-4 pr-8 text-right">
          <h2 className={titleClasses}>{title}</h2>

          {subtitle && <p className={`${subtitleClasses} mt-2`}>{subtitle}</p>}

          {button && (
            <div className="mt-2">
              <Link href={button.href} className={`group ${buttonClasses}`}>
                {button.showArrow && (
                  <ArrowLeft className={`inline-block mr-2 h-4 w-4 transition-transform duration-200 group-hover:-translate-x-1 ${button.arrowClassName || ''}`} />
                )}
                {button.label}
              </Link>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Default layout (without background config)
  return (
    <div dir="ltr" className={`relative ${bgColor} ${className}`} style={background ? bgStyle : {}}>
      {/* Absolutely positioned image on the left */}
      <div className="absolute inset-0 left-0 w-1/3">
        <Image
          src={image.src}
          alt={image.alt}
          width={image.width}
          height={image.height}
          sizes={image.sizes}
          priority={image.priority}
          loading={image.loading}
          className={`h-full w-full ${image.className || "object-contain"}`}
          style={{
            objectPosition: image.objectPosition || "center left",
          }}
        />
      </div>
      {/* Content on the right */}
      <div className="relative z-10 flex h-full flex-col justify-center px-4 py-4 pr-8 text-right">
        <h2 className={titleClasses}>{title}</h2>

        {subtitle && <p className={`${subtitleClasses} mt-2`}>{subtitle}</p>}

        {button && (
          <div className="mt-2">
            <Link href={button.href} className={`group ${buttonClasses}`}>
              {button.showArrow && (
                <ArrowLeft className={`inline-block mr-2 h-4 w-4 transition-transform duration-200 group-hover:-translate-x-1 ${button.arrowClassName || ''}`} />
              )}
              {button.label}
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
