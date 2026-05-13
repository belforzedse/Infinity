const mockStrapi = {
  log: {
    error: jest.fn(),
  },
  entityService: {
    findOne: jest.fn(),
    create: jest.fn(),
    delete: jest.fn(),
  },
  db: {
    query: jest.fn(),
  },
};

jest.mock("@strapi/strapi", () => ({
  factories: {
    createCoreController: jest.fn((_uid, builder) => builder({ strapi: mockStrapi })),
  },
}));

import controller from "../controllers/post-bookmark";

const postBookmarkController = controller as any;

function createCtx(overrides: Record<string, any> = {}) {
  return {
    request: { body: {} },
    query: {},
    state: {},
    send: jest.fn((payload) => payload),
    badRequest: jest.fn((message) => ({ status: 400, message })),
    unauthorized: jest.fn((message) => ({ status: 401, message })),
    notFound: jest.fn((message) => ({ status: 404, message })),
    internalServerError: jest.fn((message) => ({ status: 500, message })),
    ...overrides,
  };
}

describe("post-bookmark controller", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockStrapi.db.query.mockReset();
    mockStrapi.entityService.findOne.mockReset();
    mockStrapi.entityService.create.mockReset();
    mockStrapi.entityService.delete.mockReset();
  });

  describe("toggle", () => {
    it("rejects missing post ID", async () => {
      const ctx = createCtx({ state: { user: { id: 7 } } });

      await postBookmarkController.toggle(ctx);

      expect(ctx.badRequest).toHaveBeenCalledWith("Post ID is required");
    });

    it("requires authentication", async () => {
      const ctx = createCtx({ request: { body: { postId: 10 } } });

      await postBookmarkController.toggle(ctx);

      expect(ctx.unauthorized).toHaveBeenCalledWith("Authentication required");
    });

    it("returns not found when the post does not exist", async () => {
      mockStrapi.entityService.findOne.mockResolvedValue(null);
      const ctx = createCtx({
        request: { body: { postId: 10 } },
        state: { user: { id: 7 } },
      });

      await postBookmarkController.toggle(ctx);

      expect(mockStrapi.entityService.findOne).toHaveBeenCalledWith("api::post.post", 10);
      expect(ctx.notFound).toHaveBeenCalledWith("Post not found");
    });

    it("creates a bookmark when none exists", async () => {
      const bookmarkQuery = { findOne: jest.fn().mockResolvedValue(null) };
      mockStrapi.entityService.findOne.mockResolvedValue({ id: 10 });
      mockStrapi.entityService.create.mockResolvedValue({ id: 22 });
      mockStrapi.db.query.mockReturnValue(bookmarkQuery);
      const ctx = createCtx({
        request: { body: { postId: 10 } },
        state: { user: { id: 7 } },
      });

      await postBookmarkController.toggle(ctx);

      expect(bookmarkQuery.findOne).toHaveBeenCalledWith({
        where: { user: 7, post: 10 },
      });
      expect(mockStrapi.entityService.create).toHaveBeenCalledWith(
        "api::post-bookmark.post-bookmark",
        { data: { user: 7, post: 10 } },
      );
      expect(ctx.send).toHaveBeenCalledWith(
        expect.objectContaining({ success: true, isBookmarked: true }),
      );
    });

    it("removes an existing bookmark", async () => {
      const bookmarkQuery = { findOne: jest.fn().mockResolvedValue({ id: 22 }) };
      mockStrapi.entityService.findOne.mockResolvedValue({ id: 10 });
      mockStrapi.db.query.mockReturnValue(bookmarkQuery);
      const ctx = createCtx({
        request: { body: { postId: 10 } },
        state: { user: { id: 7 } },
      });

      await postBookmarkController.toggle(ctx);

      expect(mockStrapi.entityService.delete).toHaveBeenCalledWith(
        "api::post-bookmark.post-bookmark",
        22,
      );
      expect(ctx.send).toHaveBeenCalledWith(
        expect.objectContaining({ success: true, isBookmarked: false }),
      );
    });
  });

  describe("getUserBookmarks", () => {
    it("returns only the current user's bookmarks with pagination", async () => {
      const bookmarkQuery = {
        findMany: jest.fn().mockResolvedValue([{ id: 1, post: { id: 10 } }]),
        count: jest.fn().mockResolvedValue(1),
      };
      mockStrapi.db.query.mockReturnValue(bookmarkQuery);
      const ctx = createCtx({
        query: { page: "2", pageSize: "5" },
        state: { user: { id: 7 } },
      });

      await postBookmarkController.getUserBookmarks(ctx);

      expect(bookmarkQuery.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { user: 7 },
          limit: 5,
          offset: 5,
        }),
      );
      expect(bookmarkQuery.count).toHaveBeenCalledWith({ where: { user: 7 } });
      expect(ctx.send).toHaveBeenCalledWith({
        data: [{ id: 1, post: { id: 10 } }],
        meta: {
          pagination: {
            page: 2,
            pageSize: 5,
            pageCount: 1,
            total: 1,
          },
        },
      });
    });
  });
});
