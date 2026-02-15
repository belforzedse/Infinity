import blogPostLifecycles from "../lifecycles";

describe("blog-post lifecycles", () => {
  const originalEnv = process.env;
  const originalFetch = global.fetch;

  beforeEach(() => {
    process.env = { ...originalEnv, REVALIDATION_SECRET: "test-secret" };
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: jest.fn().mockResolvedValue({ revalidated: true }),
      text: jest.fn().mockResolvedValue(""),
    } as any);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  afterAll(() => {
    process.env = originalEnv;
    global.fetch = originalFetch;
  });

  it("skips revalidation for counter-only updates", async () => {
    await blogPostLifecycles.afterUpdate({
      params: { data: { ViewCount: 42 } },
      result: { Status: "Published", Slug: "my-post" },
    });

    expect(global.fetch).not.toHaveBeenCalled();
  });

  it("revalidates published posts for non-counter updates", async () => {
    await blogPostLifecycles.afterUpdate({
      params: { data: { Title: "Updated title" } },
      result: { Status: "Published", Slug: "my-post" },
    });

    expect(global.fetch).toHaveBeenCalledTimes(2);
  });
});
