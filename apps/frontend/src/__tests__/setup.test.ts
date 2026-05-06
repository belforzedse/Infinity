// Global test setup and utilities

// Mock Next.js environment - in test environment, we modify the global rather than process.env
(global as any).__NEXT_ENV = "test";

// Mock IntersectionObserver for components that might use it
global.IntersectionObserver = class IntersectionObserver {
  root = null;
  rootMargin = "";
  thresholds: ReadonlyArray<number> = [];

  constructor() {}
  disconnect() {}
  observe() {}
  unobserve() {}
  takeRecords(): IntersectionObserverEntry[] {
    return [];
  }
};

// Mock ResizeObserver for components that might use it
global.ResizeObserver = class ResizeObserver {
  constructor() {}
  disconnect() {}
  observe() {}
  unobserve() {}
};

// Mock matchMedia for responsive components
Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: jest.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

// Mock scroll methods
Object.defineProperty(window, "scrollTo", {
  value: jest.fn(),
  writable: true,
});

// Mock console methods to avoid noise in tests
const originalError = console.error;
const originalWarn = console.warn;

beforeAll(() => {
  console.error = jest.fn();
  console.warn = jest.fn();
});

afterAll(() => {
  console.error = originalError;
  console.warn = originalWarn;
});

describe("Test Setup", () => {
  it("should have mocked global objects", () => {
    expect(global.IntersectionObserver).toBeDefined();
    expect(global.ResizeObserver).toBeDefined();
    expect(window.matchMedia).toBeDefined();
    expect(window.scrollTo).toBeDefined();
  });
});

export {};
