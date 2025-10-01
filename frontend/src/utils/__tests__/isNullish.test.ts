import { isNullish } from "../isNullish";

describe("isNullish", () => {
  it("should return true for null", () => {
    expect(isNullish(null)).toBe(true);
  });

  it("should return true for undefined", () => {
    expect(isNullish(undefined)).toBe(true);
  });

  it("should return false for defined values", () => {
    expect(isNullish(0)).toBe(false);
    expect(isNullish(false)).toBe(false);
    expect(isNullish("")).toBe(false);
    expect(isNullish([])).toBe(false);
    expect(isNullish({})).toBe(false);
    expect(isNullish("test")).toBe(false);
    expect(isNullish(42)).toBe(false);
    expect(isNullish(true)).toBe(false);
  });

  it("should work as type guard", () => {
    const value: string | null | undefined = "test";

    if (!isNullish(value)) {
      // TypeScript should narrow the type here
      const upper: string = value.toUpperCase();
      expect(upper).toBe("TEST");
    }
  });
});
