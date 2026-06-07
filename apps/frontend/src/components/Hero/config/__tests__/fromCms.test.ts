import { mapCmsHeroSliderToBannerSlides } from "../fromCms";

describe("mapCmsHeroSliderToBannerSlides", () => {
  it("maps visible banner slides and preserves autoplay eligibility", () => {
    const result = mapCmsHeroSliderToBannerSlides({
      autoplayIntervalMs: 9000,
      slides: [
        {
          id: "slide-1",
          imageUrl: "/uploads/hero-1.webp",
          imageAlt: "Hero 1",
          isActive: true,
          autoplayEligible: true,
          order: 2,
        },
        {
          id: "slide-2",
          imageUrl: "/uploads/hero-2.webp",
          isActive: false,
          autoplayEligible: false,
          order: 1,
        },
      ],
    });

    expect(result.autoplayIntervalMs).toBe(9000);
    expect(result.slides).toHaveLength(1);
    expect(result.autoplayEligibility).toEqual([true]);
    expect(result.slides[0]).toMatchObject({
      id: "slide-1",
      imageUrl: "/uploads/hero-1.webp",
      imageAlt: "Hero 1",
    });
  });

  it("filters slides that are outside schedule window", () => {
    const now = new Date("2026-02-10T12:00:00.000Z");

    const result = mapCmsHeroSliderToBannerSlides(
      {
        slides: [
          {
            id: "future-slide",
            imageUrl: "/uploads/future.webp",
            isActive: true,
            order: 0,
            schedule: {
              startAtUtc: "2026-02-11T00:00:00.000Z",
            },
          },
          {
            id: "valid-slide",
            imageUrl: "/uploads/valid.webp",
            isActive: true,
            order: 1,
            schedule: {
              startAtUtc: "2026-02-09T00:00:00.000Z",
              endAtUtc: "2026-02-11T00:00:00.000Z",
            },
          },
        ],
      },
      now,
    );

    expect(result.slides).toHaveLength(1);
    expect(result.slides[0].id).toBe("valid-slide");
  });

  it("converts legacy v2 main visual data for the banner slider", () => {
    const result = mapCmsHeroSliderToBannerSlides({
      version: 2,
      slides: [
        {
          id: "legacy",
          isActive: true,
          devices: {
            desktop: {
              slots: {
                rightBanner: {
                  foregroundImageUrl: "/uploads/legacy.webp",
                  foregroundAlt: "Legacy hero",
                },
              },
            },
          },
        },
      ],
    });

    expect(result.slides[0]).toMatchObject({
      id: "legacy",
      imageUrl: "/uploads/legacy.webp",
      imageAlt: "Legacy hero",
    });
  });

  it("returns empty arrays for invalid payload", () => {
    const result = mapCmsHeroSliderToBannerSlides(null);

    expect(result.slides).toEqual([]);
    expect(result.autoplayEligibility).toEqual([]);
  });
});
