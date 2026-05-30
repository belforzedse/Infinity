import { releaseOrderReservation } from "../../utils/stockReservations";
import { __resetBackgroundJobGuardsForTests } from "../backgroundJobRunner";
import { runExpireReserveOrdersTick } from "../expireReserveOrders";
import { runExpireStockReservationsTick } from "../expireStockReservations";

jest.mock("../../utils/stockReservations", () => ({
  releaseOrderReservation: jest.fn(),
}));

const mockedReleaseOrderReservation = releaseOrderReservation as jest.MockedFunction<
  typeof releaseOrderReservation
>;

function createMockStrapi() {
  const orderQuery = {
    findOne: jest.fn(),
    update: jest.fn(),
    create: jest.fn(),
  };
  const contractQuery = {
    update: jest.fn(),
  };
  const orderLogQuery = {
    create: jest.fn(),
  };

  const strapi = {
    log: {
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
      debug: jest.fn(),
    },
    entityService: {
      findMany: jest.fn(),
    },
    db: {
      connection: {
        raw: jest.fn(),
      },
      transaction: jest.fn(async (callback: any) => callback({ trx: { raw: jest.fn() } })),
      query: jest.fn((uid: string) => {
        if (uid === "api::order.order") return orderQuery;
        if (uid === "api::contract.contract") return contractQuery;
        if (uid === "api::order-log.order-log") return orderLogQuery;
        throw new Error(`Unexpected uid: ${uid}`);
      }),
    },
    metrics: {
      increment: jest.fn(),
    },
  } as any;

  return {
    strapi,
    orderQuery,
    contractQuery,
    orderLogQuery,
  };
}

