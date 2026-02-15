import { useState, useEffect } from "react";
import { CHECKOUT_REQUEST_TIMEOUT_MS } from "@/constants/api";

export interface NavigationItem {
  id: number;
  title: string;
  slug: string;
}

export interface NavigationResponse {
  data: {
    id: number;
    attributes: {
      createdAt: string;
      updatedAt: string;
      product_categories: {
        data: Array<{
          id: number;
          attributes: {
            Title: string;
            Slug: string;
            createdAt: string;
            updatedAt: string;
          };
        }>;
      };
    };
  };
  meta: Record<string, unknown>;
}

export interface UseNavigationResult {
  navigation: NavigationItem[];
  loading: boolean;
  error: Error | null;
}

export function useNavigation(triggerFetch: boolean = true): UseNavigationResult {
  const [navigation, setNavigation] = useState<NavigationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!triggerFetch) return;
    let mounted = true;
    const controller = new AbortController();
    const timeoutId = window.setTimeout(() => controller.abort(), CHECKOUT_REQUEST_TIMEOUT_MS);

    const fetchNavigation = async () => {
      try {
        if (mounted) setLoading(true);
        const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL;
        if (!apiBase) {
          throw new Error("NEXT_PUBLIC_API_BASE_URL is not defined");
        }
        const response = await fetch(`${apiBase}/navigation?populate=*&_skip_global_loader=1`, {
          cache: "no-store",
          signal: controller.signal,
          headers: { Accept: "application/json" },
        });

        if (!response.ok) {
          throw new Error(`Failed to fetch navigation: ${response.status}`);
        }

        const data: NavigationResponse = await response.json();
        if (!mounted) return;

        if (data.data?.attributes?.product_categories?.data) {
          const items = data.data.attributes.product_categories.data.map((category) => ({
            id: category.id,
            title: category.attributes.Title,
            slug: category.attributes.Slug,
          }));

          setNavigation(items);
        } else {
          setNavigation([]);
        }
        setError(null);
      } catch (err) {
        if (!mounted) return;
        if (err instanceof Error && err.name === "AbortError") {
          setError(null);
          setNavigation([]);
          return;
        }
        setError(err instanceof Error ? err : new Error("An unknown error occurred"));
        console.error("Error fetching navigation:", err);
      } finally {
        if (mounted) setLoading(false);
        window.clearTimeout(timeoutId);
      }
    };

    fetchNavigation();
    return () => {
      mounted = false;
      window.clearTimeout(timeoutId);
      controller.abort();
    };
  }, [triggerFetch]);

  return { navigation, loading, error };
}
