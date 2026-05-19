type StoryMediaType = "image" | "video";

type UploadFile = {
  id: number;
  mime?: string | null;
  name?: string | null;
  url?: string | null;
};

class StoryMediaValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "StoryMediaValidationError";
  }
}

function extractRelationId(value: unknown): number | null | undefined {
  if (value === null) return null;
  if (value === undefined) return undefined;
  if (typeof value === "number") return value;
  if (typeof value === "string" && value.trim()) {
    const parsed = Number(value);
    return Number.isNaN(parsed) ? undefined : parsed;
  }
  if (Array.isArray(value)) {
    if (value.length === 0) return null;
    return extractRelationId(value[0]);
  }
  if (typeof value !== "object") return undefined;

  const relation = value as {
    id?: number | string;
    connect?: unknown[];
    set?: unknown[];
    disconnect?: unknown[];
  };

  if (relation.id !== undefined) return extractRelationId(relation.id);
  if (Array.isArray(relation.connect) && relation.connect.length > 0) {
    return extractRelationId(relation.connect[0]);
  }
  if (Array.isArray(relation.set)) {
    if (relation.set.length === 0) return null;
    return extractRelationId(relation.set[0]);
  }
  if (Array.isArray(relation.disconnect)) return null;

  return undefined;
}

function assertMediaMatchesType(mediaType?: StoryMediaType, media?: UploadFile | null) {
  if (!mediaType || !media) return;

  const mime = media.mime ?? "";
  if (mediaType === "video" && !mime.startsWith("video/")) {
    throw new StoryMediaValidationError(
      `Story MediaType is video, but Media "${media.name ?? media.url ?? media.id}" is ${mime || "missing a MIME type"}. Select a video file for Media, and use Thumbnail for the image preview.`,
    );
  }

  if (mediaType === "image" && !mime.startsWith("image/")) {
    throw new StoryMediaValidationError(
      `Story MediaType is image, but Media "${media.name ?? media.url ?? media.id}" is ${mime || "missing a MIME type"}. Select an image file for Media.`,
    );
  }
}

async function getUploadFile(id: number): Promise<UploadFile | null> {
  return (await strapi.entityService.findOne("plugin::upload.file", id, {
    fields: ["id", "mime", "name", "url"],
  })) as UploadFile | null;
}

async function validateStoryMedia(event: any) {
  const data = event.params?.data ?? {};
  let mediaType = data.MediaType as StoryMediaType | undefined;
  let mediaId = extractRelationId(data.Media);

  if (mediaType === undefined || mediaId === undefined) {
    const storyId = event.params?.where?.id;
    if (storyId) {
      const existing = (await strapi.entityService.findOne("api::story.story", storyId, {
        fields: ["id", "MediaType"],
        populate: { Media: { fields: ["id", "mime", "name", "url"] } },
      })) as { MediaType?: StoryMediaType; Media?: UploadFile | null } | null;

      mediaType = mediaType ?? existing?.MediaType;
      if (mediaId === undefined) {
        mediaId = existing?.Media?.id ?? null;
      }
    }
  }

  if (!mediaId) return;

  const media = await getUploadFile(mediaId);
  assertMediaMatchesType(mediaType, media);
}

export default {
  async beforeCreate(event: any) {
    await validateStoryMedia(event);
  },

  async beforeUpdate(event: any) {
    await validateStoryMedia(event);
  },
};
