import {
  buildSocialFeedPostsQuery,
  normalizeStrapiPostEntry,
} from "@repo/social-posts";

function postEntry(overrides: Record<string, unknown> = {}) {
  return {
    id: 12,
    attributes: {
      Title: "پست تست",
      Slug: "test-post",
      Size: "Small",
      ProductLink: "",
      CoverImage: {
        data: {
          id: 1,
          attributes: {
            url: "/uploads/cover.jpg",
            alternativeText: "کاور",
            mime: "image/jpeg",
          },
        },
      },
      Media: {
        data: [
          {
            id: 2,
            attributes: {
              url: "/uploads/image.jpg",
              alternativeText: "تصویر",
              mime: "image/jpeg",
            },
          },
        ],
      },
      post_likes: { data: [], meta: { pagination: { total: 4 } } },
      post_comments: { data: [], meta: { pagination: { total: 2 } } },
      ...overrides,
    },
  };
}

describe("social post feed primitives", () => {
  it("honors the requested feed limit in the query", () => {
    const params = new URLSearchParams(buildSocialFeedPostsQuery({ limit: 8 }));

    expect(params.get("pagination[pageSize]")).toBe("8");
    expect(params.get("sort")).toBe("createdAt:desc");
  });

  it("maps Large and X Large posts to large cards and other sizes to small cards", () => {
    expect(normalizeStrapiPostEntry(postEntry({ Size: "Large" }))?.desktopVariant).toBe("xl");
    expect(normalizeStrapiPostEntry(postEntry({ Size: "X Large" }))?.desktopVariant).toBe("xl");
    expect(normalizeStrapiPostEntry(postEntry({ Size: "Medium" }))?.desktopVariant).toBe("sm");
  });

  it("detects video, gallery, and infinity overlays", () => {
    expect(
      normalizeStrapiPostEntry(
        postEntry({
          Media: {
            data: [
              {
                id: 3,
                attributes: {
                  url: "/uploads/reel.mp4",
                  mime: "video/mp4",
                },
              },
            ],
          },
        }),
      )?.overlay,
    ).toBe("video");

    expect(
      normalizeStrapiPostEntry(
        postEntry({
          Media: {
            data: [
              { id: 4, attributes: { url: "/uploads/a.jpg", mime: "image/jpeg" } },
              { id: 5, attributes: { url: "/uploads/b.jpg", mime: "image/jpeg" } },
            ],
          },
        }),
      )?.overlay,
    ).toBe("gallery");

    expect(normalizeStrapiPostEntry(postEntry({ ProductLink: "/pdp/item" }))?.overlay).toBe("infinity");
  });

  it("skips malformed posts without a cover image", () => {
    expect(normalizeStrapiPostEntry(postEntry({ CoverImage: { data: null } }))).toBeNull();
  });
});
