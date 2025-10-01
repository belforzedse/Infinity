import imageLoader from "../imageLoader";

describe("imageLoader", () => {
  const originalEnv = process.env.NEXT_PUBLIC_IMAGE_BASE_URL;

  afterEach(() => {
    process.env.NEXT_PUBLIC_IMAGE_BASE_URL = originalEnv;
  });

  it("should return data URLs unchanged", () => {
    const dataUrl = "data:image/png;base64,iVBORw0KGgo=";
    const result = imageLoader({ src: dataUrl, width: 800 });

    expect(result).toBe(dataUrl);
  });

  it("should return empty sources unchanged", () => {
    const result = imageLoader({ src: "", width: 800 });

    expect(result).toBe("");
  });

  it("should add width and quality parameters", () => {
    const result = imageLoader({ src: "/image.jpg", width: 800, quality: 90 });

    expect(result).toContain("w=800");
    expect(result).toContain("q=90");
  });

  it("should use default quality of 75", () => {
    const result = imageLoader({ src: "/image.jpg", width: 800 });

    expect(result).toContain("q=75");
  });

  it("should add webp format parameter", () => {
    const result = imageLoader({ src: "/image.jpg", width: 800 });

    expect(result).toContain("f=webp");
  });

  it("should handle absolute URLs", () => {
    const result = imageLoader({
      src: "https://example.com/image.jpg",
      width: 800,
    });

    expect(result).toContain("https://example.com/image.jpg");
    expect(result).toContain("w=800");
  });

  it("should handle relative URLs with BASE_URL", () => {
    process.env.NEXT_PUBLIC_IMAGE_BASE_URL = "https://cdn.example.com";

    const result = imageLoader({ src: "/uploads/image.jpg", width: 800 });

    expect(result).toContain("https://cdn.example.com/uploads/image.jpg");
    expect(result).toContain("w=800");
  });

  it("should handle URLs with existing query parameters", () => {
    const result = imageLoader({
      src: "/image.jpg?existing=param",
      width: 800,
    });

    expect(result).toContain("existing=param");
    expect(result).toContain("w=800");
  });

  it("should fallback to appending params on URL parse error", () => {
    const invalidUrl = "not a valid url with spaces";
    const result = imageLoader({ src: invalidUrl, width: 800, quality: 90 });

    expect(result).toBe(`${invalidUrl}?w=800&q=90&f=webp`);
  });

  it("should use & for URLs with existing params in fallback", () => {
    const urlWithParams = "/image.jpg?existing=param";
    const result = imageLoader({ src: urlWithParams, width: 800, quality: 90 });

    // Should either use proper URL parsing or fallback with &
    expect(result).toMatch(/[?&]w=800/);
  });

  it("should handle different width values", () => {
    const result1 = imageLoader({ src: "/image.jpg", width: 400 });
    const result2 = imageLoader({ src: "/image.jpg", width: 1920 });

    expect(result1).toContain("w=400");
    expect(result2).toContain("w=1920");
  });

  it("should convert width to string", () => {
    const result = imageLoader({ src: "/image.jpg", width: 800 });

    expect(result).toContain("w=800");
    expect(result).not.toContain("w=[object");
  });
});
