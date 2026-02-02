const extractParentId = (parent: any): number | null | undefined => {
  if (parent === null) return null;
  if (parent === undefined) return undefined;

  if (typeof parent === "number") return parent;
  if (typeof parent === "string" && parent.trim()) {
    const parsed = Number(parent);
    return Number.isNaN(parsed) ? undefined : parsed;
  }

  if (Array.isArray(parent)) {
    if (parent.length === 0) return null;
    const entry = parent[0];
    if (typeof entry === "number") return entry;
    if (typeof entry === "string" && entry.trim()) {
      const parsed = Number(entry);
      return Number.isNaN(parsed) ? undefined : parsed;
    }
    if (entry && typeof entry === "object" && "id" in entry) {
      const parsed = Number((entry as { id?: number | string }).id);
      return Number.isNaN(parsed) ? undefined : parsed;
    }
  }

  if (typeof parent === "object") {
    if (Array.isArray(parent.connect) && parent.connect.length > 0) {
      const entry = parent.connect[0];
      const value = typeof entry === "object" ? entry.id : entry;
      const parsed = Number(value);
      return Number.isNaN(parsed) ? undefined : parsed;
    }
    if (Array.isArray(parent.set)) {
      if (parent.set.length === 0) return null;
      const entry = parent.set[0];
      const value = typeof entry === "object" ? entry.id : entry;
      const parsed = Number(value);
      return Number.isNaN(parsed) ? undefined : parsed;
    }
    if (Array.isArray(parent.disconnect)) return null;
  }

  return undefined;
};

const stripParentOnlyFields = (data: Record<string, any>) => {
  data.Image = null;
  data.Color = null;
};

export default {
  async beforeCreate(event) {
    const data = event.params?.data ?? {};
    const parentId = extractParentId(data.parent);
    if (parentId) {
      stripParentOnlyFields(data);
    }
  },

  async beforeUpdate(event) {
    const data = event.params?.data ?? {};
    let parentId = extractParentId(data.parent);

    if (parentId === undefined) {
      const id = (event.params as any)?.where?.id;
      if (id) {
        const existing = (await strapi.entityService.findOne(
          "api::product-category.product-category",
          id,
          { fields: ["id"], populate: { parent: { fields: ["id"] } } },
        )) as { id: number; parent?: { id: number } | null } | null;
        parentId = existing?.parent?.id ?? null;
      }
    }

    if (parentId) {
      stripParentOnlyFields(data);
    }
  },
};
