/**
 * Jest setup file - runs before all tests
 */

/// <reference types="jest" />

// Set test environment variables BEFORE any code runs
process.env.NODE_ENV = 'test';
process.env.DATABASE_CLIENT = 'sqlite';
process.env.DATABASE_FILENAME = ':memory:';

// Use staging/test endpoints for external services
process.env.MELLAT_TERMINAL_ID = 'test-terminal-id';
process.env.MELLAT_USERNAME = 'test-username';
process.env.MELLAT_PASSWORD = 'test-password';
process.env.MELLAT_GATEWAY_URL = 'https://test-gateway.example.com/pgw?wsdl'; // Mock endpoint

process.env.SNAPPAY_BASE_URL = 'https://staging-api.snapppay.ir'; // Staging if available
process.env.SNAPPAY_CLIENT_ID = 'test-client-id';
process.env.SNAPPAY_CLIENT_SECRET = 'test-secret';
process.env.SNAPPAY_USERNAME = 'test-username';
process.env.SNAPPAY_PASSWORD = 'test-password';

process.env.IP_PANEL_API_URL = 'https://test-sms.example.com'; // Mock SMS gateway
process.env.IP_PANEL_API_KEY = 'test-api-key';

process.env.JWT_SECRET = 'test-jwt-secret-key-for-testing';
process.env.REDIS_URL = 'redis://localhost:6379';

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
  plugin: jest.fn((pluginName: string) => {
    if (pluginName === 'users-permissions') {
      return {
        service: jest.fn((serviceName: string) => {
          if (serviceName === 'jwt') {
            return {
              sign: jest.fn((payload) => `mock-jwt-token-${payload.id}`),
              verify: jest.fn((token) => ({ id: 1, phone: '09123456789' })),
            };
          }
        }),
      };
    }
  }),
};

// Mock axios for external API calls
jest.mock('axios');

// Mock Redis client
jest.mock('../../index', () => ({
  RedisClient: Promise.resolve({
    get: jest.fn(),
    set: jest.fn(),
    del: jest.fn(),
    exists: jest.fn(),
  }),
}));

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
