# Hero Slider Configuration

This directory contains the modular configuration for desktop and mobile hero sliders.

## Structure

```
config/
├── slideFactory.ts          # Builder classes for creating slides
├── slides/
│   ├── desktop/
│   │   ├── slide1.ts       # Individual desktop slide definitions
│   │   ├── slide2.ts
│   │   ├── slide3.ts
│   │   └── index.ts        # Exports all desktop slides
│   └── mobile/
│       ├── slide1.ts       # Individual mobile slide definitions
│       ├── slide2.ts
│       ├── slide3.ts
│       └── index.ts        # Exports all mobile slides
├── desktopSlides.ts        # Desktop slides array
├── mobileSlides.ts         # Mobile slides array
└── index.ts                # Main export with SliderConfig interface
```

## Adding New Slides

### Option 1: Add to existing configuration

1. Create a new slide file in `slides/desktop/` or `slides/mobile/`:

**Desktop example:**
```typescript
// slides/desktop/slide4.ts
import { DesktopSlideBuilder } from "../../slideFactory";

export const slide4 = new DesktopSlideBuilder()
  .textBanner({
    title: "Your New Title",
    subtitle: "Your subtitle",
  })
  .belowLeft({
    src: "/images/new-image1.png",
    href: "https://yourlink.com",
  })
  .belowRight({
    src: "/images/new-image2.png",
    href: "https://yourlink.com",
  })
  .side({
    src: "/images/new-image3.png",
    href: "#",
  })
  .build();
```

**Mobile example:**
```typescript
// slides/mobile/slide4.ts
import { MobileSlideBuilder } from "../../slideFactory";

export const slide4 = new MobileSlideBuilder()
  .heroDesktop({ src: "/images/hero-desktop.png" })
  .heroMobile({ src: "/images/hero-mobile.png" })
  .secondaryPrimary({
    src: "/images/secondary1.png",
    href: "https://yourlink.com",
  })
  .secondaryTop({
    src: "/images/secondary2.png",
    href: "https://yourlink.com",
  })
  .secondaryBottom({
    src: "/images/secondary3.png",
    href: "https://yourlink.com",
  })
  .build();
```

2. Export it from the index file:
```typescript
// slides/desktop/index.ts or slides/mobile/index.ts
export { slide4 } from "./slide4";
```

3. Add it to the slides array:
```typescript
// desktopSlides.ts or mobileSlides.ts
export const desktopSlides: DesktopLayout[] = [
  slides.slide1,
  slides.slide2,
  slides.slide3,
  slides.slide4, // Add here
];
```

### Option 2: Create custom configuration

Create a new file for completely custom slides:

```typescript
// customSlides.ts
import { DesktopSlideBuilder, MobileSlideBuilder } from "./slideFactory";
import type { DesktopLayout, MobileLayout } from "../types";

export const myCustomDesktopSlides: DesktopLayout[] = [
  new DesktopSlideBuilder()
    .textBanner({ title: "Custom Slide 1" })
    .side({ src: "/images/custom1.png" })
    .build(),
  // ... more slides
];

export const myCustomMobileSlides: MobileLayout[] = [
  new MobileSlideBuilder()
    .heroMobile({ src: "/images/mobile1.png" })
    .build(),
  // ... more slides
];
```

Then use in your component:
```tsx
import { myCustomDesktopSlides } from './config/customSlides';

<DesktopSlider slides={myCustomDesktopSlides} />
```

## Builder API Reference

### DesktopSlideBuilder

```typescript
new DesktopSlideBuilder()
  .textBanner({ title, subtitle, className?, titleClassName?, subtitleClassName? })
  .belowLeft({ src, alt?, width?, height?, className?, href?, loading?, priority? })
  .belowRight({ src, alt?, width?, height?, className?, href?, loading?, priority? })
  .side({ src, alt?, width?, height?, className?, href?, loading?, priority?, sizes? })
  .withPriority()                    // Marks side image as priority
  .appendClassName(target, className) // Adds className to existing
  .build()
```

### MobileSlideBuilder

```typescript
new MobileSlideBuilder()
  .heroDesktop({ src, alt?, width?, height?, className?, sizes?, priority? })
  .heroMobile({ src, alt?, width?, height?, className?, sizes?, priority? })
  .secondaryPrimary({ src, alt?, width?, height?, className?, href?, loading?, sizes? })
  .secondaryTop({ src, alt?, width?, height?, className?, href?, loading?, sizes? })
  .secondaryBottom({ src, alt?, width?, height?, className?, href?, loading?, sizes? })
  .withPriority()                    // Marks hero images as priority
  .appendClassName(target, className) // Adds className to existing
  .build()
```

## Tips

- First slide should use `.withPriority()` for better Largest Contentful Paint (LCP)
- Use `loading: "eager"` only for above-the-fold images
- Use `loading: "lazy"` for below-the-fold images
- Provide appropriate `sizes` attribute for responsive images
- Use fluent API for readable slide definitions
