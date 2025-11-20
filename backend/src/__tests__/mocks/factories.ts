/**
 * Mock data factories for tests
 */

export const mockCart = (overrides?: Partial<any>) => ({
  id: 1,
  user: { id: 1, Phone: '09123456789' },
  cart_items: [],
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  ...overrides,
});

export const mockCartItem = (overrides?: Partial<any>) => ({
  id: 1,
  Count: 1,
  ProductTitle: 'Test Product',
  ProductSKU: 'TEST-SKU',
  PerAmount: 100000,
  cart: { id: 1 },
  product_variation: {
    id: 1,
    product: {
      id: 1,
      Title: 'Test Product',
      Price: 100000,
      Description: 'Test description',
      removedAt: null,
    },
    product_color: null,
    product_size: null,
    product_variation_model: null,
    product_stock: [{ Quantity: 100 }],
  },
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  ...overrides,
});

export const mockOrder = (overrides?: Partial<any>) => ({
  id: 1,
  Status: 'Pending',
  Date: new Date().toISOString(),
  Type: 'Standard',
  ShippingCost: 50000,
  Description: null,
  Note: null,
  user: { id: 1, Phone: '09123456789' },
  order_items: [],
  contract: { id: 1, Amount: 150000 },
  shipping: { id: 1, Title: 'Standard Shipping', Price: 50000 },
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  ...overrides,
});

export const mockOrderItem = (overrides?: Partial<any>) => ({
  id: 1,
  Count: 1,
  PerAmount: 100000,
  ProductTitle: 'Test Product',
  ProductSKU: 'TEST-001',
  order: { id: 1 },
  product_variation: {
    id: 1,
    product: {
      id: 1,
      Title: 'Test Product',
      cover_image: {
        id: 1,
        url: '/uploads/test.jpg',
      },
    },
  },
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  ...overrides,
});

export const mockUser = (overrides?: Partial<any>) => ({
  id: 1,
  Phone: '09123456789',
  Email: 'test@example.com',
  Password: 'hashed-password',
  IsActive: true,
  role: 'customer',
  failedAttempts: 0,
  user_info: {
    id: 1,
    FirstName: 'Test',
    LastName: 'User',
  },
  local_user_wallet: {
    id: 1,
    Balance: 100000,
  },
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  ...overrides,
});

export const mockProductVariation = (overrides?: Partial<any>) => ({
  id: 1,
  product: {
    id: 1,
    Title: 'Test Product',
    Price: 100000,
    Description: 'Test description',
  },
  product_stock: [
    {
      id: 1,
      Quantity: 100,
      product_color: null,
      product_size: null,
      product_variation_model: null,
    },
  ],
  product_color: null,
  product_size: null,
  product_variation_model: null,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  ...overrides,
});

export const mockContract = (overrides?: Partial<any>) => ({
  id: 1,
  Amount: 150000,
  Discount: 0,
  TaxAmount: 15000,
  ShippingCost: 50000,
  order: { id: 1 },
  user: { id: 1 },
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  ...overrides,
});

export const mockContext = (overrides?: Partial<any>) => ({
  request: {
    body: {},
    ...overrides?.request,
  },
  response: {
    status: 200,
    body: {},
  },
  state: {
    user: mockUser(),
    ...overrides?.state,
  },
  throw: jest.fn((status, message) => {
    const error = new Error(message);
    (error as any).status = status;
    throw error;
  }),
  badRequest: jest.fn((message, payload) => {
    const error: any = new Error(message);
    error.status = 400;
    error.payload = payload;
    throw error;
  }),
  unauthorized: jest.fn((message) => {
    const error: any = new Error(message);
    error.status = 401;
    throw error;
  }),
  redirect: jest.fn(),
  ...overrides,
});

export const mockDiscount = (overrides?: Partial<any>) => ({
  id: 1,
  Code: 'SAVE20',
  DiscountPercent: 20,
  DiscountAmount: null,
  MinimumAmount: 100000,
  MaximumUsage: 100,
  UsageCount: 0,
  IsActive: true,
  ExpiryDate: new Date(Date.now() + 86400000).toISOString(), // Tomorrow
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  ...overrides,
});

export const mockProductStock = (overrides?: Partial<any>) => ({
  id: 1,
  Quantity: 100,
  Count: 100,
  product_variation: { id: 1 },
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  ...overrides,
});

/**
 * Creates a lightweight Strapi mock with registerable services and queries
 */
export const createStrapiMock = () => {
  const serviceMap: Record<string, any> = {};
  const queryMap: Record<string, any> = {};

  const strapi: any = {
    log: {
      info: jest.fn(),
      error: jest.fn(),
      warn: jest.fn(),
      debug: jest.fn(),
    },
    entityService: {
      findOne: jest.fn(),
      findMany: jest.fn().mockResolvedValue([]),
      create: jest.fn().mockResolvedValue(null),
      update: jest.fn().mockResolvedValue(null),
      delete: jest.fn().mockResolvedValue(null),
    },
    service: jest.fn((uid: string) => serviceMap[uid]),
    db: {
      query: jest.fn((uid: string) => queryMap[uid]),
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

  const registerService = (uid: string, impl: any) => {
    serviceMap[uid] = impl;
  };

  const registerQuery = (uid: string, impl: any) => {
    queryMap[uid] = impl;
  };

  return { strapi, registerService, registerQuery };
};

/**
 * Helper to mock entityService.findOne with different responses per UID
 */
export const mockEntityFindOne = (
  strapi: any,
  implementations: Record<string, (...args: any[]) => any>
) => {
  (strapi.entityService.findOne as jest.Mock).mockImplementation(
    async (uid: string, ...args: any[]) => {
      const handler = implementations[uid];
      return handler ? handler(...args) : null;
    }
  );
};
