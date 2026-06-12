import { logAdminOrderCreate, logAdminOrderFieldUpdate } from "../adminActivity";

/**
 * Unit tests for the order-edit admin activity helper. `logAdminOrderFieldUpdate` delegates to the
 * gated writer `recordAdminAudit`, which creates a `manual-admin-activity` row only when the actor is
 * a verified management role. We pass an explicit `adminRole` so no DB role lookup is needed.
 */
describe("logAdminOrderFieldUpdate", () => {
  const createStrapiMock = () => ({
    log: { error: jest.fn(), warn: jest.fn(), info: jest.fn() },
    entityService: {
      create: jest.fn().mockResolvedValue({ id: 1 }),
    },
    // `recordAdminAudit` resolves the actor's display name via `fetchUserWithRole` when no name is
    // supplied; this mock stands in for that lookup.
    query: jest.fn(() => ({
      findOne: jest.fn().mockResolvedValue({ id: 7, username: "admin-user" }),
    })),
  });

  it("records a StatusChange action when the order status changed", async () => {
    const strapi = createStrapiMock();
    const changes = { Status: { from: "Paying", to: "Started" } };

    const result = await logAdminOrderFieldUpdate(
      strapi as any,
      42,
      changes,
      7,
      "1.2.3.4",
      "jest-agent",
      "Superadmin",
    );

    expect(result).toBe(true);
    expect(strapi.entityService.create).toHaveBeenCalledTimes(1);
    const [uid, payload] = strapi.entityService.create.mock.calls[0];
    expect(uid).toBe("api::manual-admin-activity.manual-admin-activity");
    expect(payload.data.ResourceType).toBe("Order");
    expect(payload.data.ResourceId).toBe("42");
    expect(payload.data.Action).toBe("StatusChange");
    expect(payload.data.Changes).toEqual(changes);
    expect(payload.data.performed_by).toBe(7);
    expect(payload.data.PerformedByRole).toBe("Superadmin");
    expect(payload.data.IP).toBe("1.2.3.4");
    expect(payload.data.UserAgent).toBe("jest-agent");
  });

  it("records a plain Update action when only non-status fields changed", async () => {
    const strapi = createStrapiMock();
    const changes = { Note: { from: "", to: "ارسال فوری" } };

    await logAdminOrderFieldUpdate(strapi as any, 99, changes, 3, null, null, "Store manager");

    expect(strapi.entityService.create).toHaveBeenCalledTimes(1);
    const payload = strapi.entityService.create.mock.calls[0][1];
    expect(payload.data.Action).toBe("Update");
    expect(payload.data.Changes).toEqual(changes);
  });

  it("does nothing when there are no changes", async () => {
    const strapi = createStrapiMock();

    const result = await logAdminOrderFieldUpdate(strapi as any, 5, {}, 1, null, null, "Superadmin");

    expect(result).toBe(false);
    expect(strapi.entityService.create).not.toHaveBeenCalled();
  });

  it("records a Create action for a manual order created by an admin", async () => {
    const strapi = createStrapiMock();

    const result = await logAdminOrderCreate(
      strapi as any,
      77,
      7,
      { type: "Manual", status: "Started" },
      null,
      null,
      "Superadmin",
    );

    expect(result).toBe(true);
    expect(strapi.entityService.create).toHaveBeenCalledTimes(1);
    const payload = strapi.entityService.create.mock.calls[0][1];
    expect(payload.data.Action).toBe("Create");
    expect(payload.data.ResourceType).toBe("Order");
    expect(payload.data.ResourceId).toBe("77");
    expect(payload.data.Metadata).toEqual({ type: "Manual", status: "Started" });
  });

  it("does not record a manual order creation for a non-management actor", async () => {
    const strapi = createStrapiMock();

    const result = await logAdminOrderCreate(strapi as any, 77, 1001, {}, null, null, "Customer");

    expect(result).toBe(false);
    expect(strapi.entityService.create).not.toHaveBeenCalled();
  });

  it("does not record activity for a non-management actor", async () => {
    const strapi = createStrapiMock();
    const changes = { Status: { from: "Paying", to: "Started" } };

    const result = await logAdminOrderFieldUpdate(
      strapi as any,
      42,
      changes,
      1001,
      null,
      null,
      "Customer",
    );

    expect(result).toBe(false);
    expect(strapi.entityService.create).not.toHaveBeenCalled();
  });
});
