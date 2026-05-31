import routesConfig from "../routes/custom-router";
import {
  createHeroSliderMeta,
  sanitizeHeroSliderPayload,
} from "../services/hero-slider-schema";
import { ROLE_NAMES } from "../../../utils/roles";

describe("hero slider schema sanitizer", () => {
  it("sanitizes a valid payload without errors", () => {
    const { value, errors } = sanitizeHeroSliderPayload({
      autoplayIntervalMs: 8000,
      slides: [
        {
          id: "slide-1",
          isActive: true,
          autoplayEligible: true,
          order: 2,
          schedule: {
            timezone: "Asia/Tehran",
            startAtUtc: "2026-02-10T10:00:00",
            endAtUtc: "2026-02-12T10:00:00",
          },
          devices: {
            desktop: {
              slots: {
                topLeftTextBanner: {
                  title: "Hello",
                },
              },
            },
          },
        },
      ],
    });

    expect(errors).toEqual([]);
    expect(value.version).toBe(2);
    expect(value.autoplayIntervalMs).toBe(8000);
    expect(value.slides).toHaveLength(1);
    expect(value.slides[0].devices.desktop.slots.topLeftTextBanner.title).toBe("Hello");
  });

  it("rejects invalid link protocol", () => {
    const { errors } = sanitizeHeroSliderPayload({
      slides: [
        {
          id: "slide-1",
          devices: {
            mobile: {
              slots: {
                primaryBanner: {
                  link: {
                    type: "external",
                    href: "ftp://unsafe.example.com",
                  },
                },
              },
            },
          },
        },
      ],
    });

    expect(errors.length).toBeGreaterThan(0);
    expect(errors.join(" ")).toContain("http/https");
  });

  it("rejects invalid schedule ranges", () => {
    const { errors } = sanitizeHeroSliderPayload({
      slides: [
        {
          id: "slide-1",
          schedule: {
            startAtUtc: "2026-02-12T10:00:00",
            endAtUtc: "2026-02-11T10:00:00",
          },
        },
      ],
    });

    expect(errors.length).toBeGreaterThan(0);
    expect(errors.join(" ")).toContain("invalid range");
  });

  it("clamps v2 image overflow settings", () => {
    const { value, errors } = sanitizeHeroSliderPayload({
      slides: [
        {
          id: "slide-1",
          devices: {
            desktop: {
              slots: {
                rightBanner: {
                  foregroundOverflow: {
                    enabled: true,
                    edge: "left",
                    amountPx: 999,
                    offsetXPercent: -999,
                    offsetYPercent: 999,
                    widthPercent: 999,
                  },
                },
                bottomActionBannerLeft: {
                  imageOverflow: {
                    enabled: true,
                    edge: "bottom",
                    amountPx: 24,
                    offsetXPercent: 55,
                    offsetYPercent: 45,
                    widthPercent: 130,
                  },
                },
              },
            },
          },
        },
      ],
    });

    const overflow =
      value.slides[0].devices.desktop.slots.rightBanner.foregroundOverflow;
    const cardOverflow =
      value.slides[0].devices.desktop.slots.bottomActionBannerLeft.imageOverflow;

    expect(errors).toEqual([]);
    expect(overflow).toMatchObject({
      enabled: true,
      edge: "left",
      amountPx: 240,
      offsetXPercent: -100,
      offsetYPercent: 200,
      widthPercent: 220,
    });
    expect(cardOverflow).toMatchObject({
      enabled: true,
      edge: "bottom",
      amountPx: 24,
      widthPercent: 130,
    });
  });

  it("preserves and clamps inner border settings on card and main visual slots", () => {
    const { value, errors } = sanitizeHeroSliderPayload({
      slides: [
        {
          id: "slide-1",
          devices: {
            desktop: {
              slots: {
                rightBanner: {
                  innerBorder: {
                    enabled: true,
                    color: "#eeeeee",
                    widthPx: 99,
                    offsetPx: -4,
                  },
                },
                bottomActionBannerLeft: {
                  innerBorder: {
                    enabled: true,
                    color: "#ffffff",
                    widthPx: 4,
                    offsetPx: 24,
                  },
                },
              },
            },
          },
        },
      ],
    });

    const slots = value.slides[0].devices.desktop.slots;

    expect(errors).toEqual([]);
    expect(slots.rightBanner.innerBorder).toEqual({
      enabled: true,
      color: "#eeeeee",
      widthPx: 12,
      offsetPx: 0,
    });
    expect(slots.bottomActionBannerLeft.innerBorder).toEqual({
      enabled: true,
      color: "#ffffff",
      widthPx: 4,
      offsetPx: 24,
    });
    expect(slots.bottomActionBannerRight.innerBorder).toEqual({
      enabled: false,
      color: "#ffffff",
      widthPx: 1,
      offsetPx: 12,
    });
  });
});

describe("hero slider publish meta", () => {
  it("creates publish metadata", () => {
    const meta = createHeroSliderMeta(42);

    expect(meta.version).toBe(2);
    expect(meta.publishedBy).toBe(42);
    expect(typeof meta.publishedAt).toBe("string");
    expect(new Date(meta.publishedAt).toString()).not.toBe("Invalid Date");
  });
});

describe("hero slider custom routes", () => {
  it("protects hero slider endpoints with superadmin-only policy", () => {
    const heroRoutes = routesConfig.routes.filter((route) =>
      String(route.path).startsWith("/settings/hero-slider"),
    );

    expect(heroRoutes).toHaveLength(3);

    heroRoutes.forEach((route) => {
      expect(route.config.auth).toEqual({ scope: [] });
      expect(route.config.policies).toEqual([
        {
          name: "global::role-based",
          config: {
            roles: [ROLE_NAMES.SUPERADMIN],
          },
        },
      ]);
    });
  });
});
