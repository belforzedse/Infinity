import { getMobileBackFallbackHref } from "@/utils/mobileBackNavigation";

describe("getMobileBackFallbackHref", () => {
  it("returns product and listing fallbacks", () => {
    expect(getMobileBackFallbackHref("/pdp/sample-product")).toBe("/plp");
    expect(getMobileBackFallbackHref("/plp/category/shoes")).toBe("/plp");
    expect(getMobileBackFallbackHref("/plp")).toBe("/");
  });

  it("returns blog fallbacks", () => {
    expect(getMobileBackFallbackHref("/blog")).toBe("/");
    expect(getMobileBackFallbackHref("/summer-style-guide")).toBe("/blog");
  });

  it("returns checkout and cart fallbacks", () => {
    expect(getMobileBackFallbackHref("/checkout")).toBe("/cart");
    expect(getMobileBackFallbackHref("/cart")).toBe("/");
  });

  it("returns account and order fallbacks", () => {
    expect(getMobileBackFallbackHref("/account")).toBe("/");
    expect(getMobileBackFallbackHref("/orders")).toBe("/account");
    expect(getMobileBackFallbackHref("/orders/123")).toBe("/orders");
    expect(getMobileBackFallbackHref("/orders/reserve/456")).toBe("/orders");
    expect(getMobileBackFallbackHref("/addresses")).toBe("/account");
    expect(getMobileBackFallbackHref("/wallet")).toBe("/account");
  });

  it("returns super-admin add, edit, detail, and root fallbacks", () => {
    expect(getMobileBackFallbackHref("/super-admin")).toBeNull();
    expect(getMobileBackFallbackHref("/super-admin/products/add")).toBe("/super-admin/products");
    expect(getMobileBackFallbackHref("/super-admin/products/categories/edit/12")).toBe(
      "/super-admin/products/categories",
    );
    expect(getMobileBackFallbackHref("/super-admin/reports/admin-activity/99")).toBe(
      "/super-admin/reports/admin-activity",
    );
    expect(getMobileBackFallbackHref("/super-admin/products")).toBe("/super-admin");
  });
});
