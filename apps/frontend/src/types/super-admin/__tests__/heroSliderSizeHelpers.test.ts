import {
  backgroundSizeToPercent,
  cardObjectPositionToPercents,
  cardPercentsToObjectPosition,
  customWidthToPercent,
  customHeightToPercent,
  foregroundCustomHeightToPercent,
  foregroundCustomWidthToPercent,
  fontSizeTokenToPx,
  isAllowedFontSizeToken,
  objectPositionPresetValue,
  objectPositionToPercents,
  percentToBackgroundSize,
  percentToCustomWidth,
  percentToCustomHeight,
  percentToForegroundCustomHeight,
  percentToForegroundCustomWidth,
  percentsToObjectPosition,
  pxToFontSizeToken,
  fontSizeClassFromToken,
  fontSizeTokenToInlineStyle,
  resolveFontSizeToken,
} from "@/types/super-admin/heroSlider";

describe("hero slider size helpers", () => {
  it("converts px tokens round-trip", () => {
    expect(fontSizeTokenToPx("text-[32px]")).toBe(32);
    expect(pxToFontSizeToken(32)).toBe("text-[32px]");
  });

  it("reads legacy tailwind font tokens", () => {
    expect(fontSizeTokenToPx("text-lg")).toBe(18);
    expect(fontSizeTokenToPx("lg:text-[48px] 2xl:text-[50px]")).toBe(50);
  });

  it("allows dynamic px font tokens", () => {
    expect(isAllowedFontSizeToken("text-[40px]")).toBe(true);
    expect(isAllowedFontSizeToken("invalid-class")).toBe(false);
  });

  it("converts background size percent", () => {
    expect(backgroundSizeToPercent("cover")).toBe(100);
    expect(backgroundSizeToPercent("120% auto")).toBe(120);
    expect(percentToBackgroundSize(100)).toBe("cover");
    expect(percentToBackgroundSize(120)).toBe("120% auto");
  });

  it("converts custom width percent", () => {
    expect(customWidthToPercent("52%")).toBe(52);
    expect(percentToCustomWidth(52)).toBe("52%");
  });

  it("resolves px tokens for inline rendering", () => {
    expect(resolveFontSizeToken("text-[69px]")).toEqual({ className: "", fontSizePx: 69 });
    expect(fontSizeTokenToInlineStyle("text-[69px]")).toEqual({ fontSize: "69px" });
    expect(fontSizeClassFromToken("text-[69px]")).toBe("");
    expect(fontSizeClassFromToken("text-lg")).toBe("text-lg");
  });

  it("converts object position presets and percents", () => {
    expect(objectPositionToPercents("bottom left")).toEqual({ x: 0, y: 100 });
    expect(objectPositionToPercents("50% 25%")).toEqual({ x: 50, y: 25 });
    expect(percentsToObjectPosition(0, 100)).toBe("bottom left");
    expect(percentsToObjectPosition(33, 66)).toBe("33% 66%");
    expect(objectPositionPresetValue("bottom center")).toBe("bottom center");
    expect(objectPositionPresetValue("33% 66%")).toBe("");
  });

  it("converts custom height percent", () => {
    expect(customHeightToPercent("")).toBe(100);
    expect(customHeightToPercent("60%")).toBe(60);
    expect(percentToCustomHeight(100)).toBe("");
    expect(percentToCustomHeight(60)).toBe("60%");
  });

  it("converts foreground width and height with extended ranges", () => {
    expect(foregroundCustomWidthToPercent("220%")).toBe(220);
    expect(percentToForegroundCustomWidth(220)).toBe("220%");
    expect(foregroundCustomHeightToPercent("")).toBe(100);
    expect(foregroundCustomHeightToPercent("150%")).toBe(150);
    expect(percentToForegroundCustomHeight(100)).toBe("");
    expect(percentToForegroundCustomHeight(150)).toBe("150%");
    expect(objectPositionToPercents("180% 20%")).toEqual({ x: 180, y: 20 });
  });

  it("converts card image position with narrower range", () => {
    expect(cardObjectPositionToPercents("bottom left")).toEqual({ x: 0, y: 100 });
    expect(cardPercentsToObjectPosition(120, 80)).toBe("120% 80%");
    expect(cardObjectPositionToPercents("200% 0%")).toEqual({ x: 150, y: 0 });
  });
});
