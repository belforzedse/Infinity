import {
  canSeeDashboardUserMetric,
  DASHBOARD_USER_ACTION_HREF,
  getDashboardQuickActionsForRole,
} from "@/constants/superAdminDashboard";

describe("superAdminDashboard role visibility", () => {
  it("hides the dashboard user metric and customers action for Founder", () => {
    expect(canSeeDashboardUserMetric("Founder")).toBe(false);
    expect(getDashboardQuickActionsForRole("Founder").map((action) => action.href)).not.toContain(
      DASHBOARD_USER_ACTION_HREF,
    );
  });

  it("keeps Store manager behavior unchanged", () => {
    expect(canSeeDashboardUserMetric("Store manager")).toBe(false);
    expect(
      getDashboardQuickActionsForRole("Store manager").map((action) => action.href),
    ).not.toContain(DASHBOARD_USER_ACTION_HREF);
  });

  it("keeps the dashboard user metric and customers action for Superadmin", () => {
    expect(canSeeDashboardUserMetric("Superadmin")).toBe(true);
    expect(getDashboardQuickActionsForRole("Superadmin").map((action) => action.href)).toContain(
      DASHBOARD_USER_ACTION_HREF,
    );
  });
});
