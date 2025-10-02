# SnappPay Testing Guide

This guide explains how to test different SnappPay payment scenarios.

## Prerequisites

1. Backend server running on `http://localhost:1337`
2. SnappPay staging credentials configured in `.env`
3. Database access to find payment tokens
4. Node.js installed for running test scripts

## Finding Payment Tokens

Payment tokens are required for testing cancel, revert, and status operations.

### Method 1: SQL Query

Run the SQL script to find tokens:

```bash
# In your database client (PostgreSQL, MySQL, etc.)
psql -d your_database -f scripts/find-snappay-tokens.sql
```

Or manually query:

```sql
SELECT
  TrackId as payment_token,
  external_id as transaction_id,
  Status,
  createdAt
FROM contract_transactions
WHERE external_source = 'SnappPay'
ORDER BY createdAt DESC
LIMIT 10;
```

### Method 2: Strapi Admin Panel

1. Go to Content Manager → Contract Transactions
2. Filter by `external_source = "SnappPay"`
3. Copy the `TrackId` field (this is your paymentToken)

## Testing Scenarios

### 1. **Status Inquiry** (Safe - No Changes)

Check the current status of any transaction.

**When to use**: At any time, for any transaction

**Command**:
```bash
node scripts/test-snappay-status.js <paymentToken>
```

**Example**:
```bash
node scripts/test-snappay-status.js "snp_pay_token_abc123xyz"
```

**Expected Response**:
```json
{
  "success": true,
  "result": {
    "successful": true,
    "response": {
      "status": "SETTLED",
      "transactionId": "O12345ABC"
    }
  }
}
```

**Possible Status Values**:
- `PENDING`: Payment initiated but not completed
- `VERIFIED`: Payment verified but not settled
- `SETTLED`: Payment completed successfully
- `CANCELLED`: Payment cancelled
- `REVERTED`: Payment reverted before settlement

---

### 2. **Revert** (Before Settlement)

Cancel a payment **before** it has been settled. Returns money to customer.

**When to use**:
- Payment was verified (state=OK) but service cannot be provided
- Out of stock after payment
- Before calling `settle()`

**Prerequisites**:
- Transaction must be in `VERIFIED` status (not yet settled)
- Order status should be `Pending` or `Payment`

**Command**:
```bash
node scripts/test-snappay-revert.js <paymentToken>
```

**Expected Behavior**:
- Funds returned to customer
- Order status → `Cancelled`
- Transaction cannot be settled later

**Test Manually**:
1. Start a real payment flow (checkout with SnappPay)
2. Complete payment in SnappPay gateway
3. **Before** the callback completes, note the paymentToken
4. Run the revert script

**Note**: In production, revert is automatically called when callback receives `state=FAILED`

---

### 3. **Cancel** (After Settlement)

Cancel a payment **after** it has been settled.

**When to use**:
- Order needs to be cancelled after successful payment
- Customer requests refund
- Transaction is in `SETTLED` status

**Prerequisites**:
- Transaction must be in `SETTLED` status
- Order status should be `Started`, `Shipment`, or `Done`

**Command**:
```bash
node scripts/test-snappay-cancel.js <paymentToken>
```

**Expected Behavior**:
- Installment plan cancelled
- Refund initiated (may take time to process)
- Order can be marked as cancelled

**How to Test**:

**Option A: Using Real Transaction**
1. Complete a full purchase with SnappPay
2. Wait for settlement (check status = `SETTLED`)
3. Get paymentToken from database
4. Run cancel script

**Option B: Using Test Transaction**
```bash
# 1. Create a test payment
curl -X POST http://localhost:1337/api/payment-gateway/test-snappay \
  -H "Content-Type: application/json" \
  -d '{
    "amountIRR": 50000,
    "mobile": "+989121234567"
  }'

# 2. Complete the payment in SnappPay gateway
# 3. Wait for settlement
# 4. Use the paymentToken to test cancel
```

---

### 4. **Update** (After Settlement)

Modify cart items or reduce amount after settlement.

**When to use**:
- Partial return/refund (one or more items returned, but not all)
- Order amount needs to be reduced after settlement
- Customer returns specific items from order

**Prerequisites**:
- Transaction must be in `SETTLED` status
- New amount must be LESS than original (cannot increase)
- All removed items must be excluded from cartItems

