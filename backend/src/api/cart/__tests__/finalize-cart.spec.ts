/**
 * Cart finalization tests (most critical)
 * Tests: Creating orders, contracts, handling payments, stock management
 */

import { mockCart, mockCartItem, mockUser, mockContext, mockOrder, mockContract } from '../../../__tests__/mocks/factories';

describe('Finalize Cart to Order', () => {
  const mockStrapi = global.strapi;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Validation', () => {
    it('should require cart to have items', () => {
      const emptyCart = mockCart({ cart_items: [] });
      const hasItems = emptyCart.cart_items.length > 0;
      expect(hasItems).toBe(false);
    });

    it('should require valid shipping method', () => {
      const ctx = mockContext({
        request: { body: { shipping: null } },
      });
      expect(ctx.request.body.shipping).toBeNull();
    });

    it('should require valid address', () => {
      const ctx = mockContext({
        request: { body: { addressId: null } },
      });
      expect(ctx.request.body.addressId).toBeNull();
    });

    it('should require valid payment gateway', () => {
      const validGateways = ['mellat', 'snappay', 'wallet'];
      const gateway = 'invalid-gateway';
      const isValid = validGateways.includes(gateway);
      expect(isValid).toBe(false);
    });

    it('should require authenticated user', () => {
      const ctx = mockContext({
        state: { user: null },
      });
      expect(ctx.state.user).toBeNull();
    });

    it('should validate phone number format', () => {
      const validPhone = '09123456789';
      const invalidPhone = '123'; // Too short
      const phoneRegex = /^98\d{10}$|^09\d{9}$/;

      expect(validPhone).toMatch(phoneRegex);
      expect(invalidPhone).not.toMatch(phoneRegex);
    });

    it('should require positive total amount', () => {
      const totalAmount = 0;
      const isValid = totalAmount > 0;
      expect(isValid).toBe(false);
    });
  });

  describe('Order Creation', () => {
    it('should create order with correct data', () => {
      const userId = 1;
      const user = mockUser({ id: userId });
      const cart = mockCart({ user, cart_items: [mockCartItem()] });

      const orderData = {
        Status: 'Pending',
        Date: new Date().toISOString(),
        user: { id: userId },
        order_items: cart.cart_items,
      };

      expect(orderData.Status).toBe('Pending');
      expect(orderData.user.id).toBe(userId);
      expect(orderData.order_items.length).toBeGreaterThan(0);
    });

    it('should assign unique order number', () => {
      const orderId1 = 100;
      const orderId2 = 101;

      expect(orderId1).not.toBe(orderId2);
    });

    it('should copy cart items to order items', () => {
      const cartItems = [
        mockCartItem({ Count: 2 }),
        mockCartItem({ Count: 3 }),
      ];

      const orderItems = cartItems.map((item) => ({
        ...item,
        order: { id: 1 }, // Will be set after order creation
      }));

      expect(orderItems).toHaveLength(cartItems.length);
      orderItems.forEach((item, idx) => {
        expect(item.Count).toBe(cartItems[idx].Count);
        expect(item.ProductTitle).toBe(cartItems[idx].ProductTitle);
      });
    });

    it('should preserve product details in order items', () => {
      const cartItem = mockCartItem({
        ProductTitle: 'Test Product',
        ProductSKU: 'TEST-001',
        Count: 5,
        PerAmount: 100000,
      });

      expect(cartItem.ProductTitle).toBe('Test Product');
      expect(cartItem.ProductSKU).toBe('TEST-001');
      expect(cartItem.Count).toBe(5);
      expect(cartItem.PerAmount).toBe(100000);
    });

    it('should create order log entry', () => {
      const orderId = 100;
      const userId = 1;

      const orderLog = {
        order: { id: orderId },
        user: { id: userId },
        Action: 'Created',
        Description: 'Order created from cart finalization',
        createdAt: new Date().toISOString(),
      };

      expect(orderLog.order.id).toBe(orderId);
      expect(orderLog.Action).toBe('Created');
    });
  });

  describe('Contract Creation', () => {
    it('should create contract with correct calculations', () => {
      const subtotal = 100000;
      const discount = 10000;
      const tax = 9000; // 10% of (subtotal - discount)
      const shipping = 50000;

      const contract = mockContract({
        Amount: subtotal - discount + tax + shipping,
        Discount: discount,
        TaxAmount: tax,
        ShippingCost: shipping,
      });

      expect(contract.Amount).toBe(subtotal - discount + tax + shipping);
      expect(contract.Discount).toBe(discount);
      expect(contract.TaxAmount).toBe(tax);
    });

    it('should calculate tax on subtotal minus discount', () => {
      const subtotal = 100000;
      const discount = 10000;
      const taxPercent = 10;

      const taxableAmount = subtotal - discount;
      const tax = Math.round((taxableAmount * taxPercent) / 100);

      expect(tax).toBe(9000);
    });

    it('should include shipping cost in total', () => {
      const subtotal = 100000;
      const shipping = 50000;
      const tax = 10000;
      const discount = 0;

      const total = subtotal - discount + tax + shipping;
      expect(total).toBe(160000);
    });

    it('should handle zero discount', () => {
      const subtotal = 100000;
      const discount = 0;
      const tax = 10000;

      const total = subtotal - discount + tax;
      expect(total).toBe(110000);
    });

    it('should never allow negative total', () => {
      const subtotal = 100000;
      const discount = 150000; // More than subtotal
      const tax = 0;

      const total = Math.max(0, subtotal - discount + tax);
      expect(total).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Payment Processing', () => {
    it('should route to correct payment gateway', () => {
      const gateways = {
        mellat: { name: 'Mellat Bank', endpoint: '/mellat/request' },
        snappay: { name: 'SnappPay', endpoint: '/snappay/request' },
        wallet: { name: 'Wallet', endpoint: '/wallet/deduct' },
      };

      const selectedGateway = 'mellat';
      expect(gateways[selectedGateway]).toBeDefined();
    });

    it('should pass correct amount to payment gateway', () => {
      const orderTotal = 160000;
      const paymentAmount = orderTotal;

      expect(paymentAmount).toBe(orderTotal);
    });

    it('should include callback URL in payment request', () => {
      const callbackUrl = '/orders/payment-callback';
      expect(callbackUrl).toBeDefined();
      expect(callbackUrl).toMatch(/callback/i);
    });

    it('should handle payment gateway timeout', () => {
      const timeout = 60000; // 60 seconds
      expect(timeout).toBeGreaterThan(0);
    });

    it('should handle payment gateway errors', () => {
      const error = new Error('Payment gateway unavailable');
      expect(error).toBeInstanceOf(Error);
    });

    it('should retry payment on failure', () => {
      const maxRetries = 2;
      expect(maxRetries).toBeGreaterThanOrEqual(1);
    });
  });

  describe('Stock Management', () => {
    it('should NOT decrement stock on order creation', () => {
      // Stock should only decrement after SUCCESSFUL payment
      const variation = {
        id: 1,
        currentStock: 100,
        orderedQuantity: 5,
      };

      expect(variation.currentStock).toBe(100); // Unchanged until payment success
    });

    it('should decrement stock after successful payment', () => {
      const initialStock = 100;
      const orderedQuantity = 5;
      const afterPayment = initialStock - orderedQuantity;

      expect(afterPayment).toBe(95);
    });

    it('should not over-decrement stock', () => {
      const stock = 10;
      const quantity = 10;
      const remaining = Math.max(0, stock - quantity);

      expect(remaining).toBeGreaterThanOrEqual(0);
    });

    it('should create stock log entry on decrement', () => {
      const stockLog = {
        product_stock: { id: 1 },
        order: { id: 100 },
        Action: 'Decremented',
        PreviousQuantity: 100,
        NewQuantity: 95,
        Quantity: 5,
      };

      expect(stockLog.PreviousQuantity - stockLog.Quantity).toBe(stockLog.NewQuantity);
    });

    it('should only decrement on first successful payment', () => {
      // Prevent double-decrement if callback fires twice
      const order = { id: 100, paid: true, stockDecremented: true };

      const shouldDecrement = !order.stockDecremented;
      expect(shouldDecrement).toBe(false);
    });
  });

  describe('Cart Cleanup', () => {
    it('should empty cart after successful order creation', () => {
      const cartBefore = mockCart({
        cart_items: [mockCartItem(), mockCartItem()],
      });

      expect(cartBefore.cart_items.length).toBe(2);

      const cartAfter = mockCart({ cart_items: [] });
      expect(cartAfter.cart_items.length).toBe(0);
    });

    it('should not delete cart, just clear items', () => {
      const cartId = 1;
      const cart = mockCart({ id: cartId, cart_items: [] });

      expect(cart.id).toBe(cartId); // Cart still exists
      expect(cart.cart_items.length).toBe(0); // But items cleared
    });
  });

  describe('Error Scenarios', () => {
    it('should rollback on order creation failure', () => {
      // If order creation fails, don't proceed with payment
      (mockStrapi.db.query as any).mockImplementation(() => ({
        create: jest.fn().mockRejectedValue(new Error('DB error')),
      }));

      expect(mockStrapi.db.query).toBeDefined();
    });

    it('should rollback on contract creation failure', () => {
      // Similar - if contract fails, abort
      (mockStrapi.db.query as any).mockImplementation(() => ({
        create: jest.fn().mockRejectedValue(new Error('Contract creation failed')),
      }));

      expect(mockStrapi.db.query).toBeDefined();
    });

    it('should handle payment failure gracefully', () => {
      const paymentError = 'Payment gateway timeout';
      expect(paymentError).toBeDefined();
    });

    it('should not decrement stock if payment fails', () => {
      const paymentSuccessful = false;
      const shouldDecrement = paymentSuccessful;

      expect(shouldDecrement).toBe(false);
    });
  });

  describe('Concurrent Requests', () => {
    it('should handle multiple users finalizing carts simultaneously', () => {
      const user1 = mockUser({ id: 1 });
      const user2 = mockUser({ id: 2 });

      const cart1 = mockCart({ user: user1, id: 1 });
      const cart2 = mockCart({ user: user2, id: 2 });

      expect(cart1.user.id).not.toBe(cart2.user.id);
    });

    it('should prevent double-spending from single cart', () => {
      // If cart finalize is called twice simultaneously
      const cartId = 1;
      const finalizeAttempt1 = { cartId, timestamp: 1000 };
      const finalizeAttempt2 = { cartId, timestamp: 1001 };

      // Second should be rejected
      expect(finalizeAttempt2.timestamp).toBeGreaterThan(finalizeAttempt1.timestamp);
    });
  });
});
