import "@testing-library/jest-dom";
import { TextDecoder, TextEncoder } from "node:util";

if (!globalThis.TextEncoder) {
  Object.defineProperty(globalThis, "TextEncoder", { value: TextEncoder });
}

if (!globalThis.TextDecoder) {
  Object.defineProperty(globalThis, "TextDecoder", { value: TextDecoder });
}
