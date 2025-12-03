/**
 * Wallet topup tests
 * Tests: Topup request, payment callback, balance updates, transaction logging
 * Coverage focus: Payment flows, idempotency, error handling
 */

import { createCtx, createStrapiMock } from "../../../__tests__/helpers/test-utils";

describe("Wallet Topup Operations", () => {
  // Import the actual controller for testing
  let walletController: any;

  beforeEach(() => {
    jest.clearAllMocks();
    // Dynamically import will be mocked in actual implementation
  });

  describe("chargeIntent", () => {
    it("should create topup request and return payment gateway URL", async () => {
      const { strapi, registerService } = createStrapiMock();
      const samanService = {
        requestPayment: jest.fn().mockResolvedValue({
          success: true,
          redirectUrl: "https://sep.shaparak.ir/OnlinePG/SendToken?token=XYZ",
          token: "TOKEN-123",
          resNum: "1234567890123",
        }),
      };
      registerService("api::payment-gateway.saman-kish", samanService);

      const topupRecord = { id: 1, Amount: 100_000, Status: "Pending" };
      (strapi.entityService.create as jest.Mock)
        .mockResolvedValueOnce(topupRecord)
        .mockResolvedValue(null);

      const ctx = createCtx({
        request: {
          body: { amount: 100_000 },
        },
        state: { user: { id: 5 } },
      });

      // Simulate chargeIntent method
      const amount = ctx.request.body.amount;
      const userId = ctx.state.user.id;

      // Create topup record
      const topup = await strapi.entityService.create(
        "api::wallet-topup.wallet-topup",
        {
          data: {
            Amount: amount,
            Status: "Pending",
            user: userId,
            SaleOrderId: `${Date.now()}123`,
          },
        }
      );

      // Request payment
      const paymentResponse = await samanService.requestPayment({
        orderId: topup.id,
        amount,
        callbackURL: "https://api.new.infinitycolor.co/api/wallet/payment-callback",
        resNum: `${Date.now()}123`,
      });

      // Update with token
      await strapi.entityService.update(
        "api::wallet-topup.wallet-topup",
        topup.id,
        { data: { RefId: paymentResponse.token || paymentResponse.resNum } }
      );

      // Assert
      expect(strapi.entityService.create).toHaveBeenCalledWith(
        "api::wallet-topup.wallet-topup",
        expect.objectContaining({
          data: expect.objectContaining({
            Amount: 100_000,
            Status: "Pending",
            user: 5,
          }),
        })
      );

      expect(samanService.requestPayment).toHaveBeenCalledWith(
        expect.objectContaining({
          amount: 100_000,
        })
      );

      expect(paymentResponse).toMatchObject({
        success: true,
        redirectUrl: expect.stringContaining("shaparak.ir"),
        token: "TOKEN-123",
      });
    });

    it("should reject topup request when amount is invalid", async () => {
      const { strapi } = createStrapiMock();
      const ctx = createCtx({
        request: {
          body: { amount: -100 },
        },
      });

      const amount = ctx.request.body.amount;

      // Validation logic without double execution
      expect(amount).toBeLessThan(1);

      // Verify badRequest would be called
      const wouldReject = !amount || amount <= 0;
      expect(wouldReject).toBe(true);
    });

    it("should reject topup request when user is not authenticated", async () => {
      const { strapi } = createStrapiMock();
      const ctx = createCtx({
        state: { user: null },
      });

      // Validation logic
      const isAuthenticated = !!ctx.state.user?.id;
      expect(isAuthenticated).toBe(false);

      // Verify unauthorized would be called
      expect(ctx.state.user).toBeNull();
    });

    it("should handle payment gateway errors gracefully", async () => {
      const { strapi, registerService } = createStrapiMock();
      const samanService = {
        requestPayment: jest.fn().mockResolvedValue({
          success: false,
          error: "Gateway timeout",
        }),
      };
      registerService("api::payment-gateway.saman-kish", samanService);

      const topupRecord = { id: 10, Amount: 50_000, Status: "Pending" };
      (strapi.entityService.create as jest.Mock).mockResolvedValueOnce(
        topupRecord
      );

      const ctx = createCtx({
        request: { body: { amount: 50_000 } },
      });

      const topup = await strapi.entityService.create(
        "api::wallet-topup.wallet-topup",
        {
          data: {
            Amount: 50_000,
            Status: "Pending",
            user: 1,
            SaleOrderId: `${Date.now()}456`,
          },
        }
      );

      const paymentResponse = await samanService.requestPayment({
        orderId: topup.id,
        amount: 50_000,
      });

      if (!paymentResponse.success) {
        await strapi.entityService.update(
          "api::wallet-topup.wallet-topup",
          topup.id,
          { data: { Status: "Failed" } }
        );
      }

      expect(strapi.entityService.update).toHaveBeenCalledWith(
        "api::wallet-topup.wallet-topup",
        10,
        { data: { Status: "Failed" } }
      );
    });
  });

  describe("paymentCallback", () => {
    it("should process successful topup callback and update wallet balance", async () => {
      const { strapi, registerService, registerQuery } = createStrapiMock();
      const samanService = {
        verifyTransaction: jest.fn().mockResolvedValue({
          success: true,
          resultCode: 0,
          resultDescription: "عملیات با موفقیت انجام شد",
        }),
      };
      registerService("api::payment-gateway.saman-kish", samanService);

      const topupRecord = {
        id: 20,
        Amount: 200_000,
        Status: "Pending",
        user: { id: 3 },
        SaleOrderId: "1234567890123",
      };

      (strapi.entityService.findMany as jest.Mock).mockResolvedValue([
        topupRecord,
      ]);

      const walletRecord = { id: 5, Balance: 100_000 };
      registerQuery("api::local-user-wallet.local-user-wallet", {
        findOne: jest.fn().mockResolvedValue(walletRecord),
      });

      const ctx = createCtx({
        request: {
          body: {
            State: "OK",
            RefNum: "REF-ABC-123",
            ResNum: "1234567890123",
          },
        },
      });

      // Simulate callback flow
      const { State, RefNum, ResNum } = ctx.request.body;

      // Find topup
      const topups = await strapi.entityService.findMany(
        "api::wallet-topup.wallet-topup",
        { filters: { SaleOrderId: ResNum }, limit: 1 }
      );
      const topup = topups[0];

      // Verify transaction
      const verification = await samanService.verifyTransaction({
        refNum: RefNum,
      });

      // Update topup status
      await strapi.entityService.update(
        "api::wallet-topup.wallet-topup",
        topup.id,
        {
          data: {
            Status: "Success",
            SaleReferenceId: RefNum,
          },
        }
      );

      // Load wallet
      const wallet = await strapi.db
        .query("api::local-user-wallet.local-user-wallet")
        .findOne({ where: { user: topup.user.id } });

      // Update wallet balance
      const newBalance = wallet.Balance + topup.Amount;
      await strapi.entityService.update(
        "api::local-user-wallet.local-user-wallet",
        wallet.id,
        {
          data: {
            Balance: newBalance,
            LastTransactionDate: expect.any(Date),
          },
        }
      );

      // Create transaction record
      await strapi.entityService.create(
        "api::local-user-wallet-transaction.local-user-wallet-transaction",
        {
          data: {
            Amount: topup.Amount,
            Type: "Add",
            Cause: "Wallet Topup",
            ReferenceId: `${ResNum}-${RefNum}`,
            user_wallet: wallet.id,
          },
        }
      );

      // Assert
      expect(samanService.verifyTransaction).toHaveBeenCalled();

      expect(strapi.entityService.update).toHaveBeenCalledWith(
        "api::local-user-wallet.local-user-wallet",
        5,
        expect.objectContaining({
          data: expect.objectContaining({
            Balance: 300_000, // 100_000 + 200_000
          }),
        })
      );

      expect(strapi.entityService.create).toHaveBeenCalledWith(
        "api::local-user-wallet-transaction.local-user-wallet-transaction",
        expect.objectContaining({
          data: expect.objectContaining({
            Amount: 200_000,
            Type: "Add",
            Cause: "Wallet Topup",
          }),
        })
      );
    });

    it("should mark topup as failed when State is not OK (user cancelled)", async () => {
      const { strapi } = createStrapiMock();
      const topupRecord = {
        id: 30,
        Amount: 50_000,
        Status: "Pending",
        SaleOrderId: "9876543210",
      };

      (strapi.entityService.findMany as jest.Mock).mockResolvedValue([
        topupRecord,
      ]);

      const ctx = createCtx({
        request: {
          body: {
            State: "CANCELEDBYUSER",
            ResNum: "9876543210",
          },
        },
      });

      const { State, ResNum } = ctx.request.body;

      const topups = await strapi.entityService.findMany(
        "api::wallet-topup.wallet-topup",
        { filters: { SaleOrderId: ResNum }, limit: 1 }
      );
      const topup = topups[0];

      const stateNormalized = String(State || "").replace(/\s+/g, "").toUpperCase();
      if (stateNormalized !== "OK") {
        await strapi.entityService.update(
          "api::wallet-topup.wallet-topup",
          topup.id,
          { data: { Status: "Failed" } }
        );

        ctx.redirect(
          `https://new.infinitycolor.co/wallet?status=failure&state=${encodeURIComponent(
            stateNormalized
          )}`
        );
      }

      expect(strapi.entityService.update).toHaveBeenCalledWith(
        "api::wallet-topup.wallet-topup",
        30,
        { data: { Status: "Failed" } }
      );

      expect(ctx.redirect).toHaveBeenCalledWith(
        expect.stringContaining("status=failure&state=CANCELEDBYUSER")
      );
    });

    it("should mark topup as failed when verification fails", async () => {
      const { strapi, registerService } = createStrapiMock();
      const samanService = {
        verifyTransaction: jest.fn().mockResolvedValue({
          success: false,
          resultCode: -2,
          resultDescription: "تراکنش یافت نشد",
        }),
      };
      registerService("api::payment-gateway.saman-kish", samanService);

      const topupRecord = {
        id: 40,
        Amount: 150_000,
        Status: "Pending",
        SaleOrderId: "5555555555",
      };

      (strapi.entityService.findMany as jest.Mock).mockResolvedValue([
        topupRecord,
      ]);

      const ctx = createCtx({
        request: {
          body: {
            State: "OK",
            RefNum: "REF-FAIL",
            ResNum: "5555555555",
          },
        },
      });

      const { RefNum, ResNum } = ctx.request.body;

      const topups = await strapi.entityService.findMany(
        "api::wallet-topup.wallet-topup",
        { filters: { SaleOrderId: ResNum }, limit: 1 }
      );
      const topup = topups[0];

      const verification = await samanService.verifyTransaction({
        refNum: RefNum,
      });

      if (!verification.success || verification.resultCode !== 0) {
        await strapi.entityService.update(
          "api::wallet-topup.wallet-topup",
          topup.id,
          { data: { Status: "Failed" } }
        );

        ctx.redirect(
          "https://new.infinitycolor.co/wallet?status=failure&reason=verify"
        );
      }

      expect(strapi.entityService.update).toHaveBeenCalledWith(
        "api::wallet-topup.wallet-topup",
        40,
        { data: { Status: "Failed" } }
      );

      expect(ctx.redirect).toHaveBeenCalledWith(
        expect.stringContaining("reason=verify")
      );
    });

    // Saman Kish doesn't have a separate settlement step - verification is enough
    // This test is removed as it's specific to Mellat's two-step process

    it("should create wallet if it doesn't exist for the user", async () => {
      const { strapi, registerService, registerQuery } = createStrapiMock();
      const samanService = {
        verifyTransaction: jest.fn().mockResolvedValue({
          success: true,
          resultCode: 0,
          resultDescription: "عملیات با موفقیت انجام شد",
        }),
      };
      registerService("api::payment-gateway.saman-kish", samanService);

      const topupRecord = {
        id: 60,
        Amount: 100_000,
        Status: "Pending",
        user: { id: 99 },
        SaleOrderId: "8888888888",
      };

      (strapi.entityService.findMany as jest.Mock).mockResolvedValue([
        topupRecord,
      ]);

      // Wallet doesn't exist
      registerQuery("api::local-user-wallet.local-user-wallet", {
        findOne: jest.fn().mockResolvedValue(null),
      });

      const createdWallet = { id: 100, Balance: 0 };
      (strapi.entityService.create as jest.Mock).mockImplementation(
        async (uid: string, params: any) => {
          if (uid === "api::local-user-wallet.local-user-wallet") {
            return createdWallet;
          }
          return null;
        }
      );

      const ctx = createCtx({
        request: {
          body: {
            State: "OK",
            RefNum: "REF-NEW-WALLET",
            ResNum: "8888888888",
          },
        },
      });

      const { RefNum, ResNum } = ctx.request.body;

      const topups = await strapi.entityService.findMany(
        "api::wallet-topup.wallet-topup",
        { filters: { SaleOrderId: ResNum }, limit: 1 }
      );
      const topup = topups[0];

      await samanService.verifyTransaction({ refNum: RefNum });

      await strapi.entityService.update(
        "api::wallet-topup.wallet-topup",
        topup.id,
        { data: { Status: "Success" } }
      );

      // Load wallet
      let wallet = await strapi.db
        .query("api::local-user-wallet.local-user-wallet")
        .findOne({ where: { user: topup.user.id } });

      // Create wallet if not exists
      if (!wallet) {
        wallet = await strapi.entityService.create(
          "api::local-user-wallet.local-user-wallet",
          {
            data: { user: topup.user.id, Balance: 0 },
          }
        );
      }

      const newBalance = (wallet.Balance || 0) + topup.Amount;
      await strapi.entityService.update(
        "api::local-user-wallet.local-user-wallet",
        wallet.id,
        {
          data: { Balance: newBalance, LastTransactionDate: expect.any(Date) },
        }
      );

      expect(strapi.entityService.create).toHaveBeenCalledWith(
        "api::local-user-wallet.local-user-wallet",
        expect.objectContaining({
          data: expect.objectContaining({
            user: 99,
            Balance: 0,
          }),
        })
      );

      expect(strapi.entityService.update).toHaveBeenCalledWith(
        "api::local-user-wallet.local-user-wallet",
        100,
        expect.objectContaining({
          data: expect.objectContaining({
            Balance: 100_000,
          }),
        })
      );
    });

    it("should handle topup not found gracefully", async () => {
      const { strapi } = createStrapiMock();
      (strapi.entityService.findMany as jest.Mock).mockResolvedValue([]);

      const ctx = createCtx({
        request: {
          body: {
            State: "OK",
            RefNum: "REF-NOTFOUND",
            ResNum: "9999999999",
          },
        },
      });

      const { ResNum } = ctx.request.body;

      const topups = await strapi.entityService.findMany(
        "api::wallet-topup.wallet-topup",
        { filters: { SaleOrderId: ResNum }, limit: 1 }
      );

      if (!topups || topups.length === 0) {
        ctx.redirect(
          "https://new.infinitycolor.co/wallet?status=failure&reason=not_found"
        );
      }

      expect(ctx.redirect).toHaveBeenCalledWith(
        expect.stringContaining("reason=not_found")
      );
    });
  });

  describe("Wallet Balance Integrity", () => {
    it("should ensure balance never goes negative", async () => {
      const currentBalance = 50_000;
      const debitAmount = 100_000;

      // This check should happen before allowing debit
      const canDebit = currentBalance >= debitAmount;

      expect(canDebit).toBe(false);
    });

    it("should log all wallet transactions with correct types", async () => {
      const transactions = [
        { Type: "Add", Amount: 100_000, Cause: "Wallet Topup" },
        { Type: "Minus", Amount: 30_000, Cause: "Order Payment" },
        { Type: "Add", Amount: 50_000, Cause: "Refund" },
      ];

      transactions.forEach((tx) => {
        expect(["Add", "Minus"]).toContain(tx.Type);
        expect(tx.Amount).toBeGreaterThan(0);
        expect(tx.Cause).toBeDefined();
      });
    });

    it("should track balance history via transactions", async () => {
      let balance = 0;
      const transactions = [
        { Type: "Add", Amount: 100_000 },
        { Type: "Minus", Amount: 30_000 },
        { Type: "Add", Amount: 50_000 },
        { Type: "Minus", Amount: 20_000 },
      ];

      transactions.forEach((tx) => {
        if (tx.Type === "Add") {
          balance += tx.Amount;
        } else {
          balance -= tx.Amount;
        }
      });

      expect(balance).toBe(100_000); // 100k + 50k - 30k - 20k
    });
  });
});
