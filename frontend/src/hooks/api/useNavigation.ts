import { useState, useEffect } from "react";

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

export function useNavigation(
  triggerFetch: boolean = true
): UseNavigationResult {
  const [navigation, setNavigation] = useState<NavigationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!triggerFetch) return;

    const fetchNavigation = async () => {
      try {
        setLoading(true);
        const response = await fetch(
          "https://infinity-bck.darkube.app/api/navigation?populate=*"
        );

        if (!response.ok) {
          throw new Error(`Failed to fetch navigation: ${response.status}`);
        }

        const data: NavigationResponse = await response.json();

        if (data.data?.attributes?.product_categories?.data) {
          const items = data.data.attributes.product_categories.data.map(
            (category) => ({
              id: category.id,
              title: category.attributes.Title,
              slug: category.attributes.Slug,
            })
          );

          setNavigation(items);
        } else {
          setNavigation([]);
        }
        setError(null);
      } catch (err) {
        setError(
          err instanceof Error ? err : new Error("An unknown error occurred")
        );
        console.error("Error fetching navigation:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchNavigation();
  }, [triggerFetch]);

  return { navigation, loading, error };
}
