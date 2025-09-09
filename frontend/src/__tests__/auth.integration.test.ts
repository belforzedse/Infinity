import { apiClient } from "@/services";
import { handleAuthErrors } from "@/utils/auth";
import { HTTP_STATUS, ERROR_MESSAGES } from "@/constants/api";

describe('Authentication flows', () => {
  it("propagates unauthorized error", async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      status: HTTP_STATUS.UNAUTHORIZED,
      json: async () => ({}),
    });

    await expect(apiClient.get("/protected")).rejects.toEqual({
      message: ERROR_MESSAGES.DEFAULT,
      status: HTTP_STATUS.UNAUTHORIZED,
      errors: undefined,
    });
  });

});
