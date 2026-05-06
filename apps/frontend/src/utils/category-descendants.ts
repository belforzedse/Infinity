/**
 * Utilities for resolving a category and all its descendant slugs.
 * Used by PLP so that filtering by a category (e.g. "کت") shows products
 * in that category and in any child categories.
 */

export interface CategoryWithParent {
  id: number;
  slug: string;
  parentId: number | null;
}

/**
 * Given a flat list of categories (with id, slug, parentId) and a category slug,
 * returns an array of slugs: the category itself plus all its descendants (children,
 * grandchildren, etc.). Order is the given slug first, then descendants in no
 * particular order.
 *
 * If the slug is not found, returns an empty array.
 */
export function getCategoryAndDescendantSlugs(
  categories: CategoryWithParent[],
  slug: string,
): string[] {
  if (!slug || !categories.length) return [];

  const byId = new Map<number | null, CategoryWithParent[]>();
  const bySlug = new Map<string, CategoryWithParent>();

  for (const c of categories) {
    if (!c.slug) continue;
    bySlug.set(c.slug, c);
    const pid = c.parentId ?? null;
    if (!byId.has(pid)) byId.set(pid, []);
    byId.get(pid)!.push(c);
  }

  const node = bySlug.get(slug);
  if (!node) return [];

  const result: string[] = [node.slug];
  const queue: number[] = [node.id];

  while (queue.length > 0) {
    const id = queue.shift()!;
    const children = byId.get(id) ?? [];
    for (const child of children) {
      result.push(child.slug);
      queue.push(child.id);
    }
  }

  return result;
}
