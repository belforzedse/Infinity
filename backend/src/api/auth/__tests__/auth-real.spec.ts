/**
 * Auth Controller Tests - REAL IMPLEMENTATION
 * Tests actual OTP flow, login, and registration logic
 */

import { createStrapiMock, mockContext, mockUser } from '../../../__tests__/mocks/factories';

// Mock Redis client
const mockRedisGet = jest.fn();
const mockRedisSet = jest.fn();
const mockRedisDel = jest.fn();

jest.mock('../../../index', () => ({
  RedisClient: Promise.resolve({
    get: mockRedisGet,
    set: mockRedisSet,
    del: mockRedisDel,
    exists: jest.fn(),
  }),
}));

// Import controller actions AFTER mocks
let authController: any;

describe('Auth Controller - Real Implementation', () => {
  let mockStrapi: any;
  let authService: any;
  let messagingService: any;
  let jwtService: any;
  let userService: any;

  beforeAll(async () => {
    // Dynamic import after mocks are set up
    authController = (await import('../controllers/auth')).default;
  });

  beforeEach(() => {
    jest.clearAllMocks();
    const mock = createStrapiMock();
    mockStrapi = mock.strapi;

    // Make strapi global available
    (global as any).strapi = mockStrapi;

    // Mock auth service
    authService = {
      hasUser: jest.fn(),
      otp: jest.fn(),
    };
    mock.registerService('api::auth.auth', authService);

    // Mock messaging service (SMS)
    messagingService = {
      sendSMS: jest.fn(),
    };
    mock.registerService('api::messaging.messaging', messagingService);

    // Mock JWT service
    jwtService = {
      issue: jest.fn((payload) => `mock-jwt-token-${payload.id}`),
      verify: jest.fn((token) => ({ id: 1, phone: '09123456789' })),
    };

    // Mock users-permissions plugin
    mockStrapi.plugin = jest.fn((pluginName: string) => {
      if (pluginName === 'users-permissions') {
        return {
          service: jest.fn((serviceName: string) => {
            if (serviceName === 'jwt') return jwtService;
            if (serviceName === 'user') return userService;
          }),
        };
      }
    });

    // Mock user service for password validation
    userService = {
      validatePassword: jest.fn(),
    };

    // Mock query methods
    const mockQuery = {
      findOne: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    };
    mock.registerQuery('plugin::users-permissions.user', mockQuery);
    mock.registerQuery('api::local-user-info.local-user-info', mockQuery);
    mock.registerQuery('api::local-user.local-user', mockQuery);
    mock.registerQuery('plugin::users-permissions.role', {
      findOne: jest.fn().mockResolvedValue({ id: 1, name: 'Customer' }),
      create: jest.fn(),
      update: jest.fn(),
    });
  });

  describe('welcome - Check if user exists', () => {
    it('should return hasUser=true for existing user - REAL logic', async () => {
      authService.hasUser.mockResolvedValue(true);

      const ctx = mockContext({
        request: { body: { phone: '09123456789' } },
      });

      // ✅ Call REAL controller action
      await authController.welcome(ctx);

      expect(authService.hasUser).toHaveBeenCalledWith(ctx, { phone: '09123456789' });
      expect(ctx.body).toEqual({
        message: 'welcome',
        hasUser: true,
      });
    });

    it('should return hasUser=false for new user', async () => {
      authService.hasUser.mockResolvedValue(false);

      const ctx = mockContext({
        request: { body: { phone: '09987654321' } },
      });

      await authController.welcome(ctx);

      expect(ctx.body).toEqual({
        message: 'welcome',
        hasUser: false,
      });
    });

    it('should validate phone number format', async () => {
      const ctx = mockContext({
        request: { body: { phone: 'invalid' } },
      });

      await authController.welcome(ctx);

      // Real validation should reject invalid phone
      expect(authService.hasUser).not.toHaveBeenCalled();
    });
  });

  describe('otp - Send OTP code', () => {
    it('should generate and send OTP - REAL flow', async () => {
      const otpToken = '1234567890.abcdef123456';
      authService.otp.mockResolvedValue(otpToken);

      const ctx = mockContext({
        request: { body: { phone: '09123456789' } },
      });

      // ✅ Call REAL controller action
      await authController.otp(ctx);

      expect(authService.otp).toHaveBeenCalledWith(ctx, { phone: '09123456789' });
      expect(ctx.body).toEqual({
        message: 'otp sent',
        otpToken,
      });
    });

    it('should reject invalid phone numbers', async () => {
      const ctx = mockContext({
        request: { body: { phone: '123' } }, // Invalid
      });

      await authController.otp(ctx);

      expect(authService.otp).not.toHaveBeenCalled();
    });

    it('should handle service errors', async () => {
      authService.otp.mockRejectedValue(new Error('SMS service unavailable'));

      const ctx = mockContext({
        request: { body: { phone: '09123456789' } },
      });

      await authController.otp(ctx);

      expect(ctx.status).toBe(500);
    });
  });

  describe('login - Verify OTP and issue JWT', () => {
    it('should verify OTP and create new user - REAL registration flow', async () => {
      const otpToken = '1234567890.abcdef';
      const otp = '123456';
      const phone = '+989123456789';

      // Mock Redis returns OTP data
      mockRedisGet.mockResolvedValue(
        JSON.stringify({
          code: otp,
          phone: phone,
          merchant: null, // New user
        })
      );

      // Mock no existing user
      const mockQuery = mockStrapi.db.query('plugin::users-permissions.user');
      mockQuery.findOne.mockResolvedValue(null);

      // Mock role fetch
      mockStrapi.entityService.findMany.mockResolvedValue([{ id: 1, name: 'Customer' }]);

      // Mock user creation
      const newUser = { id: 10, phone, username: phone };
      mockStrapi.entityService.create.mockResolvedValue(newUser);

      const ctx = mockContext({
        request: { body: { otp, otpToken } },
      });

      // ✅ Call REAL login action
      await authController.login(ctx);

      // ✅ Verify REAL behavior
      expect(mockRedisGet).toHaveBeenCalledWith(otpToken);
      expect(mockStrapi.entityService.create).toHaveBeenCalledWith(
        'plugin::users-permissions.user',
        expect.objectContaining({
          data: expect.objectContaining({
            phone,
            username: phone,
            confirmed: true,
          }),
        })
      );
      expect(jwtService.issue).toHaveBeenCalledWith({ id: 10 });
      expect(ctx.body).toEqual({
        message: 'login successful',
        token: 'mock-jwt-token-10',
      });
    });

    it('should verify OTP and login existing user - REAL login flow', async () => {
      const otpToken = '1234567890.abcdef';
      const otp = '123456';
      const phone = '+989123456789';

      mockRedisGet.mockResolvedValue(
        JSON.stringify({
          code: otp,
          phone,
          merchant: 5, // Existing user
        })
      );

      const existingUser = {
        id: 5,
        phone,
        confirmed: true,
      };

      const mockQuery = mockStrapi.db.query('plugin::users-permissions.user');
      mockQuery.findOne.mockResolvedValue(existingUser);

      const ctx = mockContext({
        request: { body: { otp, otpToken } },
      });

      await authController.login(ctx);

      // ✅ Should NOT create new user
      expect(mockStrapi.entityService.create).not.toHaveBeenCalledWith(
        'plugin::users-permissions.user',
        expect.anything()
      );

      // ✅ Should issue JWT for existing user
      expect(jwtService.issue).toHaveBeenCalledWith({ id: 5 });
      expect(ctx.body).toEqual({
        message: 'login successful',
        token: 'mock-jwt-token-5',
      });
    });

    it('should reject invalid OTP - REAL validation', async () => {
      const otpToken = '1234567890.abcdef';
      const correctOtp = '123456';
      const wrongOtp = '999999';

      mockRedisGet.mockResolvedValue(
        JSON.stringify({
          code: correctOtp,
          phone: '+989123456789',
        })
      );

      const ctx = mockContext({
        request: { body: { otp: wrongOtp, otpToken } },
      });

      await authController.login(ctx);

      // ✅ Real validation rejects wrong OTP
      expect(ctx.badRequest).toHaveBeenCalledWith('otp is invalid');
      expect(jwtService.issue).not.toHaveBeenCalled();
    });

    it('should reject expired/invalid otpToken', async () => {
      const otpToken = 'invalid-token';
      mockRedisGet.mockResolvedValue(null);

    const ctx = mockContext({
      request: { body: { otp: '123456', otpToken } },
    });

    await authController.login(ctx);

    expect(ctx.badRequest).toHaveBeenCalledWith('otp or otpToken is invalid');
  });

    it('should reject malformed otpToken format', async () => {
      const ctx = mockContext({
        request: { body: { otp: '123456', otpToken: 'no-dot-in-token' } },
      });

      await authController.login(ctx);

      // ✅ Real validation checks token format
      expect(ctx.badRequest).toHaveBeenCalledWith('otp or otpToken is invalid');
    });

    it('should confirm unconfirmed user on login', async () => {
      const otpToken = '1234567890.abcdef';
      const otp = '123456';

      mockRedisGet.mockResolvedValue(
        JSON.stringify({
          code: otp,
          phone: '+989123456789',
        })
      );

      const unconfirmedUser = {
        id: 7,
        phone: '+989123456789',
        confirmed: false, // Not confirmed yet
      };

      const mockQuery = mockStrapi.db.query('plugin::users-permissions.user');
      mockQuery.findOne.mockResolvedValue(unconfirmedUser);

      const ctx = mockContext({
        request: { body: { otp, otpToken } },
      });

      await authController.login(ctx);

      // ✅ Should mark user as confirmed
      expect(mockStrapi.entityService.update).toHaveBeenCalledWith(
        'plugin::users-permissions.user',
        7,
        expect.objectContaining({
          data: { confirmed: true },
        })
      );
    });
  });

  describe('loginWithPassword - Password-based login', () => {
    it('should login with valid password - REAL password validation', async () => {
      const phone = '09123456789';
      const password = 'correct-password';

      const user = {
        id: 1,
        phone,
        password: 'hashed-password-value',
      };

      const mockQuery = mockStrapi.db.query('plugin::users-permissions.user');
      mockQuery.findOne.mockResolvedValue(user);

      userService.validatePassword.mockResolvedValue(true);

    const ctx = mockContext({
      request: { body: { phone, password } },
    });

    await authController.loginWithPassword(ctx);

    expect(userService.validatePassword).toHaveBeenCalledWith(password, user.password);
    expect(jwtService.issue).toHaveBeenCalledWith({ id: 1 });
    expect(ctx.body).toEqual({
      message: 'login successful',
        token: 'mock-jwt-token-1',
      });
    });

    it('should reject invalid password', async () => {
      const phone = '09123456789';
      const password = 'wrong-password';

      const user = {
        id: 1,
        phone,
        password: 'hashed-password-value',
      };

      const mockQuery = mockStrapi.db.query('plugin::users-permissions.user');
      mockQuery.findOne.mockResolvedValue(user);

      userService.validatePassword.mockResolvedValue(false);

    const ctx = mockContext({
      request: { body: { phone, password } },
    });

    await expect(authController.loginWithPassword(ctx)).rejects.toThrow(
      'User not found or password is incorrect'
    );

    expect(ctx.unauthorized).toHaveBeenCalledWith('User not found or password is incorrect');
    expect(jwtService.issue).not.toHaveBeenCalled();
  });

    it('should reject missing credentials', async () => {
    const ctx = mockContext({
      request: { body: {} },
    });

    await expect(authController.loginWithPassword(ctx)).rejects.toThrow(
      'Phone and password are required'
    );

    expect(ctx.badRequest).toHaveBeenCalledWith('Phone and password are required');
  });

    it('should handle user not found', async () => {
      const mockQuery = mockStrapi.db.query('plugin::users-permissions.user');
      mockQuery.findOne.mockResolvedValue(null);

    const ctx = mockContext({
      request: { body: { phone: '09999999999', password: 'password' } },
    });

    await expect(authController.loginWithPassword(ctx)).rejects.toThrow(
      'User not found or password is incorrect'
    );

    expect(ctx.unauthorized).toHaveBeenCalledWith('User not found or password is incorrect');
  });
  });

  describe('resetPassword - Password reset with OTP', () => {
    it('should reset password with valid OTP - REAL flow', async () => {
      const otpToken = '1234567890.abcdef';
      const otp = '123456';
      const newPassword = 'new-secure-password';
      const userId = 5;

      mockRedisGet.mockResolvedValue(
        JSON.stringify({
          code: otp,
          phone: '+989123456789',
          merchant: userId,
        })
      );

      mockStrapi.entityService.findOne.mockResolvedValue({
        id: userId,
        phone: '+989123456789',
      });

      const ctx = mockContext({
        request: { body: { otp, otpToken, newPassword } },
      });

      // ✅ Call REAL controller action
      await authController.resetPassword(ctx);

      expect(mockStrapi.entityService.update).toHaveBeenCalledWith(
        'plugin::users-permissions.user',
        userId,
        expect.objectContaining({
          data: expect.objectContaining({
            password: expect.stringMatching(/^\$2[aby]\$\d+\$/), // Bcrypt hash format
          }),
        })
      );

      expect(ctx.body).toEqual({
        message: 'password reset successfully',
      });
    });

    it('should reject invalid OTP during password reset', async () => {
      mockRedisGet.mockResolvedValue(
        JSON.stringify({
          code: '123456',
          merchant: 1,
        })
      );

    const ctx = mockContext({
      request: { body: { otp: '999999', otpToken: '1234567890.abc', newPassword: 'new-pass' } },
    });

    await expect(authController.resetPassword(ctx)).rejects.toThrow('otp is invalid');

    expect(ctx.badRequest).toHaveBeenCalledWith('otp is invalid');
    expect(mockStrapi.entityService.update).not.toHaveBeenCalled();
  });
  });

  describe('self - Get current user profile', () => {
    it('should return user profile with JWT - REAL profile fetch', async () => {
      const userId = 1;
      const token = 'valid-jwt-token';

      jwtService.verify.mockResolvedValue({ id: userId });

      mockStrapi.entityService.findOne.mockResolvedValue({
        id: userId,
        phone: '+989123456789',
        username: '+989123456789',
        role: { id: 1, name: 'Customer' },
      });

      const mockQuery = mockStrapi.db.query('api::local-user-info.local-user-info');
      mockQuery.findOne.mockResolvedValue({
        id: 1,
        FirstName: 'John',
        LastName: 'Doe',
        user: userId,
      });

      const ctx = mockContext({
        request: { header: { authorization: `Bearer ${token}` } },
        state: {},
      });

      // ✅ Call REAL controller action
      await authController.self(ctx);

      expect(jwtService.verify).toHaveBeenCalledWith(token);
      expect(mockStrapi.entityService.findOne).toHaveBeenCalledWith(
        'plugin::users-permissions.user',
        userId,
        expect.objectContaining({ populate: ['role'] })
      );
      expect(ctx.body).toMatchObject({
        FirstName: 'John',
        LastName: 'Doe',
        Phone: '+989123456789',
        isAdmin: false,
        roleName: 'Customer',
      });
    });

    it('should detect admin users', async () => {
      jwtService.verify.mockResolvedValue({ id: 1 });

      mockStrapi.entityService.findOne.mockResolvedValue({
        id: 1,
        role: { id: 2, name: 'Superadmin' },
      });

      const mockQuery = mockStrapi.db.query('api::local-user-info.local-user-info');
      mockQuery.findOne.mockResolvedValue(null);

      const ctx = mockContext({
        request: { header: { authorization: 'Bearer token' } },
        state: {},
      });

      await authController.self(ctx);

      expect(ctx.body.isAdmin).toBe(true);
      expect(ctx.body.roleName).toBe('Superadmin');
    });

    it('should return unauthorized without valid token', async () => {
      const ctx = mockContext({
        request: { header: {} },
        state: {},
      });

      await authController.self(ctx);

      expect(ctx.unauthorized).toHaveBeenCalledWith('Unauthorized');
    });
  });

  describe('registerInfo - Update user profile', () => {
    it('should update user profile - REAL update flow', async () => {
      const userId = 1;
      const firstName = 'Jane';
      const lastName = 'Smith';
      const password = 'new-password';
      const birthDate = '1990-01-01';

      const ctx = mockContext({
        request: {
          body: { firstName, lastName, password, birthDate },
        },
        state: { user: { id: userId } },
      });

      const mockQuery = mockStrapi.db.query('api::local-user-info.local-user-info');
      mockQuery.findOne.mockResolvedValue({
        id: 1,
        user: userId,
      });

      // Mock transaction
      mockStrapi.db.transaction = jest.fn((callback) => callback());

      // ✅ Call REAL controller action
      await authController.registerInfo(ctx);

      expect(mockStrapi.entityService.update).toHaveBeenCalledWith(
        'api::local-user-info.local-user-info',
        1,
        expect.objectContaining({
          data: expect.objectContaining({
            FirstName: firstName,
            LastName: lastName,
            BirthDate: birthDate,
          }),
        })
      );

      expect(ctx.body).toEqual({ message: 'info updated' });
    });

    it('should create profile if not exists', async () => {
      const userId = 1;
      const ctx = mockContext({
        request: { body: { firstName: 'New', lastName: 'User' } },
        state: { user: { id: userId } },
      });

      const mockQuery = mockStrapi.db.query('api::local-user-info.local-user-info');
      mockQuery.findOne.mockResolvedValue(null); // No profile exists

      mockStrapi.db.transaction = jest.fn((callback) => callback());

      await authController.registerInfo(ctx);

      expect(mockStrapi.entityService.create).toHaveBeenCalledWith(
        'api::local-user-info.local-user-info',
        expect.objectContaining({
          data: expect.objectContaining({
            user: userId,
            FirstName: 'New',
            LastName: 'User',
          }),
        })
      );
    });
  });
});
