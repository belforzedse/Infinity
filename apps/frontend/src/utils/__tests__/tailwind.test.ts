import { cn } from "../tailwind";

describe("cn (tailwind utility)", () => {
  it("should merge class names", () => {
    const result = cn("text-red-500", "bg-blue-500");
    expect(result).toBe("text-red-500 bg-blue-500");
  });

  it("should handle conditional classes", () => {
    const result = cn("base-class", true && "conditional-class", false && "hidden");
    expect(result).toBe("base-class conditional-class");
  });

  it("should merge tailwind classes correctly", () => {
    const result = cn("px-2 py-1", "px-4");
    expect(result).toBe("py-1 px-4");
  });

  it("should handle array inputs", () => {
    const result = cn(["class1", "class2"], "class3");
    expect(result).toBe("class1 class2 class3");
  });

  it("should handle object inputs", () => {
    const result = cn({ "text-red-500": true, "bg-blue-500": false, "font-bold": true });
    expect(result).toBe("text-red-500 font-bold");
  });

  it("should handle undefined and null", () => {
    const result = cn("base", undefined, null, "end");
    expect(result).toBe("base end");
  });

  it("should deduplicate and merge conflicting tailwind classes", () => {
    const result = cn("text-sm text-lg");
    expect(result).toBe("text-lg");
  });

  it("should handle empty inputs", () => {
    const result = cn();
    expect(result).toBe("");
  });

  it("should handle complex scenario", () => {
    const isActive = true;
    const hasError = false;

    const result = cn(
      "px-4 py-2 rounded",
      isActive && "bg-blue-500 text-white",
      hasError && "border-red-500",
      { "hover:bg-blue-600": isActive },
    );

    expect(result).toContain("px-4");
    expect(result).toContain("py-2");
    expect(result).toContain("rounded");
    expect(result).toContain("bg-blue-500");
    expect(result).toContain("text-white");
    expect(result).toContain("hover:bg-blue-600");
    expect(result).not.toContain("border-red-500");
  });
});
