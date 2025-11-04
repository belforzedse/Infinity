/**
 * Jest setup file - runs before all tests
 */

/// <reference types="jest" />

// Mock strapi global with any type to allow jest mock methods
// This overrides the strapi global from @strapi/types
(global as any).strapi = {
  log: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
  },
  service: jest.fn(),
  entityService: {
    findOne: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
  db: {
    query: jest.fn(),
    lifecycles: {
      subscribe: jest.fn(),
    },
  },
};

// Suppress console output during tests
(global as any).console = {
  ...console,
  log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  // Keep error for debugging
  error: console.error,
};
