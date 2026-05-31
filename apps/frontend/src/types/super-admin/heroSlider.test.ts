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

    it("copies desktop headline font styling while keeping device font sizes", () => {
      const payload = normalizeHeroSliderPayload({
        slides: [
          {
            id: "slide-1",
            order: 0,
            devices: {
              desktop: {
                slots: {
                  topLeftTextBanner: {
                    titleStyle: {
                      color: "#123456",
                      fontFamily: "font-rokh",
                      fontWeight: "font-semibold",
                      lineHeight: "leading-[110%]",
                      letterSpacing: "tracking-wide",
                      fontSize: "lg:text-[44px] 2xl:text-[54px]",
                    },
                    subtitleStyle: {
                      color: "#654321",
                      fontFamily: "font-peyda",
                      fontWeight: "font-medium",
                      lineHeight: "leading-[150%]",
                      letterSpacing: "tracking-tight",
                      fontSize: "lg:text-[30px] 2xl:text-[34px]",
                    },
                  },
                },
              },
            },
          },
        ],
      });

      const synced = syncTabletAndMobileFromDesktop(payload.slides[0] as HeroSlideConfig);
      const tabletTitle = synced.devices.tablet.slots.primaryBanner.titleStyle;
      const mobileTitle = synced.devices.mobile.slots.primaryBanner.titleStyle;
      const tabletSubtitle = synced.devices.tablet.slots.primaryBanner.subtitleStyle;

      expect(tabletTitle).toMatchObject({
        color: "#123456",
        fontFamily: "font-rokh",
        fontWeight: "font-semibold",
        lineHeight: "leading-[110%]",
        letterSpacing: "tracking-wide",
      });
      expect(tabletTitle.fontSize).toBe("lg:text-[40px] 2xl:text-[48px]");
      expect(mobileTitle.fontFamily).toBe("font-rokh");
      expect(mobileTitle.fontSize).toBe("text-xl sm:text-2xl md:text-3xl");
      expect(tabletSubtitle).toMatchObject({
        color: "#654321",
        fontFamily: "font-peyda",
        fontWeight: "font-medium",
        lineHeight: "leading-[150%]",
        letterSpacing: "tracking-tight",
      });
      expect(tabletSubtitle.fontSize).toBe("lg:text-[24px] 2xl:text-[28px]");
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

    it("normalizes inner border defaults and clamps ranges", () => {
      const payload = normalizeHeroSliderPayload({
        slides: [
          {
            id: "slide-1",
            order: 0,
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

      const slots = (payload.slides[0] as HeroSlideConfig).devices.desktop.slots;

      expect(slots.rightBanner.innerBorder).toEqual({
        enabled: true,
        color: "#eeeeee",
        widthPx: 12,
        offsetPx: 0,
      });
      expect(slots.bottomActionBannerRight.innerBorder).toEqual({
        enabled: false,
        color: "#ffffff",
        widthPx: 1,
        offsetPx: 12,
      });
      expect(slots.bottomActionBannerLeft.innerBorder).toEqual({
        enabled: true,
        color: "#ffffff",
        widthPx: 4,
        offsetPx: 24,
      });
    });

    it("copies desktop inner borders to tablet and mobile cards and main visual", () => {
      const payload = normalizeHeroSliderPayload({
        slides: [
          {
            id: "slide-1",
            order: 0,
            devices: {
              desktop: {
                slots: {
                  rightBanner: {
                    innerBorder: {
                      enabled: true,
                      color: "#ffffff",
                      widthPx: 2,
                      offsetPx: 14,
                    },
                  },
                  bottomActionBannerLeft: {
                    innerBorder: {
                      enabled: true,
                      color: "#fafafa",
                      widthPx: 3,
                      offsetPx: 18,
                    },
                  },
                },
              },
            },
          },
        ],
      });

      const synced = syncTabletAndMobileFromDesktop(payload.slides[0] as HeroSlideConfig);

      expect(synced.devices.tablet.slots.heroBanner.innerBorder).toEqual({
        enabled: true,
        color: "#ffffff",
        widthPx: 2,
        offsetPx: 14,
      });
      expect(synced.devices.mobile.slots.heroBanner.innerBorder).toEqual({
        enabled: true,
        color: "#ffffff",
        widthPx: 2,
        offsetPx: 14,
      });
      expect(synced.devices.tablet.slots.bottomActionBannerLeft.innerBorder).toEqual({
        enabled: true,
        color: "#fafafa",
        widthPx: 3,
        offsetPx: 18,
      });
      expect(synced.devices.mobile.slots.bottomActionBannerLeft.innerBorder).toEqual({
        enabled: true,
        color: "#fafafa",
        widthPx: 3,
        offsetPx: 18,
      });
    });
  });
});