describe("expiry jobs", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv, DATABASE_CLIENT: "sqlite" };
    jest.clearAllMocks();
    __resetBackgroundJobGuardsForTests();
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it("runs expireStockReservations without relying on global strapi", async () => {
    const previousGlobalStrapi = (global as any).strapi;
    delete (global as any).strapi;

    const { strapi, orderQuery, contractQuery, orderLogQuery } = createMockStrapi();
    const now = new Date("2026-05-30T12:00:00.000Z");
    strapi.entityService.findMany.mockResolvedValue([{ id: 10 }]);
    orderQuery.findOne.mockResolvedValue({ id: 10, contract: { id: 55 } });
    orderQuery.update.mockResolvedValue({ id: 10 });
    contractQuery.update.mockResolvedValue({ id: 55 });
    orderLogQuery.create.mockResolvedValue({ id: 1 });
    mockedReleaseOrderReservation.mockResolvedValue({ success: true });

    const result = await runExpireStockReservationsTick(strapi, {
      now,
      graceSeconds: 60,
      batchSize: 25,
    });

    expect(result.status).toBe("completed");
    expect(result.stats.processed).toBe(1);
    expect(strapi.entityService.findMany).toHaveBeenCalledWith(
      "api::order.order",
      expect.objectContaining({
        filters: expect.objectContaining({
          Status: "Paying",
          ReservationStatus: "Reserved",
        }),
        limit: 25,
      })
    );
    expect(mockedReleaseOrderReservation).toHaveBeenCalledWith(
      strapi,
      10,
      "Expired",
      expect.anything(),
      expect.objectContaining({
        requireOrderStatus: "Paying",
        expiresBefore: new Date("2026-05-30T11:59:00.000Z"),
      })
    );

    (global as any).strapi = previousGlobalStrapi;
  });

  it("does not cancel orders when the reservation transition is skipped", async () => {
    const { strapi, orderQuery, contractQuery } = createMockStrapi();
    strapi.entityService.findMany.mockResolvedValue([{ id: 11 }]);
    mockedReleaseOrderReservation.mockResolvedValue({ success: true, skipped: true });

    const result = await runExpireStockReservationsTick(strapi, {
      now: new Date("2026-05-30T12:00:00.000Z"),
      graceSeconds: 0,
    });

    expect(result.status).toBe("completed");
    expect(result.stats.skipped).toBe(1);
    expect(orderQuery.update).not.toHaveBeenCalled();
    expect(contractQuery.update).not.toHaveBeenCalled();
  });

  it("skips overlapping stock-expiry runs in the same process", async () => {
    const { strapi } = createMockStrapi();
    let resolveFindMany: (value: unknown[]) => void = () => undefined;
    strapi.entityService.findMany.mockImplementationOnce(
      () => new Promise((resolve) => {
        resolveFindMany = resolve;
      })
    );

    const first = runExpireStockReservationsTick(strapi, {
      now: new Date("2026-05-30T12:00:00.000Z"),
      graceSeconds: 0,
    });
    await Promise.resolve();

    const second = await runExpireStockReservationsTick(strapi, {
      now: new Date("2026-05-30T12:00:01.000Z"),
      graceSeconds: 0,
    });

    expect(second.status).toBe("skipped");
    expect(second.status === "skipped" ? second.skippedReason : undefined).toBe("in_process");

    resolveFindMany([]);
    await first;
  });

  it("skips work when another instance owns the distributed lock", async () => {
    process.env.DATABASE_CLIENT = "postgres";
    const { strapi } = createMockStrapi();
    strapi.db.connection.raw.mockResolvedValueOnce({ rows: [] });

    const result = await runExpireStockReservationsTick(strapi, {
      now: new Date("2026-05-30T12:00:00.000Z"),
      graceSeconds: 0,
    });

    expect(result.status).toBe("skipped");
    expect(result.status === "skipped" ? result.skippedReason : undefined).toBe("distributed_lock");
    expect(strapi.entityService.findMany).not.toHaveBeenCalled();
  });

  it("releases the in-process guard after DB errors", async () => {
    const { strapi } = createMockStrapi();
    strapi.entityService.findMany
      .mockRejectedValueOnce(new Error("db unavailable"))
      .mockResolvedValueOnce([]);

    const failed = await runExpireStockReservationsTick(strapi, {
      now: new Date("2026-05-30T12:00:00.000Z"),
      graceSeconds: 0,
    });
    const recovered = await runExpireStockReservationsTick(strapi, {
      now: new Date("2026-05-30T12:00:01.000Z"),
      graceSeconds: 0,
    });

    expect(failed.status).toBe("failed");
    expect(recovered.status).toBe("completed");
  });

  it("expires reserve-order groups with bounded bulk updates", async () => {
    const { strapi } = createMockStrapi();
    const now = new Date("2026-05-30T12:00:00.000Z");
    strapi.db.connection.raw
      .mockResolvedValueOnce({
        rows: [
          { reserveGroupId: "group-a", expiredOrderCount: 2 },
          { reserveGroupId: "group-b", expiredOrderCount: 1 },
        ],
      })
      .mockResolvedValueOnce({ rows: [{ id: 1 }, { id: 2 }] })
      .mockResolvedValueOnce({ rows: [{ id: 3 }] });

    const result = await runExpireReserveOrdersTick(strapi, {
      now,
      batchSize: 2,
    });

    expect(result.status).toBe("completed");
    expect(result.stats.groupsProcessed).toBe(2);
    expect(result.stats.ordersUpdated).toBe(3);
    expect(strapi.db.connection.raw).toHaveBeenNthCalledWith(
      1,
      expect.stringContaining("GROUP BY reserve_group_id"),
      [now, 2]
    );
  });

  it("skips reserve-order work when no expired groups exist", async () => {
    const { strapi } = createMockStrapi();
    strapi.db.connection.raw.mockResolvedValueOnce({ rows: [] });

    const result = await runExpireReserveOrdersTick(strapi, {
      now: new Date("2026-05-30T12:00:00.000Z"),
    });

    expect(result.status).toBe("completed");
    expect(result.stats.groupsFound).toBe(0);
    expect(strapi.db.connection.raw).toHaveBeenCalledTimes(1);
  });

  it("skips overlapping reserve-order runs in the same process", async () => {
    const { strapi } = createMockStrapi();
    let resolveRaw: (value: { rows: unknown[] }) => void = () => undefined;
    strapi.db.connection.raw.mockImplementationOnce(
      () => new Promise((resolve) => {
        resolveRaw = resolve;
      })
    );

    const first = runExpireReserveOrdersTick(strapi, {
      now: new Date("2026-05-30T12:00:00.000Z"),
    });
    await Promise.resolve();

    const second = await runExpireReserveOrdersTick(strapi, {
      now: new Date("2026-05-30T12:00:01.000Z"),
    });

    expect(second.status).toBe("skipped");
    expect(second.status === "skipped" ? second.skippedReason : undefined).toBe("in_process");

    resolveRaw({ rows: [] });
    await first;
  });
});
