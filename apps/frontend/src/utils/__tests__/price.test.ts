import { priceFormatter } from "../price";

describe("Price utilities", () => {
  describe("priceFormatter", () => {
    it("formats price with Farsi locale", () => {
      expect(priceFormatter(1000)).toBe("۱٬۰۰۰");
      expect(priceFormatter(1234567)).toBe("۱٬۲۳۴٬۵۶۷");
    });

    it("formats price with zero", () => {
      expect(priceFormatter(0)).toBe("۰");
    });

    it("formats negative prices", () => {
      expect(priceFormatter(-1000)).toBe("‎−۱٬۰۰۰");
    });

    it("formats price with suffix", () => {
      expect(priceFormatter(1000, " ریال")).toBe("۱٬۰۰۰ ریال");
      expect(priceFormatter(1234567, " تومان")).toBe("۱٬۲۳۴٬۵۶۷ تومان");
    });

    it("formats price with prefix", () => {
      expect(priceFormatter(1000, undefined, "$")).toBe("$۱٬۰۰۰");
      expect(priceFormatter(1234567, undefined, "قیمت: ")).toBe("قیمت: ۱٬۲۳۴٬۵۶۷");
    });

    it("formats price with both prefix and suffix", () => {
      expect(priceFormatter(1000, " ریال", "قیمت: ")).toBe("قیمت: ۱٬۰۰۰ ریال");
      expect(priceFormatter(1234567, " تومان", "مبلغ ")).toBe("مبلغ ۱٬۲۳۴٬۵۶۷ تومان");
    });

    it("handles decimal numbers", () => {
      expect(priceFormatter(1000.5)).toBe("۱٬۰۰۰٫۵");
      expect(priceFormatter(1234.67)).toBe("۱٬۲۳۴٫۶۷");
    });

    it("handles very large numbers", () => {
      expect(priceFormatter(1000000000)).toBe("۱٬۰۰۰٬۰۰۰٬۰۰۰");
    });

    it("handles empty suffix and prefix", () => {
      expect(priceFormatter(1000, "", "")).toBe("۱٬۰۰۰");
    });

    it("handles undefined suffix and prefix", () => {
      expect(priceFormatter(1000, undefined, undefined)).toBe("۱٬۰۰۰");
    });

    it("handles null suffix and prefix gracefully", () => {
      expect(priceFormatter(1000, null as any, null as any)).toBe("۱٬۰۰۰");
    });

    it("formats common price ranges", () => {
      expect(priceFormatter(100, " ریال")).toBe("۱۰۰ ریال");
      expect(priceFormatter(10000, " ریال")).toBe("۱۰٬۰۰۰ ریال");
      expect(priceFormatter(1000000, " ریال")).toBe("۱٬۰۰۰٬۰۰۰ ریال");
    });
  });
});
