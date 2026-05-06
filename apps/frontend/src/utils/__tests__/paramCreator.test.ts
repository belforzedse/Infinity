import { paramCreator } from "../paramCreator";

describe("paramCreator", () => {
  it("should handle simple boolean fields", () => {
    const result = paramCreator({
      name: true,
      description: true,
    });

    expect(result).toBe("populate[0]=name&populate[1]=description");
  });

  it("should handle nested objects", () => {
    const result = paramCreator({
      user: {
        profile: true,
        settings: true,
      },
    });

    expect(result).toBe(
      "populate[user][populate][0]=profile&populate[user][populate][1]=settings",
    );
  });

  it("should handle mixed boolean and nested objects", () => {
    const result = paramCreator({
      title: true,
      author: {
        name: true,
        email: true,
      },
      tags: true,
    });

    expect(result).toContain("populate[0]=title");
    expect(result).toContain("populate[author][populate][0]=name");
    expect(result).toContain("populate[author][populate][1]=email");
    expect(result).toContain("populate[1]=tags");
  });

  it("should handle deeply nested objects", () => {
    const result = paramCreator({
      post: {
        author: {
          profile: {
            avatar: true,
          },
        },
      },
    });

    expect(result).toBe("populate[post][author][profile][populate][0]=avatar");
  });

  it("should ignore false boolean values", () => {
    const result = paramCreator({
      name: true,
      description: false,
      title: true,
    });

    expect(result).toBe("populate[0]=name&populate[1]=title");
    expect(result).not.toContain("description");
  });

  it("should handle empty object", () => {
    const result = paramCreator({});
    expect(result).toBe("");
  });

  it("should handle object with only false values", () => {
    const result = paramCreator({
      field1: false,
      field2: false,
    });

    expect(result).toBe("");
  });

  it("should handle complex nested structure", () => {
    const result = paramCreator({
      product: {
        images: true,
        category: {
          name: true,
          parent: {
            name: true,
          },
        },
        variants: true,
      },
      reviews: true,
    });

    expect(result).toContain("populate[product][populate][0]=images");
    expect(result).toContain("populate[product][category][populate][0]=name");
    expect(result).toContain(
      "populate[product][category][parent][populate][0]=name",
    );
    expect(result).toContain("populate[product][populate][1]=variants");
    expect(result).toContain("populate[0]=reviews");
  });
});
