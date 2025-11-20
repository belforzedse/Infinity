/**
 * local-user-wallet service
 */

import { factories } from '@strapi/strapi';
import type { Strapi } from "@strapi/strapi";

/**
 * Atomically deduct amount from wallet balance with race condition protection
 * Uses raw SQL UPDATE with WHERE clause to ensure balance doesn't go negative
 * @returns {Promise<{success: boolean, newBalance?: number, error?: string, walletId?: number}>}
 */
export async function deductWalletBalanceAtomic(
  strapi: Strapi,
  userId: number,
  amountIrr: number
): Promise<{ success: boolean; newBalance?: number; error?: string; walletId?: number }> {
  try {
    const amount = Number(amountIrr);
    if (amount <= 0) {
      return { success: false, error: "Deduct amount must be positive" };
    }

    // First, get wallet ID for the user
    const wallet = await strapi.db
      .query("api::local-user-wallet.local-user-wallet")
      .findOne({ where: { user: userId }, select: ["id"] });

    if (!wallet) {
      return { success: false, error: "Wallet not found for user" };
    }

    // Use raw SQL for atomic deduction with balance validation
    // Note: Strapi converts camelCase to snake_case for database columns
    // So "Balance" becomes "balance" and "LastTransactionDate" becomes "last_transaction_date"
    const result = await strapi.db.connection.raw(
      `UPDATE local_user_wallets
       SET balance = balance - ?,
           last_transaction_date = NOW()
       WHERE id = ? AND balance >= ?
       RETURNING balance, id`,
      [amount, wallet.id, amount]
    );

    // Check if any rows were updated
    const rows = result.rows || [];
    if (rows.length === 0) {
      // No rows updated means insufficient balance
      const currentWallet = await strapi.entityService.findOne(
        "api::local-user-wallet.local-user-wallet",
        wallet.id
      );

      return {
        success: false,
        error: `Insufficient balance: requested ${amount} IRR, available ${currentWallet?.Balance || 0} IRR`,
        walletId: wallet.id
      };
    }

    return {
      success: true,
      newBalance: rows[0].balance,
      walletId: rows[0].id
    };
  } catch (error) {
    strapi.log.error("Failed to deduct wallet balance atomically", {
      userId,
      amountIrr,
      error: (error as Error).message,
    });
    return {
      success: false,
      error: `Database error: ${(error as Error).message}`,
    };
  }
}

export default factories.createCoreService('api::local-user-wallet.local-user-wallet');
