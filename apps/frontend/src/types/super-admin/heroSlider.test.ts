import {
  normalizeHeroSliderPayload,
  syncTabletAndMobileFromDesktop,
  type HeroSlideConfig,
} from "./heroSlider";

describe("heroSlider", () => {
  describe("syncTabletAndMobileFromDesktop", () => {
    it("copies desktop content to tablet and mobile with device-specific default styling", () => {
      const payload = normalizeHeroSliderPayload({
        slides: [
          {
            id: "slide-1",
            order: 0,
            devices: {
              desktop: {
                slots: {
                  topLeftTextBanner: {
                    title: "دسکتاپ تیتر",
                    subtitle: "دسکتاپ زیرتیتر",
                  },
                  rightBanner: {
                    foregroundImageUrl: "/uploads/hero-foreground.png",
                    foregroundAlt: "Hero image",
                  },
                  bottomActionBannerLeft: {
                    title: "کارت چپ",
                    subtitle: "زیرعنوان کارت",
                    imageUrl: "/uploads/card1.png",
                    buttonLabel: "مشاهده",
                    buttonHref: "/category/sale",
                  },
                  bottomActionBannerRight: {
                    title: "کارت راست",
                    imageUrl: "/uploads/card2.png",
                  },
                },
              },
            },
          },
        ],
      });

      const slide = payload.slides[0] as HeroSlideConfig;
      const synced = syncTabletAndMobileFromDesktop(slide);

      expect(synced.devices.tablet.slots.primaryBanner.title).toBe("دسکتاپ تیتر");
      expect(synced.devices.tablet.slots.primaryBanner.subtitle).toBe("دسکتاپ زیرتیتر");
      expect(synced.devices.mobile.slots.primaryBanner.title).toBe("دسکتاپ تیتر");
      expect(synced.devices.mobile.slots.primaryBanner.subtitle).toBe("دسکتاپ زیرتیتر");

      expect(synced.devices.tablet.slots.heroBanner.foregroundImageUrl).toBe(
        "/uploads/hero-foreground.png",
      );
      expect(synced.devices.mobile.slots.heroBanner.foregroundAlt).toBe("Hero image");

      expect(synced.devices.tablet.slots.bottomActionBannerLeft.title).toBe("کارت چپ");
      expect(synced.devices.tablet.slots.bottomActionBannerLeft.buttonHref).toBe("/category/sale");
      expect(synced.devices.mobile.slots.bottomActionBannerRight.title).toBe("کارت راست");
      expect(synced.devices.mobile.slots.bottomActionBannerRight.imageUrl).toBe("/uploads/card2.png");
    });

    it("applies tablet headline default fontSize (not desktop styling)", () => {
      const payload = normalizeHeroSliderPayload({
        slides: [{ id: "slide-1", order: 0 }],
      });
      const slide = payload.slides[0] as HeroSlideConfig;
      const synced = syncTabletAndMobileFromDesktop(slide);

      expect(synced.devices.tablet.slots.primaryBanner.titleStyle.fontSize).toBe(
        "lg:text-[40px] 2xl:text-[48px]",
      );
      expect(synced.devices.mobile.slots.primaryBanner.titleStyle.fontSize).toBe(
        "text-xl sm:text-2xl md:text-3xl",
      );
    });

    it("copies desktop colors to tablet and mobile", () => {
      const payload = normalizeHeroSliderPayload({
        slides: [
          {
            id: "slide-1",
            order: 0,
            devices: {
              desktop: {
                slots: {
                  topLeftTextBanner: {
                    title: "تیتر",
                    backgroundColor: "#E8F0FE",
                    titleStyle: { color: "#1A2B3C" },
                    subtitleStyle: { color: "#4D5E6F" },
                  },
                  bottomActionBannerLeft: {
                    title: "کارت",
                    backgroundColor: "#A6C2DB",
                    titleStyle: { color: "#FFFFFF" },
                    buttonStyle: { color: "#FF0000" },
                  },
                },
              },
            },
          },
        ],
      });

      const slide = payload.slides[0] as HeroSlideConfig;
      const synced = syncTabletAndMobileFromDesktop(slide);

      expect(synced.devices.tablet.slots.primaryBanner.backgroundColor).toBe("#E8F0FE");
      expect(synced.devices.tablet.slots.primaryBanner.titleStyle.color).toBe("#1A2B3C");
      expect(synced.devices.tablet.slots.primaryBanner.subtitleStyle.color).toBe("#4D5E6F");
      expect(synced.devices.mobile.slots.primaryBanner.backgroundColor).toBe("#E8F0FE");
      expect(synced.devices.mobile.slots.primaryBanner.titleStyle.color).toBe("#1A2B3C");

      expect(synced.devices.tablet.slots.bottomActionBannerLeft.backgroundColor).toBe("#A6C2DB");
      expect(synced.devices.tablet.slots.bottomActionBannerLeft.titleStyle.color).toBe("#FFFFFF");
      expect(synced.devices.tablet.slots.bottomActionBannerLeft.buttonStyle.color).toBe("#FF0000");
      expect(synced.devices.mobile.slots.bottomActionBannerLeft.buttonStyle.color).toBe("#FF0000");
    });

    it("copies desktop image positions to tablet and mobile", () => {
      const payload = normalizeHeroSliderPayload({
        slides: [
          {
            id: "slide-1",
            order: 0,
            devices: {
              desktop: {
                slots: {
                  rightBanner: {
                    foregroundObjectPosition: "left",
                  },
                  bottomActionBannerLeft: {
                    imageObjectPosition: "top left",
                  },
                  bottomActionBannerRight: {
                    imageObjectPosition: "left",
                  },
                },
              },
            },
          },
        ],
      });

      const slide = payload.slides[0] as HeroSlideConfig;
      const synced = syncTabletAndMobileFromDesktop(slide);

      expect(synced.devices.tablet.slots.heroBanner.foregroundObjectPosition).toBe("left");
      expect(synced.devices.mobile.slots.heroBanner.foregroundObjectPosition).toBe("left");
      expect(synced.devices.tablet.slots.bottomActionBannerLeft.imageObjectPosition).toBe("top left");
      expect(synced.devices.mobile.slots.bottomActionBannerLeft.imageObjectPosition).toBe("top left");
      expect(synced.devices.tablet.slots.bottomActionBannerRight.imageObjectPosition).toBe("left");
      expect(synced.devices.mobile.slots.bottomActionBannerRight.imageObjectPosition).toBe("left");
    });
  });
});
