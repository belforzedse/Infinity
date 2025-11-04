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
  badRequest: jest.fn((message, body) => {
    const error = new Error(message);
    (error as any).status = 400;
    (error as any).body = body;
    throw error;
  }),
  ...overrides,
});
