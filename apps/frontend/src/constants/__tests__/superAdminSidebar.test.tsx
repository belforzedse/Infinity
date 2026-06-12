import superAdminSidebar, { getSidebarItemsForRole } from "@/constants/superAdminSidebar";
import { FOUNDER_HIDDEN_PARENT_IDS } from "@/constants/roleAccess";

describe("getSidebarItemsForRole - Founder", () => {
  const founderItems = getSidebarItemsForRole("Founder");
  const founderIds = founderItems.map((i) => i.id);

  it("hides the restricted parent sections", () => {
    for (const hidden of FOUNDER_HIDDEN_PARENT_IDS) {
      expect(founderIds).not.toContain(hidden);
    }
  });

  it("keeps operational sections (orders, products, carts, shipping)", () => {
    expect(founderIds).toEqual(
      expect.arrayContaining(["dashboard", "orders", "manage-products", "carts", "shipping"]),
    );
  });

  it("does not expose stories", () => {
    expect(founderIds).not.toContain("stories");
  });

  it("exposes a single sales-report item labelled «گزارشات فروش» pointing to product-sales", () => {
    const reports = founderItems.filter((i) => i.id === "reports");
    expect(reports).toHaveLength(1);
    expect(reports[0].label).toBe("گزارشات فروش");
    expect(reports[0].href).toBe("/super-admin/reports/product-sales");
    expect(reports[0].children).toHaveLength(0);
  });

  it("does NOT expose traffic or admin-activity reports anywhere", () => {
    const allHrefs = founderItems.flatMap((i) => [i.href ?? "", ...i.children.map((c) => c.href)]);
    expect(allHrefs).not.toContain("/super-admin/reports/traffic");
    expect(allHrefs).not.toContain("/super-admin/reports/admin-activity");
  });
});

describe("getSidebarItemsForRole - Store manager", () => {
  const storeManagerItems = getSidebarItemsForRole("Store manager");
  const storeManagerIds = storeManagerItems.map((i) => i.id);

  it("hides stories and FAQ", () => {
    expect(storeManagerIds).not.toContain("stories");
    expect(storeManagerIds).not.toContain("faq");
  });
});

describe("getSidebarItemsForRole - Superadmin regression", () => {
  it("returns the full sidebar unchanged", () => {
    const items = getSidebarItemsForRole("Superadmin");
    expect(items).toBe(superAdminSidebar);
    const ids = items.map((i) => i.id);
    // Restricted sections remain visible for superadmins.
    expect(ids).toEqual(
      expect.arrayContaining(["customization", "blog", "faq", "discounts", "users", "settings"]),
    );
  });

  it("keeps the full reports submenu (traffic, product-sales, admin-activity) for superadmins", () => {
    const items = getSidebarItemsForRole("Superadmin");
    const reports = items.find((i) => i.id === "reports");
    const childHrefs = reports?.children.map((c) => c.href) ?? [];
    expect(childHrefs).toEqual(
      expect.arrayContaining([
        "/super-admin/reports/traffic",
        "/super-admin/reports/product-sales",
        "/super-admin/reports/admin-activity",
      ]),
    );
  });
});
