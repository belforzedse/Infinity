describe("logger", () => {
  const originalEnv = process.env.NODE_ENV;
  let consoleLogSpy: jest.SpyInstance;
  let consoleWarnSpy: jest.SpyInstance;
  let consoleErrorSpy: jest.SpyInstance;

  beforeEach(() => {
    consoleLogSpy = jest.spyOn(console, "log").mockImplementation();
    consoleWarnSpy = jest.spyOn(console, "warn").mockImplementation();
    consoleErrorSpy = jest.spyOn(console, "error").mockImplementation();
    jest.resetModules();
  });

  afterEach(() => {
    consoleLogSpy.mockRestore();
    consoleWarnSpy.mockRestore();
    consoleErrorSpy.mockRestore();
    process.env.NODE_ENV = originalEnv;
    jest.resetModules();
  });

  describe("in development mode", () => {
    beforeEach(() => {
      process.env.NODE_ENV = "development";
    });

    it("should log info messages", () => {
      // Re-import logger after NODE_ENV change
      const logger = require("../logger").default;

      logger.info("Test info message");

      expect(consoleLogSpy).toHaveBeenCalledWith(
        JSON.stringify({ level: "log", message: "Test info message" }),
      );
    });

    it("should log warn messages", () => {
      const logger = require("../logger").default;

      logger.warn("Test warning");

      expect(consoleWarnSpy).toHaveBeenCalledWith(
        JSON.stringify({ level: "warn", message: "Test warning" }),
      );
    });

    it("should log error messages", () => {
      const logger = require("../logger").default;

      logger.error("Test error");

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        JSON.stringify({ level: "error", message: "Test error" }),
      );
    });

    it("should include metadata in logs", () => {
      const logger = require("../logger").default;

      logger.info("Test with meta", { userId: 123, action: "click" });

      expect(consoleLogSpy).toHaveBeenCalledWith(
        JSON.stringify({
          level: "log",
          message: "Test with meta",
          userId: 123,
          action: "click",
        }),
      );
    });
  });

  describe("in production mode", () => {
    beforeEach(() => {
      process.env.NODE_ENV = "production";
    });

    it("should not log info messages", () => {
      const logger = require("../logger").default;
      logger.info("Test info");
      expect(consoleLogSpy).not.toHaveBeenCalled();
    });

    it("should not log warn messages", () => {
      const logger = require("../logger").default;
      logger.warn("Test warning");
      expect(consoleWarnSpy).not.toHaveBeenCalled();
    });

    it("should not log error messages", () => {
      const logger = require("../logger").default;
      logger.error("Test error");
      expect(consoleErrorSpy).not.toHaveBeenCalled();
    });
  });

  describe("in test mode", () => {
    beforeEach(() => {
      process.env.NODE_ENV = "test";
    });

    it("should not log messages", () => {
      const logger = require("../logger").default;
      logger.info("Test info");
      logger.warn("Test warn");
      logger.error("Test error");

      expect(consoleLogSpy).not.toHaveBeenCalled();
      expect(consoleWarnSpy).not.toHaveBeenCalled();
      expect(consoleErrorSpy).not.toHaveBeenCalled();
    });
  });
});
