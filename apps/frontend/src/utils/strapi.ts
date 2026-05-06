export const unwrapEntity = (entity?: any): Record<string, any> | undefined => {
  if (!entity) return undefined;
  if (entity.data && !Array.isArray(entity.data)) {
    return unwrapEntity(entity.data);
  }
  if (entity.attributes) {
    return { id: entity.id, ...entity.attributes };
  }
  return entity;
};

export const unwrapCollection = (collection?: any) => {
  if (!collection) return [];
  if (Array.isArray(collection)) return collection;
  if (Array.isArray(collection.data)) return collection.data;
  return [];
};
