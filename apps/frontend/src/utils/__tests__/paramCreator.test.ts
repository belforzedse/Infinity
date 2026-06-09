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
      "populate[0]=user&populate[1]=user.profile&populate[2]=user.settings",
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
    expect(result).toContain("populate[1]=author");
    expect(result).toContain("populate[2]=author.name");
    expect(result).toContain("populate[3]=author.email");
    expect(result).toContain("populate[4]=tags");
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

    expect(result).toBe(
      "populate[0]=post&populate[1]=post.author&populate[2]=post.author.profile&populate[3]=post.author.profile.avatar",
    );
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

    expect(result).toContain("populate[0]=product");
    expect(result).toContain("populate[1]=product.images");
    expect(result).toContain("populate[2]=product.category");
    expect(result).toContain("populate[3]=product.category.name");
    expect(result).toContain("populate[4]=product.category.parent");
    expect(result).toContain("populate[5]=product.category.parent.name");
    expect(result).toContain("populate[6]=product.variants");
    expect(result).toContain("populate[7]=reviews");
  });
});
