import { generateUnicodeSlug } from "../../../../utils/unicodeSlug";

/**
 * Ensures the provided content data has a populated `Slug` by generating one from `Slug` or `Name`.
 *
 * If `data` is falsy or neither `Slug` nor `Name` is present, the function does nothing. Otherwise it
 * sets `data.Slug` to a generated Unicode slug for a tag.
 *
 * @param data - The content entry data object to modify (mutated in place)
 */
function ensureSlug(data: Record<string, any>) {
  if (!data) return;

  const source = data.Slug || data.Name;
  if (!source) return;

  data.Slug = generateUnicodeSlug(source, "tag");
}

export default {
  beforeCreate(event) {
    ensureSlug(event.params.data);
  },
  beforeUpdate(event) {
    ensureSlug(event.params.data);
  },
};