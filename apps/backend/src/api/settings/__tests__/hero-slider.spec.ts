import routesConfig from "../routes/custom-router";
import {
  createHeroSliderMeta,
  sanitizeHeroSliderPayload,
} from "../services/hero-slider-schema";
import { ROLE_NAMES } from "../../../utils/roles";

describe("hero slider schema sanitizer", () => {
  it("sanitizes a valid v3 payload without errors", () => {
    const { value, errors } = sanitizeHeroSliderPayload({
      version: 3,
      autoplayIntervalMs: 8000,
      slides: [
        {
          id: "slide-1",
          imageUrl: "/uploads/hero.webp",
          imageAlt: "Hero banner",
          link: { type: "internal", href: "/products" },
          isActive: true,
          autoplayEligible: true,
          order: 2,
          schedule: {
            timezone: "Asia/Tehran",
            startAtUtc: "2026-02-10T10:00:00",
            endAtUtc: "2026-02-12T10:00:00",
          },
        },
      ],
    });

    expect(errors).toEqual([]);
    expect(value.version).toBe(3);
    expect(value.autoplayIntervalMs).toBe(8000);
    expect(value.slides).toHaveLength(1);
    expect(value.slides[0]).toMatchObject({
      imageUrl: "/uploads/hero.webp",
      imageAlt: "Hero banner",
      link: { type: "internal", href: "/products" },
    });
  });

  it("converts legacy v2 main visual data to a single banner image", () => {
    const { value, errors } = sanitizeHeroSliderPayload({
      version: 2,
      slides: [
        {
          id: "legacy-slide",
          devices: {
            desktop: {
              slots: {
                rightBanner: {
                  foregroundImageUrl: "/uploads/legacy-foreground.webp",
                  backgroundImageUrl: "/uploads/legacy-background.webp",
                  foregroundAlt: "Legacy foreground",
                  link: { type: "internal", href: "/legacy" },
                },
              },
            },
          },
        },
      ],
    });

    expect(errors).toEqual([]);
    expect(value.version).toBe(3);
    expect(value.slides[0]).toMatchObject({
      id: "legacy-slide",
      imageUrl: "/uploads/legacy-foreground.webp",
      imageAlt: "Legacy foreground",
      link: { type: "internal", href: "/legacy" },
    });
  });

  it("rejects invalid link protocol", () => {
    const { errors } = sanitizeHeroSliderPayload({
      version: 3,
      slides: [
        {
          id: "slide-1",
          imageUrl: "/uploads/hero.webp",
          link: {
            type: "external",
            href: "ftp://unsafe.example.com",
          },
        },
      ],
    });

    expect(errors.length).toBeGreaterThan(0);
    expect(errors.join(" ")).toContain("http/https");
  });

  it("rejects invalid schedule ranges", () => {
    const { errors } = sanitizeHeroSliderPayload({
      version: 3,
      slides: [
        {
          id: "slide-1",
          imageUrl: "/uploads/hero.webp",
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

  it("rejects obsolete slot controls in explicit v3 payloads", () => {
    const { errors } = sanitizeHeroSliderPayload({
      version: 3,
      slides: [
        {
          id: "slide-1",
          imageUrl: "/uploads/hero.webp",
          devices: {
            desktop: {
              slots: {},
            },
          },
          foregroundZoom: 1.4,
        },
      ],
    });

    expect(errors.join(" ")).toContain("devices is obsolete");
    expect(errors.join(" ")).toContain("foregroundZoom is obsolete");
  });
});

describe("hero slider publish meta", () => {
  it("creates publish metadata", () => {
    const meta = createHeroSliderMeta(42);

    expect(meta.version).toBe(3);
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
