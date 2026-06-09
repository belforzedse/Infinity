type PopulateObject = {
  [key: string]: boolean | PopulateObject;
};

/**
 * Builds a Strapi v4 `populate` query string using a single, flat list of
 * dot-notation paths (e.g. `populate[0]=CoverImage&populate[1]=product_variations`
 * `&populate[2]=product_variations.product_stock`).
 *
 * This mirrors the working PDP query shape. It intentionally avoids mixing
 * array-index entries (`populate[0]=...`) with object-syntax entries
 * (`populate[rel][populate][0]=...`): when `qs` parses a `populate` param that
 * contains both numeric indices and a string key, it coerces the whole value
 * into an object keyed by those indices, and Strapi then populates by the bogus
 * numeric keys — dropping every top-level relation. Keeping all entries as
 * numeric indices over dot-notation paths makes `qs` parse a clean string array.
 */
export function paramCreator(obj: PopulateObject): string {
  const parts: string[] = [];
  let index = 0;

  function walk(currentObj: PopulateObject, prefix: string): void {
    for (const key of Object.keys(currentObj)) {
      const value = currentObj[key];
      if (!value) continue; // skip false / null

      const path = prefix ? `${prefix}.${key}` : key;
      parts.push(`populate[${index}]=${path}`);
      index++;

      if (typeof value === "object") {
        walk(value as PopulateObject, path);
      }
    }
  }

  walk(obj, "");
  return parts.join("&");
}
