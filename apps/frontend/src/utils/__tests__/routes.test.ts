import { routes, getRoutes, type RouteInfo } from "../routes";

describe("routes", () => {
  it("should export an array of routes", () => {
    expect(Array.isArray(routes)).toBe(true);
    expect(routes.length).toBeGreaterThan(0);
  });

  it("should have valid route structure", () => {
    routes.forEach((route) => {
      expect(route).toHaveProperty("name");
      expect(route).toHaveProperty("path");
      expect(route).toHaveProperty("description");
      expect(typeof route.name).toBe("string");
      expect(typeof route.path).toBe("string");
      expect(typeof route.description).toBe("string");
      expect(route.name.length).toBeGreaterThan(0);
      expect(route.path.length).toBeGreaterThan(0);
    });
  });

  it("should include home route", () => {
    const homeRoute = routes.find((r) => r.path === "/");
    expect(homeRoute).toBeDefined();
    expect(homeRoute?.name).toBe("Home");
  });

  it("should include super admin routes", () => {
    const superAdminRoutes = routes.filter((r) =>
      r.path.startsWith("/super-admin"),
    );
    expect(superAdminRoutes.length).toBeGreaterThan(0);

    const adminDashboard = routes.find((r) => r.path === "/super-admin");
    expect(adminDashboard).toBeDefined();
  });

  it("should include auth routes", () => {
    const authRoutes = routes.filter((r) => r.path.startsWith("/auth"));
    expect(authRoutes.length).toBeGreaterThan(0);

    const authPage = routes.find((r) => r.path === "/auth");
    expect(authPage).toBeDefined();
  });

  it("should include product routes", () => {
    const plpRoute = routes.find((r) => r.path === "/plp");
    expect(plpRoute).toBeDefined();
    expect(plpRoute?.description).toContain("Product Listing");

    const pdpRoute = routes.find((r) => r.path === "/pdp/1");
    expect(pdpRoute).toBeDefined();
  });

  it("should include user routes", () => {
    const userRoutes = ["/account", "/addresses", "/favorites", "/orders", "/wallet"];
    userRoutes.forEach((path) => {
      const route = routes.find((r) => r.path === path);
      expect(route).toBeDefined();
    });
  });

  it("should not have duplicate paths", () => {
    const paths = routes.map((r) => r.path);
    const uniquePaths = new Set(paths);
    expect(paths.length).toBe(uniquePaths.size);
  });

  it("should have valid path format", () => {
    routes.forEach((route) => {
      expect(route.path).toMatch(/^\/[\w\-\/]*(\[\w+\])?$/);
    });
  });
});

describe("getRoutes", () => {
  it("should return the routes array", () => {
    const result = getRoutes();
    expect(result).toBe(routes);
    expect(Array.isArray(result)).toBe(true);
  });

  it("should return the same reference each time", () => {
    const result1 = getRoutes();
    const result2 = getRoutes();
    expect(result1).toBe(result2);
  });
});
