import notify from "../notify";
import { toast } from "react-hot-toast";

jest.mock("react-hot-toast");

describe("notify", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should call toast.success with default options", () => {
    notify.success("Success message");

    expect(toast.success).toHaveBeenCalledWith("Success message", {
      duration: 4000,
      style: {
        background: "#333",
        color: "#fff",
        fontSize: "14px",
        borderRadius: "8px",
      },
    });
  });

  it("should call toast.error with default options", () => {
    notify.error("Error message");

    expect(toast.error).toHaveBeenCalledWith("Error message", {
      duration: 4000,
      style: {
        background: "#333",
        color: "#fff",
        fontSize: "14px",
        borderRadius: "8px",
      },
    });
  });

  it("should call toast with default options for info", () => {
    notify.info("Info message");

    expect(toast).toHaveBeenCalledWith("Info message", {
      duration: 4000,
      style: {
        background: "#333",
        color: "#fff",
        fontSize: "14px",
        borderRadius: "8px",
      },
    });
  });

  it("should merge custom options for success", () => {
    notify.success("Success", { duration: 2000 });

    expect(toast.success).toHaveBeenCalledWith("Success", expect.objectContaining({
      duration: 2000,
      style: expect.any(Object),
    }));
  });

  it("should merge custom options for error", () => {
    notify.error("Error", { position: "top-right" });

    expect(toast.error).toHaveBeenCalledWith("Error", expect.objectContaining({
      position: "top-right",
      duration: 4000,
    }));
  });

  it("should merge custom options for info", () => {
    notify.info("Info", { duration: 5000 });

    expect(toast).toHaveBeenCalledWith("Info", expect.objectContaining({
      duration: 5000,
    }));
  });
});
