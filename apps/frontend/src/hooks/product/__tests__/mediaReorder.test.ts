import {
  reorderArrayWithGuards,
  reorderImageMediaPreservingSlots,
  shouldReorderUntypedMediaAsImages,
} from "../mediaReorder";

type MediaItem = {
  id: string;
  attributes: {
    mime: string;
  };
};

describe("mediaReorder helpers", () => {
  it("reorders a plain array when indices are valid", () => {
    const items = ["a", "b", "c"];
    const result = reorderArrayWithGuards(items, 0, 2);

    expect(result).toEqual(["b", "c", "a"]);
  });

  it("keeps media video slots fixed while reordering only images", () => {
    const media: MediaItem[] = [
      { id: "img-1", attributes: { mime: "image/jpeg" } },
      { id: "vid-1", attributes: { mime: "video/mp4" } },
      { id: "img-2", attributes: { mime: "image/png" } },
      { id: "vid-2", attributes: { mime: "video/webm" } },
      { id: "img-3", attributes: { mime: "image/webp" } },
    ];

    const result = reorderImageMediaPreservingSlots(media, 0, 2);

    expect(result.map((item) => item.id)).toEqual(["img-2", "vid-1", "img-3", "vid-2", "img-1"]);
  });

  it("returns the same reference for invalid image indices", () => {
    const media: MediaItem[] = [
      { id: "img-1", attributes: { mime: "image/jpeg" } },
      { id: "img-2", attributes: { mime: "image/png" } },
    ];

    const result = reorderImageMediaPreservingSlots(media, -1, 1);

    expect(result).toBe(media);
  });

  it("detects when untyped media can be reordered as images", () => {
    expect(
      shouldReorderUntypedMediaAsImages({
        mediaLength: 4,
        imageCount: 4,
        videoCount: 0,
      }),
    ).toBe(true);

    expect(
      shouldReorderUntypedMediaAsImages({
        mediaLength: 4,
        imageCount: 3,
        videoCount: 1,
      }),
    ).toBe(false);
  });
});
