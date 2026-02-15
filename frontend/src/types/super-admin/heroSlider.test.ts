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
  });
});
