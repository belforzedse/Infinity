import serviceFactory, {
  COMMERCE_DELETE_TARGETS,
  COMMERCE_PURGE_CONFIRMATION,
} from "../services/commerce-maintenance";
import routeConfig from "../routes/commerce-maintenance";

const createKnexMock = (options?: {
  hasMediaTable?: boolean;
  mediaCount?: number;
  deletedMediaRows?: number;
  mediaFileIds?: number[];
  remainingMediaFileIds?: number[];
}) => {
  const del = jest.fn().mockResolvedValue(options?.deletedMediaRows ?? 0);
  const count = jest.fn().mockResolvedValue([{ count: options?.mediaCount ?? 0 }]);
  const select = jest.fn(async (columnName: string) => {
    const fileIds = options?.mediaFileIds ?? [];
    return fileIds.map((fileId) => ({ [columnName]: fileId }));
  });
  const remainingSelect = jest.fn(async (columnName: string) => {
    const fileIds = options?.remainingMediaFileIds ?? [];
    return fileIds.map((fileId) => ({ [columnName]: fileId }));
  });
  const whereNotIn = jest.fn(() => ({ select: remainingSelect }));
  const whereIn = jest.fn((columnName: string) => {
    if (columnName === "file_id" || columnName === "upload_file_id") {
      return { select: remainingSelect, whereNotIn };
    }

    return { del, count, select };
  });
  const knex: any = jest.fn(() => ({ whereIn }));
  knex.schema = {
    hasTable: jest.fn(async (tableName: string) =>
      tableName === "files_related_morphs" ? !!options?.hasMediaTable : false
    ),
    hasColumn: jest.fn(async (tableName: string, columnName: string) =>
      tableName === "files_related_morphs" && columnName === "file_id"
    ),
  };
  knex._calls = { del, count, select, remainingSelect, whereIn, whereNotIn };
  return knex;
};

const createServiceHarness = (options?: {
  hasMediaTable?: boolean;
  mediaCount?: number;
  deletedMediaRows?: number;
  mediaFileIds?: number[];
  remainingMediaFileIds?: number[];
}) => {
  const deleteOrder: string[] = [];
  const deleteMany = jest.fn(async () => ({ count: 1 }));
  const count = jest.fn(async () => 2);
  const uploadFindOne = jest.fn(async (fileId: number) => ({
    id: fileId,
    provider: "local",
    hash: `commerce-media-${fileId}`,
    ext: ".jpg",
  }));
  const uploadRemove = jest.fn(async () => ({}));
  const uploadService = {
    findOne: uploadFindOne,
    remove: uploadRemove,
  };
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
    plugin: jest.fn(() => ({
      service: jest.fn(() => uploadService),
    })),
  };

  const service = serviceFactory({ strapi });
  return {
    strapi,
    service,
    deleteOrder,
    deleteMany,
    count,
    connection,
    transaction,
    uploadFindOne,
    uploadRemove,
  };
};

describe("commerce-maintenance purge service", () => {
  it("dry-run counts targets and does not delete", async () => {
    const { service, transaction, deleteMany } = createServiceHarness({
      hasMediaTable: true,
      mediaCount: 3,
      mediaFileIds: [10, 11, 12],
      remainingMediaFileIds: [12],
    });

    const result = await service.purgeCommerceData({ dryRun: true });

    expect(result.dryRun).toBe(true);
    expect(result.summary["api::product.product"]).toBe(2);
    expect(result.mediaRelations).toEqual({
      relationRowsDeleted: 3,
      physicalFilesDeleted: 2,
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

  it("deletes only orphaned commerce upload files after relation cleanup", async () => {
    const { service, strapi, connection, uploadFindOne, uploadRemove } = createServiceHarness({
      hasMediaTable: true,
      deletedMediaRows: 5,
      mediaFileIds: [10, 11, 12],
      remainingMediaFileIds: [12],
    });

    const result = await service.purgeCommerceData({
      dryRun: false,
      confirmation: COMMERCE_PURGE_CONFIRMATION,
    });

    expect(result.mediaRelations).toEqual({
      relationRowsDeleted: 5,
      physicalFilesDeleted: 2,
    });
    expect(connection._calls.whereIn).toHaveBeenCalledWith(
      "related_type",
      COMMERCE_DELETE_TARGETS.map((target) => target.uid)
    );
    expect(uploadFindOne).toHaveBeenCalledTimes(2);
    expect(uploadFindOne).toHaveBeenCalledWith(10);
    expect(uploadFindOne).toHaveBeenCalledWith(11);
    expect(uploadRemove).toHaveBeenCalledTimes(2);
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
