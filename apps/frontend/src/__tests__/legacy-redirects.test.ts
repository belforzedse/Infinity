jest.mock("next/server", () => ({
  NextResponse: {
    next: jest.fn(),
    redirect: jest.fn(),
  },
}));

const {
  getLegacyRedirectUrl,
  isRetiredLegacyPath,
  LEGACY_REDIRECT_STATUS,
} = require("../../middleware");

function legacyTarget(path: string) {
  return getLegacyRedirectUrl(new URL(path, "https://infinitycolor.co"));
}

describe("legacy WooCommerce redirects", () => {
  it("uses permanent 301 redirects", () => {
    expect(LEGACY_REDIRECT_STATUS).toBe(301);
  });

  it("redirects product variation URLs to canonical PDPs", () => {
    const target = legacyTarget("/product/teddy-pants-z0051/?pa_color=کرم");

    expect(target?.pathname).toBe("/pdp/teddy-pants-z0051");
    expect(target?.search).toBe("");
  });

  it("preserves category pagination as PLP pagination", () => {
    const target = legacyTarget("/shop/pants/page/2/");

    expect(target?.pathname).toBe("/plp/category/pants");
    expect(target?.searchParams.get("page")).toBe("2");
  });

  it("redirects nested product categories using the final slug segment", () => {
    const target = legacyTarget("/shop/coat/shacket/");

    expect(target?.pathname).toBe("/plp/category/shacket");
    expect(target?.search).toBe("");
  });

  it("redirects Oppsi offer URLs to product search", () => {
    const target = legacyTarget("/offer/oppsi/");

    expect(target?.pathname).toBe("/plp");
    expect(target?.searchParams.get("search")).toBe("Oppsi");
  });

  it("redirects damaged-products Persian URL to Oppsi search", () => {
    const target = legacyTarget("/محصولات-زده-دار/");

    expect(target?.pathname).toBe("/plp");
    expect(target?.searchParams.get("search")).toBe("Oppsi");
  });

  it("redirects return policy Persian URL to FAQ", () => {
    const target = legacyTarget("/شرایط-و-مقررات-تعویض-و-مرجوع/");

    expect(target?.pathname).toBe("/faq");
    expect(target?.search).toBe("");
  });

  it("redirects nested blog categories to blog category filters", () => {
    const target = legacyTarget("/category/مد-و-پوشاک/انواع-استایل/");

    expect(target?.pathname).toBe("/blog");
    expect(target?.searchParams.get("category")).toBe("انواع-استایل");
  });

  it("does not redirect retired offer URLs", () => {
    const target = legacyTarget("/offer/best-sellers/");

    expect(target).toBeNull();
    expect(isRetiredLegacyPath("/offer/best-sellers/")).toBe(true);
  });
});
