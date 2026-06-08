import { uploadFile } from "../upload";

const imageCompression = jest.fn();

jest.mock("browser-image-compression", () => ({
  __esModule: true,
  default: (...args: unknown[]) => imageCompression(...args),
}));

jest.mock("@/utils/auth", () => ({
  getAccessToken: () => "token",
}));

describe("uploadFile", () => {
  const originalFetch = global.fetch;
  const originalFormData = global.FormData;

  beforeEach(() => {
    imageCompression.mockReset();
    const appended: Array<{ name: string; value: File }> = [];

    class MockFormData {
      append(name: string, value: File) {
        appended.push({ name, value });
      }
    }

    (global as any).__appendedFormData = appended;
    global.FormData = MockFormData as any;
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => [{ url: "/uploads/campaign.gif", formats: {} }],
    }) as any;
  });

  afterEach(() => {
    global.fetch = originalFetch;
    global.FormData = originalFormData;
    delete (global as any).__appendedFormData;
  });

  it("uploads GIF files unchanged instead of converting them to WebP", async () => {
    const gif = new File(["gif-bytes"], "campaign.gif", { type: "image/gif" });

    await uploadFile(gif);

    expect(imageCompression).not.toHaveBeenCalled();
    expect((global as any).__appendedFormData).toEqual([{ name: "files", value: gif }]);
  });
});
