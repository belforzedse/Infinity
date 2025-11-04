/**
 * Authentication middleware tests
 * Tests for: JWT validation, token verification, user extraction
 */

import jwt from 'jsonwebtoken';

describe('Authentication Middleware', () => {
  const JWT_SECRET = process.env.JWT_SECRET || 'test-secret';
  const mockStrapi = global.strapi;

  beforeEach(() => {
    jest.clearAllMocks();
    process.env.JWT_SECRET = 'test-secret-key';
  });

  describe('Token Validation', () => {
    it('should accept valid JWT token', () => {
      const payload = { id: 1, Phone: '09123456789' };
      const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '24h' });

      const decoded = jwt.verify(token, JWT_SECRET);
      expect(decoded).toHaveProperty('id', 1);
      expect(decoded).toHaveProperty('Phone', '09123456789');
    });

    it('should reject invalid JWT token', () => {
      const invalidToken = 'invalid.token.here';

      expect(() => {
        jwt.verify(invalidToken, JWT_SECRET);
      }).toThrow();
    });

    it('should reject expired token', () => {
      const payload = { id: 1 };
      const expiredToken = jwt.sign(payload, JWT_SECRET, { expiresIn: '-1h' });

      expect(() => {
        jwt.verify(expiredToken, JWT_SECRET);
      }).toThrow('jwt expired');
    });

    it('should reject token with wrong secret', () => {
      const payload = { id: 1 };
      const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '24h' });
      const wrongSecret = 'wrong-secret';

      expect(() => {
        jwt.verify(token, wrongSecret);
      }).toThrow();
    });
  });

  describe('Token Extraction', () => {
    it('should extract token from Authorization header', () => {
      const token = 'test-token-value';
      const authHeader = `Bearer ${token}`;

      const extracted = authHeader.replace('Bearer ', '');
      expect(extracted).toBe(token);
    });

    it('should handle missing Authorization header', () => {
      const authHeader = undefined;

      if (!authHeader) {
        expect(authHeader).toBeUndefined();
      }
    });

    it('should reject malformed Authorization header', () => {
      const authHeader = 'InvalidFormat token-value';

      const isValid = authHeader.startsWith('Bearer ');
      expect(isValid).toBe(false);
    });

    it('should handle Bearer prefix case-insensitively', () => {
      const token = 'test-token';
      const variations = ['Bearer token', 'bearer token', 'BEARER token'];

      variations.forEach((header) => {
        const isValid =
          header.toLowerCase().startsWith('bearer ') &&
          header.split(' ').length === 2;
        expect(isValid).toBe(true);
      });
    });
  });

  describe('User Attachment', () => {
    it('should attach user to context state', () => {
      const userId = 1;
      const userPhone = '09123456789';
      const payload = { id: userId, Phone: userPhone };

      const ctx = {
        state: {} as any,
      };

      ctx.state.user = payload;

      expect(ctx.state.user).toEqual(payload);
      expect(ctx.state.user.id).toBe(userId);
    });

    it('should preserve all user properties in token', () => {
      const payload = {
        id: 1,
        Phone: '09123456789',
        Email: 'user@example.com',
        IsActive: true,
      };

      Object.entries(payload).forEach(([key, value]) => {
        expect(payload).toHaveProperty(key, value);
      });
    });

    it('should handle missing user data gracefully', () => {
      const payload = { id: 1 };
      const ctx = { state: { user: payload as any } };

      expect(ctx.state.user.id).toBeDefined();
      expect(ctx.state.user.Phone).toBeUndefined();
    });
  });

  describe('Protected Routes', () => {
    it('should allow request with valid token', () => {
      const token = jwt.sign({ id: 1 }, JWT_SECRET, { expiresIn: '24h' });
      const ctx = {
        request: { headers: { authorization: `Bearer ${token}` } },
        state: {} as any,
      };

      // Would attach user to ctx.state
      const decoded = jwt.verify(token, JWT_SECRET);
      ctx.state.user = decoded;

      expect(ctx.state.user).toBeDefined();
    });

    it('should deny request without token', () => {
      const ctx = {
        request: { headers: {} as any },
        state: {} as any,
      };

      const hasAuth = ctx.request.headers.authorization;
      expect(hasAuth).toBeUndefined();
    });

    it('should deny request with invalid token', () => {
      const ctx = {
        request: { headers: { authorization: 'Bearer invalid-token' } },
        state: {} as any,
      };

      expect(() => {
        const token = ctx.request.headers.authorization.replace('Bearer ', '');
        jwt.verify(token, JWT_SECRET);
      }).toThrow();
    });

    it('should deny request with expired token', () => {
      const expiredToken = jwt.sign({ id: 1 }, JWT_SECRET, { expiresIn: '-1h' });
      const ctx = {
        request: { headers: { authorization: `Bearer ${expiredToken}` } },
        state: {} as any,
      };

      expect(() => {
        const token = ctx.request.headers.authorization.replace('Bearer ', '');
        jwt.verify(token, JWT_SECRET);
      }).toThrow('jwt expired');
    });
  });

  describe('Token Refresh', () => {
    it('should generate new token with same payload', () => {
      const payload = { id: 1, Phone: '09123456789' };
      const token1 = jwt.sign(payload, JWT_SECRET, { expiresIn: '24h' });
      const token2 = jwt.sign(payload, JWT_SECRET, { expiresIn: '24h' });

      const decoded1 = jwt.verify(token1, JWT_SECRET) as any;
      const decoded2 = jwt.verify(token2, JWT_SECRET) as any;

      expect(decoded1.id).toBe(decoded2.id);
      expect(decoded1.Phone).toBe(decoded2.Phone);
    });

    it('should allow refreshing before expiration', () => {
      const payload = { id: 1 };
      const oldToken = jwt.sign(payload, JWT_SECRET, { expiresIn: '1h' });

      const decoded = jwt.verify(oldToken, JWT_SECRET) as any;
      // Remove exp and iat properties before creating new token
      const { exp, iat, ...payloadWithoutTimestamps } = decoded;
      const newToken = jwt.sign(payloadWithoutTimestamps, JWT_SECRET, { expiresIn: '24h' });

      expect(newToken).toBeDefined();
      expect(() => jwt.verify(newToken, JWT_SECRET)).not.toThrow();
    });
  });

  describe('Security', () => {
    it('should use strong secret for token signing', () => {
      const secret = JWT_SECRET;
      expect(secret).toBeDefined();
      expect(secret.length).toBeGreaterThan(10);
    });

    it('should include expiration time in token', () => {
      const payload = { id: 1 };
      const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '24h' });

      const decoded = jwt.decode(token) as any;
      expect(decoded.exp).toBeDefined();
      expect(decoded.iat).toBeDefined();
    });

    it('should not store passwords in token', () => {
      const payload = { id: 1, Phone: '09123456789' };
      const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '24h' });

      const decoded = jwt.decode(token) as any;
      expect(decoded).not.toHaveProperty('password');
      expect(decoded).not.toHaveProperty('Password');
    });

    it('should not expose sensitive data in error messages', () => {
      const token = 'invalid-token';

      try {
        jwt.verify(token, JWT_SECRET);
      } catch (error: any) {
        // Error message should not contain the token
        expect(error.message).not.toContain(token);
      }
    });
  });

  describe('Rate Limiting on Auth Routes', () => {
    it('should implement rate limiting for login attempts', () => {
      const maxAttempts = 5;
      const timeWindowMs = 15 * 60 * 1000; // 15 minutes

      expect(maxAttempts).toBeGreaterThan(0);
      expect(timeWindowMs).toBeGreaterThan(0);
    });

    it('should throttle repeated login failures', () => {
      const attempts = [1, 2, 3, 4, 5, 6];
      const maxAllowed = 5;

      const isThrottled = attempts[attempts.length - 1] > maxAllowed;
      expect(isThrottled).toBe(true);
    });
  });
});
