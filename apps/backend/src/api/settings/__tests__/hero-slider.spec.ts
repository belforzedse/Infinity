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
    expect(value.version).toBe(1);
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
});

describe("hero slider publish meta", () => {
  it("creates publish metadata", () => {
    const meta = createHeroSliderMeta(42);

    expect(meta.version).toBe(1);
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
