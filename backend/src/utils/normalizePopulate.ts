type PopulateValue = Record<string, unknown> | string | string[] | undefined;

const mergePopulateObjects = (target: Record<string, unknown>, source: Record<string, unknown>) => {
  const merged: Record<string, unknown> = { ...target };

  for (const [key, value] of Object.entries(source)) {
    const existing = merged[key];

    if (
      existing &&
      typeof existing === "object" &&
      !Array.isArray(existing) &&
      value &&
      typeof value === "object" &&
      !Array.isArray(value)
    ) {
      merged[key] = mergePopulateObjects(existing as Record<string, unknown>, value as Record<string, unknown>);
    } else {
      merged[key] = value;
    }
  }

  return merged;
};

export const normalizePopulateQuery = (value: unknown): PopulateValue => {
  if (Array.isArray(value)) {
    const normalizedEntries = value
      .map((entry) => normalizePopulateQuery(entry))
      .filter((entry) => entry !== undefined);

    if (normalizedEntries.length === 0) {
      return undefined;
    }

    const hasOnlyPrimitives = normalizedEntries.every(
      (entry) => typeof entry === "string" || typeof entry === "number" || typeof entry === "boolean"
    );

    if (hasOnlyPrimitives) {
      return normalizedEntries as string[];
    }

    let mergedObject: Record<string, unknown> | undefined;
    let hasWildcard = false;

    for (const entry of normalizedEntries) {
      if (entry === "*") {
        hasWildcard = true;
        continue;
      }

      if (entry && typeof entry === "object" && !Array.isArray(entry)) {
        mergedObject = mergedObject
          ? mergePopulateObjects(mergedObject, entry as Record<string, unknown>)
          : (entry as Record<string, unknown>);
      }
    }

    if (mergedObject) {
      return mergedObject;
    }

    if (hasWildcard) {
      return "*";
    }

    return normalizedEntries[normalizedEntries.length - 1] as PopulateValue;
  }

  if (value === true) {
    return "*";
  }

  if (value && typeof value === "object") {
    const normalizedObject: Record<string, PopulateValue> = {};

    for (const [key, nestedValue] of Object.entries(value)) {
      normalizedObject[key] = normalizePopulateQuery(nestedValue);
    }

    return normalizedObject;
  }

  return value as PopulateValue;
};
