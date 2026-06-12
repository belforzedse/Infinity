import {
  canFounderAccessPath,
  isFounderRole,
  FOUNDER_HIDDEN_PARENT_IDS,
} from "@/constants/roleAccess";

describe("roleAccess - Founder rules", () => {
  describe("isFounderRole", () => {
    it.each(["Founder", "founder", " FOUNDER ", "founders" /* alias handled server-side */])(
      "recognizes %p as Founder when normalized",
      (value) => {
        // Only exact 'founder' (case/space-insensitive) is treated as Founder on the client.
        const expected = value.trim().toLowerCase() === "founder";
        expect(isFounderRole(value)).toBe(expected);
      },
    );

    it("returns false for other roles and nullish", () => {
      expect(isFounderRole("Superadmin")).toBe(false);
      expect(isFounderRole("Store manager")).toBe(false);
      expect(isFounderRole(null)).toBe(false);
      expect(isFounderRole(undefined)).toBe(false);
    });
  });

  describe("canFounderAccessPath", () => {
    it("blocks restricted sections", () => {
      const blocked = [
        "/super-admin/customization",
        "/super-admin/customization/visual-identity",
        "/super-admin/blog",
        "/super-admin/blog/posts",
        "/super-admin/faq/questions",
        "/super-admin/stories",
        "/super-admin/stories/add",
        "/super-admin/settings",
        "/super-admin/settings/general",
        "/super-admin/coupons",
        "/super-admin/general-discounts",
        "/super-admin/users",
        "/super-admin/users/edit/5",
        "/super-admin/reports/traffic",
        "/super-admin/reports/admin-activity",
        "/super-admin/reports/admin-activity/12",
      ];
      for (const path of blocked) {
        expect(canFounderAccessPath(path)).toBe(false);
      }
    });

    it("allows operational sections and the sales report", () => {
      const allowed = [
        "/super-admin",
        "/super-admin/orders",
        "/super-admin/orders/edit/99",
        "/super-admin/products",
        "/super-admin/carts",
        "/super-admin/shipping",
        "/super-admin/reports/product-sales",
      ];
      for (const path of allowed) {
        expect(canFounderAccessPath(path)).toBe(true);
      }
    });

    it("does not treat a prefix collision as a match", () => {
      // '/super-admin/users-something' should not be blocked by the '/super-admin/users' rule.
      expect(canFounderAccessPath("/super-admin/users-export")).toBe(true);
    });
  });

  it("hides the expected sidebar parents", () => {
    expect([...FOUNDER_HIDDEN_PARENT_IDS].sort()).toEqual(
      ["blog", "customization", "discounts", "faq", "settings", "stories", "users"].sort(),
    );
  });
});
