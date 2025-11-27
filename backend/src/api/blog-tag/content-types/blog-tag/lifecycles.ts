import { generateUnicodeSlug } from "../../../../utils/unicodeSlug";

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
