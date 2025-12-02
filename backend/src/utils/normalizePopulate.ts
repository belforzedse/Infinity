type PopulateValue = Record<string, unknown> | string | string[] | (string | boolean)[] | boolean | undefined;

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

/**
 * Normalizes populate query values into a consistent format.
 *
 * Handles various input formats and converts them to a standardized PopulateValue:
 * - Arrays of strings/objects are merged or converted appropriately
 * - Wildcard values ("*" or true) are normalized to boolean true
 * - Objects are recursively normalized
 * - Primitives are preserved as-is
 *
 * @example
 * // Array of strings
 * normalizePopulateQuery(["posts", "comments"]) // returns ["posts", "comments"]
 *
 * @example
 * // Array of objects
 * normalizePopulateQuery([{ posts: true }, { comments: true }]) // returns { posts: true, comments: true }
 *
 * @example
 * // Wildcard
 * normalizePopulateQuery("*") // returns true
 *
 * @example
 * // Mixed array with wildcard
 * normalizePopulateQuery(["posts", "*", "comments"]) // returns true (wildcard takes precedence)
 *
 * @example
 * // Nested object
 * normalizePopulateQuery({ posts: { populate: { author: true } } }) // returns normalized object
 *
 * @param value - The populate value to normalize (can be string, array, object, boolean, or "*")
 * @returns The normalized populate value conforming to PopulateValue type
 */
export const normalizePopulateQuery = (value: unknown): PopulateValue => {
  if (Array.isArray(value)) {
    const normalizedEntries = value
      .map((entry) => normalizePopulateQuery(entry))
      .filter((entry) => entry !== undefined);

    if (normalizedEntries.length === 0) {
      return undefined;
    }

    let mergedObject: Record<string, unknown> | undefined;
    let hasWildcard = false;
    const primitiveEntries: Array<string | number | boolean> = [];

    for (const entry of normalizedEntries) {
      if (entry === true || entry === "*") {
        hasWildcard = true;
        continue;
      }

      if (entry && typeof entry === "object" && !Array.isArray(entry)) {
        mergedObject = mergedObject
          ? mergePopulateObjects(mergedObject, entry as Record<string, unknown>)
          : (entry as Record<string, unknown>);
        continue;
      }

      if (typeof entry === "string" || typeof entry === "number" || typeof entry === "boolean") {
        primitiveEntries.push(entry);
      }
    }

    if (mergedObject) {
      return mergedObject;
    }

    if (hasWildcard) {
      return true;
    }

    if (primitiveEntries.length === normalizedEntries.length) {
      return primitiveEntries.map((entry) => (entry === "*" ? true : entry)) as (string | boolean)[];
    }

    return normalizedEntries[normalizedEntries.length - 1] as PopulateValue;
  }

  if (value === "*" || value === true) {
    return true;
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
