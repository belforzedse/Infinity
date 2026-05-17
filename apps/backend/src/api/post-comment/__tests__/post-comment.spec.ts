const mockStrapi = {
  entityService: {
    findOne: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
  },
  service: jest.fn(),
};

const mockFetchUserWithRole = jest.fn();
const mockRoleIsAllowed = jest.fn();
const mockResolveUserDisplayName = jest.fn();

jest.mock("@strapi/strapi", () => ({
  factories: {
    createCoreController: jest.fn((_uid, builder) => builder({ strapi: mockStrapi })),
  },
}));

jest.mock("../../../utils/roles", () => ({
  fetchUserWithRole: (...args: unknown[]) => mockFetchUserWithRole(...args),
  roleIsAllowed: (...args: unknown[]) => mockRoleIsAllowed(...args),
}));

jest.mock("../../../utils/blog-helpers", () => ({
  resolveUserDisplayName: (...args: unknown[]) => mockResolveUserDisplayName(...args),
}));

import controller from "../controllers/post-comment";

const postCommentController = controller as any;

function createCtx(overrides: Record<string, any> = {}) {
  return {
    request: { body: {} },
    params: {},
    state: {},
    badRequest: jest.fn((message) => ({ status: 400, message })),
    unauthorized: jest.fn((message) => ({ status: 401, message })),
    notFound: jest.fn((message) => ({ status: 404, message })),
    forbidden: jest.fn((message) => ({ status: 403, message })),
    ...overrides,
  };
}

describe("post-comment controller", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockStrapi.entityService.findOne.mockReset();
    mockStrapi.entityService.create.mockReset();
    mockStrapi.entityService.update.mockReset();
    mockFetchUserWithRole.mockReset();
    mockRoleIsAllowed.mockReset();
    mockResolveUserDisplayName.mockReset();
    mockResolveUserDisplayName.mockReturnValue("کاربر");
  });

  describe("create", () => {
    it("stores IsInfinity from the authenticated user's role and ignores client input", async () => {
      mockStrapi.entityService.findOne.mockResolvedValue({ id: 10 });
      mockFetchUserWithRole.mockResolvedValue({
        id: 7,
        role: { name: "Superadmin" },
      });
      mockRoleIsAllowed.mockReturnValue(true);
      mockStrapi.entityService.create.mockResolvedValue({ id: 22 });

      const ctx = createCtx({
        request: {
          body: {
            data: {
              Content: "hello",
              post: 10,
              IsInfinity: false,
            },
          },
        },
        state: { user: { id: 7 } },
      });

      await postCommentController.create(ctx);

      expect(mockStrapi.entityService.create).toHaveBeenCalledWith(
        "api::post-comment.post-comment",
        expect.objectContaining({
          data: expect.objectContaining({
            Status: "Approved",
            IsInfinity: true,
          }),
        }),
      );
    });

    it("stores false for ordinary users even when the client sends true", async () => {
      mockStrapi.entityService.findOne.mockResolvedValue({ id: 10 });
      mockFetchUserWithRole.mockResolvedValue({
        id: 8,
        role: { name: "Customer" },
      });
      mockRoleIsAllowed.mockReturnValue(false);
      mockStrapi.entityService.create.mockResolvedValue({ id: 23 });

      const ctx = createCtx({
        request: {
          body: {
            data: {
              Content: "hello",
              post: 10,
              IsInfinity: true,
            },
          },
        },
        state: { user: { id: 8 } },
      });

      await postCommentController.create(ctx);

      expect(mockStrapi.entityService.create).toHaveBeenCalledWith(
        "api::post-comment.post-comment",
        expect.objectContaining({
          data: expect.objectContaining({
            Status: "Pending",
            IsInfinity: false,
          }),
        }),
      );
    });
  });

  describe("update", () => {
    it("does not let management updates change IsInfinity", async () => {
      mockStrapi.entityService.findOne.mockResolvedValue({
        id: 22,
        user: { id: 7 },
      });
      mockRoleIsAllowed.mockReturnValue(true);
      mockStrapi.entityService.update.mockResolvedValue({ id: 22 });

      const ctx = createCtx({
        params: { id: "22" },
        request: {
          body: {
            data: {
              Content: "updated",
              IsInfinity: false,
            },
          },
        },
        state: { user: { id: 7 } },
      });

      await postCommentController.update(ctx);

      expect(mockStrapi.entityService.update).toHaveBeenCalledWith(
        "api::post-comment.post-comment",
        "22",
        expect.objectContaining({
          data: { Content: "updated" },
        }),
      );
    });
  });
});
