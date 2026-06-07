import {
  HERO_SLIDER_VERSION,
  isHeroSlideVisible,
  normalizeHeroSliderPayload,
  resolveHeroSlideMobileImage,
} from "./heroSliderV3";

describe("heroSlider v3", () => {
  it("normalizes a single-image payload", () => {
    const payload = normalizeHeroSliderPayload({
      autoplayIntervalMs: 9000,
      slides: [
        {
          id: "slide-1",
          imageUrl: "/uploads/hero.webp",
          imageAlt: "Hero banner",
          link: { type: "internal", href: "/products" },
          isActive: true,
          autoplayEligible: false,
          order: 2,
        },
      ],
    });

    expect(payload.version).toBe(HERO_SLIDER_VERSION);
    expect(payload.autoplayIntervalMs).toBe(9000);
    expect(payload.slides[0]).toMatchObject({
      id: "slide-1",
      imageUrl: "/uploads/hero.webp",
      imageAlt: "Hero banner",
      link: { type: "internal", href: "/products" },
      isActive: true,
      autoplayEligible: false,
      order: 2,
    });
  });

  it("converts legacy v2 main visual data into one banner image", () => {
    const payload = normalizeHeroSliderPayload({
      version: 2,
      slides: [
        {
          id: "legacy-slide",
          order: 0,
          devices: {
            desktop: {
              slots: {
                rightBanner: {
                  foregroundImageUrl: "/uploads/legacy-foreground.png",
                  backgroundImageUrl: "/uploads/legacy-background.png",
                  foregroundAlt: "Legacy foreground",
                  link: { type: "internal", href: "/legacy" },
                },
              },
            },
          },
        },
      ],
    });

    expect(payload.version).toBe(3);
    expect(payload.slides[0]).toMatchObject({
      id: "legacy-slide",
      imageUrl: "/uploads/legacy-foreground.png",
      imageAlt: "Legacy foreground",
      link: { type: "internal", href: "/legacy" },
    });
  });

  it("falls back to legacy background images when foreground is missing", () => {
    const payload = normalizeHeroSliderPayload({
      version: 2,
      slides: [
        {
          id: "legacy-slide",
          devices: {
            desktop: {
              slots: {
                rightBanner: {
                  backgroundImageUrl: "/uploads/background-only.png",
                },
              },
            },
          },
        },
      ],
    });

    expect(payload.slides[0].imageUrl).toBe("/uploads/background-only.png");
  });

  it("filters inactive, empty, and scheduled-out slides", () => {
    const now = new Date("2026-02-10T12:00:00.000Z");
    const payload = normalizeHeroSliderPayload({
      slides: [
        { id: "empty", imageUrl: "", isActive: true },
        { id: "inactive", imageUrl: "/uploads/a.png", isActive: false },
        {
          id: "future",
          imageUrl: "/uploads/b.png",
          isActive: true,
          schedule: { startAtUtc: "2026-02-11T00:00:00.000Z" },
        },
        {
          id: "visible",
          imageUrl: "/uploads/c.png",
          isActive: true,
          schedule: {
            startAtUtc: "2026-02-09T00:00:00.000Z",
            endAtUtc: "2026-02-11T00:00:00.000Z",
          },
        },
      ],
    });

    expect(payload.slides.filter((slide) => isHeroSlideVisible(slide, now)).map((slide) => slide.id)).toEqual([
      "visible",
    ]);
  });

  it("normalizes separate mobile banner fields", () => {
    const payload = normalizeHeroSliderPayload({
      slides: [
        {
          id: "slide-1",
          imageUrl: "/uploads/desktop.webp",
          imageAlt: "Desktop banner",
          mobileImageUrl: "/uploads/mobile.webp",
          mobileImageAlt: "Mobile banner",
        },
      ],
    });

    expect(payload.slides[0]).toMatchObject({
      imageUrl: "/uploads/desktop.webp",
      imageAlt: "Desktop banner",
      mobileImageUrl: "/uploads/mobile.webp",
      mobileImageAlt: "Mobile banner",
    });
  });

  it("maps legacy mobile hero banner into mobileImageUrl", () => {
    const payload = normalizeHeroSliderPayload({
      version: 2,
      slides: [
        {
          id: "legacy-slide",
          devices: {
            desktop: {
              slots: {
                rightBanner: {
                  foregroundImageUrl: "/uploads/desktop.png",
                  foregroundAlt: "Desktop",
                },
              },
            },
            mobile: {
              slots: {
                heroBanner: {
                  foregroundImageUrl: "/uploads/mobile.png",
                  foregroundAlt: "Mobile",
                },
              },
            },
          },
        },
      ],
    });

    expect(payload.slides[0]).toMatchObject({
      imageUrl: "/uploads/desktop.png",
      imageAlt: "Desktop",
      mobileImageUrl: "/uploads/mobile.png",
      mobileImageAlt: "Mobile",
    });
  });

  it("falls back mobile rendering to desktop image when mobile image is empty", () => {
    const payload = normalizeHeroSliderPayload({
      slides: [
        {
          id: "slide-1",
          imageUrl: "/uploads/desktop.webp",
          imageAlt: "Desktop only",
        },
      ],
    });

    expect(resolveHeroSlideMobileImage(payload.slides[0])).toEqual({
      url: "/uploads/desktop.webp",
      alt: "Desktop only",
    });
  });
});
