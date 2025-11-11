'use client';

import Image from 'next/image';
import Link from 'next/link';
import { LeftBannerSpec } from '../types';

interface LeftBannerProps {
  spec: LeftBannerSpec;
  className?: string;
}

export function LeftBanner({ spec, className = '' }: LeftBannerProps) {
  const { background, foregroundImage } = spec;

  // Determine background styling
  const backgroundStyle =
    background.type === 'color'
      ? { backgroundColor: background.value }
      : {
          backgroundImage: `url(${background.value})`,
          backgroundSize: background.backgroundSize || 'cover',
          backgroundPosition: background.position || 'center'
        };

  // Background dimensions
  const backgroundWidth = background.width ? (typeof background.width === 'number' ? `${background.width}px` : background.width) : '100%';
  const backgroundHeight = background.height ? (typeof background.height === 'number' ? `${background.height}px` : background.height) : '100%';

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

  // Render foreground image
  const ForegroundContent = (
    <div className={`relative w-full h-full ${className}`}>
      {/* Background element */}
      <div
        className={`absolute ${background.className || ''}`}
        style={{
          ...backgroundStyle,
          width: backgroundWidth,
          height: backgroundHeight,
          ...getBackgroundPosition(background.position),
        }}
      />
      {/* Foreground image - can overlap background */}
      <Image
        src={foregroundImage.src}
        alt={foregroundImage.alt}
        width={foregroundImage.width}
        height={foregroundImage.height}
        sizes={foregroundImage.sizes}
        priority={foregroundImage.priority}
        loading={foregroundImage.loading}
        className={`absolute w-full h-full ${foregroundImage.className || 'object-contain'}`}
        style={{
          objectPosition: foregroundImage.objectPosition || 'center',
          zIndex: 10,
        }}
      />
    </div>
  );

  // Wrap with link if href is provided
  if (foregroundImage.href) {
    return (
      <Link href={foregroundImage.href} className="block w-full h-full">
        {ForegroundContent}
      </Link>
    );
  }

  return ForegroundContent;
}
