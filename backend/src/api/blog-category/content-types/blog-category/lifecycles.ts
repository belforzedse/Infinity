import { generateUnicodeSlug } from "../../../../utils/unicodeSlug";

/**
 * Ensures the record has a category slug by setting `Slug` from `Slug` or `Title`.
 *
 * If `data` is falsy or both `Slug` and `Title` are missing, the function does nothing.
 *
 * @param data - Object representing the record; its `Slug` property is set to a Unicode category slug derived from `Slug` if present, otherwise from `Title`
 */
function ensureSlug(data: Record<string, any>) {
  if (!data) return;

  const source = data.Slug || data.Title;
  if (!source) return;

  data.Slug = generateUnicodeSlug(source, "category");
}

export default {
  beforeCreate(event) {
    ensureSlug(event.params.data);
  },
  beforeUpdate(event) {
    ensureSlug(event.params.data);
  },
};