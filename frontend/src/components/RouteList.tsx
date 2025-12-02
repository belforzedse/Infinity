"use client";

import Link from "next/link";
import type { RouteInfo } from "@/utils/routes";
import { useState } from "react";

/**
 * Displays a searchable list of application routes. Primarily used for
 * debugging and as a living documentation of available pages.
 */

interface RouteListProps {
  routes: RouteInfo[];
}

/** Grouping helper used to organize related routes in the UI. */
type RouteCategory = {
  name: string;
  paths: string[];
};

const categories: RouteCategory[] = [
  { name: "Super Admin", paths: ["/super-admin"] },
  { name: "Products", paths: ["/plp", "/pdp"] },
  { name: "Authentication", paths: ["/auth"] },
  {
    name: "User",
    paths: [
      "/account",
      "/addresses",
      "/favorites",
      "/orders",
      "/password",
      "/privileges",
      "/wallet",
    ],
  },
];

export const RouteList = ({ routes }: RouteListProps) => {
  // Local search state used to filter the rendered routes
  const [searchTerm, setSearchTerm] = useState("");

  // Returns all routes that fall under one of the provided category path
  // prefixes. Used to render grouped sections when no search term is active.
  const getRoutesByCategory = (categoryPaths: string[]) => {
    return routes.filter((route) => categoryPaths.some((path) => route.path.startsWith(path)));
  };

  // Routes matching the search term across name, path, or description fields
  const filteredRoutes = routes.filter(
    (route) =>
      route.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      route.path.toLowerCase().includes(searchTerm.toLowerCase()) ||
      route.description.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  return (
    <div className="mx-auto w-full max-w-6xl">
      <div className="mb-8">
        <input
          type="text"
          placeholder="Search routes..."
          className="w-full max-w-md rounded-lg border border-gray-200 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-800"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {searchTerm ? (
        // When searching, flatten all results into a single grid
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredRoutes.map((route) => (
            <RouteCard key={route.path} route={route} />
          ))}
        </div>
      ) : (
        // Otherwise, render routes grouped by their defined categories
        categories.map((category) => {
          const categoryRoutes = getRoutesByCategory(category.paths);
          if (categoryRoutes.length === 0) return null;

          return (
            <div key={category.name} className="mb-8">
              <h2 className="text-2xl mb-4 font-bold">{category.name}</h2>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                {categoryRoutes.map((route) => (
                  <RouteCard key={route.path} route={route} />
                ))}
              </div>
            </div>
          );
        })
      )}
    </div>
  );
};

const RouteCard = ({ route }: { route: RouteInfo }) => (
  <Link
    href={route.path}
    className="rounded-lg border border-gray-200 p-4 transition-colors hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800"
  >
    <div className="flex flex-col gap-2">
      <h3 className="text-lg font-semibold">{route.name}</h3>
      <p className="text-sm text-gray-600 dark:text-gray-400">{route.description}</p>
      <code className="text-xs rounded bg-gray-100 px-2 py-1 dark:bg-gray-900">{route.path}</code>
    </div>
  </Link>
);