**Command**:
```bash
# You need to prepare the updated cart structure first
# See scripts/test-snappay-update.js for example

curl -X POST http://localhost:1337/api/payment-gateway/test-snappay-update \
  -H "Content-Type: application/json" \
  -d '{
    "paymentToken": "YOUR_TOKEN",
    "updatedCart": {
      "amount": 30000,
      "discountAmount": 0,
      "externalSourceAmount": 0,
      "mobile": "+989121234567",
      "paymentMethodTypeDto": "INSTALLMENT",
      "returnURL": "https://api.infinitycolor.co/api/orders/payment-callback",
      "transactionId": "U12345ABC",
      "cartList": [{
        "cartId": 123,
        "cartItems": [
          {
            "amount": 30000,
            "category": "پوشاک",
            "count": 1,
            "id": 1,
            "name": "Remaining Item",
            "commissionType": 100
          }
        ],
        "isShipmentIncluded": true,
        "isTaxIncluded": true,
        "shippingAmount": 0,
        "taxAmount": 3000,
        "totalAmount": 33000
      }]
    }
  }'
```

**Expected Behavior**:
- Installment plan updated with new reduced amount
- Customer refunded for returned items
- Order updated to reflect remaining items

**Important Notes**:
- updatedCart structure must match original token request format
- Amount can only be REDUCED, not increased
- Removed items must not appear in cartItems array
- See `docs/snappay-full-test-guide-fa.md` for detailed Persian guide

---

## Testing Revert via Callback

To test automatic revert when payment fails:

### Method 1: Force Failure in Callback Handler

Temporarily modify `payment.ts` around line 169:

```typescript
// Original
if (String(state || "OK").toUpperCase() !== "OK") {

// Test revert by forcing failure
if (true) {  // Always trigger revert
```

Then complete a real payment. The callback will automatically revert.

**Remember to revert this change after testing!**

### Method 2: Simulate Failed Callback

Use a tool like Postman to send a failed callback:

```bash
POST http://localhost:1337/api/orders/payment-callback
Content-Type: application/x-www-form-urlencoded

state=FAILED&transactionId=O12345ABC&paymentToken=snp_pay_token_xyz
```

---

## Direct API Testing (Without Scripts)

You can also test directly using curl or Postman:

### Status
```bash
curl -X POST http://localhost:1337/api/payment-gateway/test-snappay-status \
  -H "Content-Type: application/json" \
  -d '{"paymentToken": "your_token_here"}'
```

### Revert
```bash
curl -X POST http://localhost:1337/api/payment-gateway/test-snappay-revert \
  -H "Content-Type: application/json" \
  -d '{"paymentToken": "your_token_here"}'
```

### Cancel
```bash
curl -X POST http://localhost:1337/api/payment-gateway/test-snappay-cancel \
  -H "Content-Type: application/json" \
  -d '{"paymentToken": "your_token_here"}'
```

---

## Transaction States Flow

```
PENDING → VERIFIED → SETTLED → (optional) CANCELLED
         ↓
      REVERTED
```

- **PENDING**: Payment token created, user not yet completed payment
- **VERIFIED**: User completed payment, not yet settled by merchant
- **SETTLED**: Payment fully processed, order started
- **REVERTED**: Cancelled before settlement (funds returned immediately)
- **CANCELLED**: Cancelled after settlement (refund process initiated)

---

## Common Issues

### Error: "Invalid payment token"
- Token has expired or doesn't exist
- Check `contract_transactions` table for valid token

### Error: "Cannot revert settled transaction"
- Transaction is already settled
- Use `cancel()` instead of `revert()`

### Error: "Cannot cancel pending transaction"
- Transaction not yet settled
- Use `revert()` instead of `cancel()`

### Error: "Transaction not found"
- paymentToken incorrect
- Check database for exact TrackId value

---

## Production Considerations

1. **Disable test endpoints in production**:
   - Add authentication middleware
   - Or remove test routes entirely

2. **Implement order cancellation UI**:
   - Admin panel to cancel orders
   - Automatically call `snappay.cancel()` for SnappPay orders

3. **Monitor transaction states**:
   - Set up alerts for stuck transactions
   - Regular status checks for pending payments

4. **Refund workflow**:
   - Track refund requests separately
   - Update order logs when cancel is called
   - Notify customer of refund status

---

## Logging

All SnappPay operations are logged. Check logs at:
- Backend console output
- Strapi admin → Settings → Logs (if configured)

Example log entries:
```
[INFO] SnappPay cancel request: { paymentToken: "..." }
[INFO] SnappPay cancel result: { successful: true, ... }
```
