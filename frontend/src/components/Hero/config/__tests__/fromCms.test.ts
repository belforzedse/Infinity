import { mapCmsHeroSliderToLayouts } from "../fromCms";

describe("mapCmsHeroSliderToLayouts", () => {
  it("maps visible slides and preserves autoplay eligibility", () => {
    const result = mapCmsHeroSliderToLayouts({
      autoplayIntervalMs: 9000,
      slides: [
        {
          id: "slide-1",
          isActive: true,
          autoplayEligible: true,
          order: 2,
          devices: {
            desktop: {
              slots: {
                topLeftTextBanner: { title: "Desktop title" },
              },
            },
            tablet: {
              slots: {
                primaryBanner: { title: "Tablet title" },
              },
            },
            mobile: {
              slots: {
                primaryBanner: { title: "Mobile title" },
              },
            },
          },
        },
        {
          id: "slide-2",
          isActive: false,
          autoplayEligible: false,
          order: 1,
        },
      ],
    });

    expect(result.autoplayIntervalMs).toBe(9000);
    expect(result.desktopSlides).toHaveLength(1);
    expect(result.tabletSlides).toHaveLength(1);
    expect(result.mobileSlides).toHaveLength(1);
    expect(result.autoplayEligibility).toEqual([true]);

    expect(result.desktopSlides[0].topLeftTextBanner.title).toBe("Desktop title");
    expect(result.tabletSlides[0].primaryBanner.title).toBe("Tablet title");
    expect(result.mobileSlides[0].primaryBanner.title).toBe("Mobile title");
  });

  it("filters slides that are outside schedule window", () => {
    const now = new Date("2026-02-10T12:00:00.000Z");

    const result = mapCmsHeroSliderToLayouts(
      {
        slides: [
          {
            id: "future-slide",
            isActive: true,
            order: 0,
            schedule: {
              startAtUtc: "2026-02-11T00:00:00.000Z",
            },
          },
          {
            id: "valid-slide",
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

    expect(result.desktopSlides).toHaveLength(1);
    expect(result.tabletSlides).toHaveLength(1);
    expect(result.mobileSlides).toHaveLength(1);
  });

  it("returns empty arrays for invalid payload", () => {
    const result = mapCmsHeroSliderToLayouts(null);

    expect(result.desktopSlides).toEqual([]);
    expect(result.tabletSlides).toEqual([]);
    expect(result.mobileSlides).toEqual([]);
    expect(result.autoplayEligibility).toEqual([]);
  });
});
