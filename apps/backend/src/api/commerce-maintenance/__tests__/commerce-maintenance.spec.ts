import serviceFactory, {
  COMMERCE_DELETE_TARGETS,
  COMMERCE_PURGE_CONFIRMATION,
} from "../services/commerce-maintenance";
import routeConfig from "../routes/commerce-maintenance";

const createKnexMock = (options?: { hasMediaTable?: boolean; mediaCount?: number; deletedMediaRows?: number }) => {
  const del = jest.fn().mockResolvedValue(options?.deletedMediaRows ?? 0);
  const count = jest.fn().mockResolvedValue([{ count: options?.mediaCount ?? 0 }]);
  const whereIn = jest.fn(() => ({ del, count }));
  const knex: any = jest.fn(() => ({ whereIn }));
  knex.schema = {
    hasTable: jest.fn(async (tableName: string) =>
      tableName === "files_related_morphs" ? !!options?.hasMediaTable : false
    ),
  };
  knex._calls = { del, count, whereIn };
  return knex;
};

const createServiceHarness = (options?: { hasMediaTable?: boolean; mediaCount?: number; deletedMediaRows?: number }) => {
  const deleteOrder: string[] = [];
  const deleteMany = jest.fn(async () => ({ count: 1 }));
  const count = jest.fn(async () => 2);
  const query = jest.fn((uid: string) => ({
    count,
    deleteMany: jest.fn(async (...args: any[]) => {
      deleteOrder.push(uid);
      return (deleteMany as jest.Mock)(args[0]);
    }),
  }));
  const connection = createKnexMock(options);
  const transaction = jest.fn(async (callback) => callback({ trx: connection }));
  const strapi: any = {
    db: {
      query,
      connection,
      transaction,
    },
    log: {
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
    },
    entityService: {
      create: jest.fn(),
      findOne: jest.fn(),
    },
  };

  const service = serviceFactory({ strapi });
  return { strapi, service, deleteOrder, deleteMany, count, connection, transaction };
};

describe("commerce-maintenance purge service", () => {
  it("dry-run counts targets and does not delete", async () => {
    const { service, transaction, deleteMany } = createServiceHarness({
      hasMediaTable: true,
      mediaCount: 3,
    });

    const result = await service.purgeCommerceData({ dryRun: true });

    expect(result.dryRun).toBe(true);
    expect(result.summary["api::product.product"]).toBe(2);
    expect(result.mediaRelations).toEqual({
      relationRowsDeleted: 3,
      physicalFilesDeleted: 0,
    });
    expect(transaction).not.toHaveBeenCalled();
    expect(deleteMany).not.toHaveBeenCalled();
  });

  it("rejects real deletion without the exact confirmation string", async () => {
    const { service, transaction } = createServiceHarness();

    await expect(
      service.purgeCommerceData({ dryRun: false, confirmation: "wrong" })
    ).rejects.toMatchObject({ code: "INVALID_CONFIRMATION" });
    expect(transaction).not.toHaveBeenCalled();
  });

  it("deletes inside a transaction in dependency-safe order", async () => {
    const { service, transaction, deleteOrder } = createServiceHarness();

    const result = await service.purgeCommerceData({
      dryRun: false,
      confirmation: COMMERCE_PURGE_CONFIRMATION,
      performedBy: { id: 1, role: "Superadmin" },
    });

    expect(transaction).toHaveBeenCalledTimes(1);
    expect(deleteOrder).toEqual(COMMERCE_DELETE_TARGETS.map((target) => target.uid));
    expect(result.dryRun).toBe(false);
    expect(result.summary["api::order.order"]).toBe(1);
  });

  it("cleans only media relation rows and never invokes upload file deletion", async () => {
    const { service, strapi, connection } = createServiceHarness({
      hasMediaTable: true,
      deletedMediaRows: 5,
    });
    strapi.plugin = jest.fn();

    const result = await service.purgeCommerceData({
      dryRun: false,
      confirmation: COMMERCE_PURGE_CONFIRMATION,
    });

    expect(result.mediaRelations).toEqual({
      relationRowsDeleted: 5,
      physicalFilesDeleted: 0,
    });
    expect(connection._calls.whereIn).toHaveBeenCalledWith(
      "related_type",
      COMMERCE_DELETE_TARGETS.map((target) => target.uid)
    );
    expect(strapi.plugin).not.toHaveBeenCalled();
  });
});

describe("commerce-maintenance route", () => {
  it("uses users-permissions authentication middleware and Superadmin policy", () => {
    const route = routeConfig.routes.find(
      (entry) => entry.path === "/admin/commerce-data/purge"
    );

    expect(route).toBeDefined();
    expect(route?.method).toBe("POST");
    expect(route?.config.middlewares).toContain("global::authentication");
    expect(route?.config.policies).toEqual([
      {
        name: "global::role-based",
        config: { roles: ["Superadmin"] },
      },
    ]);
  });
});
