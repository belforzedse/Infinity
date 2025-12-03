# Wallet Service Migration: Mellat v3 → Saman Kish

**Date**: December 2, 2025  
**Status**: ✅ Complete  
**Impact**: Wallet top-up payment gateway

---

## Summary

The wallet top-up service has been migrated from **Mellat Bank v3** payment gateway to **Saman Kish (SEP)** payment gateway. This change affects how users add funds to their in-app wallet.

## Changes Made

### 1. Backend Controller Updates

**File**: `backend/src/api/wallet-topup/controllers/wallet-topup.ts`

#### Charge Intent Handler
- **Changed**: Payment service from `mellat-v3` to `saman-kish`
- **Updated**: Request payload to match Saman Kish API:
  - Added `resNum` parameter (our sale order ID for tracking)
  - Removed Mellat-specific parameters (`userId`)
- **Updated**: Response handling to use `token` instead of `refId`

```typescript
// Before (Mellat v3)
const paymentService = strapi.service("api::payment-gateway.mellat-v3");
const response = await paymentService.requestPayment({
  orderId: Number(saleOrderId),
  amount: Math.round(amountIrr),
  userId: pluginUserId,
  callbackURL,
});

// After (Saman Kish)
const paymentService = strapi.service("api::payment-gateway.saman-kish");
const response = await paymentService.requestPayment({
  orderId: Number(saleOrderId),
  amount: Math.round(amountIrr),
  callbackURL,
  resNum: saleOrderId,
});
```

#### Payment Callback Handler
- **Changed**: Callback parameter parsing from Mellat format to Saman Kish format:
  - Mellat: `{ ResCode, SaleOrderId, SaleReferenceId }`
  - Saman Kish: `{ State, RefNum, ResNum }`
- **Updated**: State validation to check for `State === "OK"` instead of `ResCode === "0"`
- **Removed**: Settlement step (Saman Kish uses single-step verification)
- **Updated**: Error handling to use Saman Kish state descriptions

```typescript
// Before (Mellat v3)
const { ResCode, SaleOrderId, SaleReferenceId } = ctx.request.body;
if (String(ResCode) !== "0") {
  // Mark as failed
}

// After (Saman Kish)
const { State, RefNum, ResNum } = ctx.request.body;
const stateNormalized = String(State || "").replace(/\s+/g, "").toUpperCase();
if (stateNormalized !== "OK") {
  // Mark as failed with state description
}
```

#### Verification Process
- **Before**: Two-step process (verify + settle)
- **After**: Single-step verification

```typescript
// Before (Mellat v3)
const verification = await paymentService.verifyTransaction({...});
const settlement = await paymentService.settleTransaction({...});

// After (Saman Kish)
const verification = await paymentService.verifyTransaction({
  refNum: String(RefNum),
});
// No settlement step needed
```

### 2. Test File Updates

**File**: `backend/src/api/wallet-topup/__tests__/wallet-topup.spec.ts`

All test cases updated to reflect Saman Kish integration:
- Service mocks changed from `mellat-v3` to `saman-kish`
- Callback parameters updated to Saman format
- Verification responses updated to include `resultCode` field
- Settlement test removed (not applicable to Saman Kish)
- Error handling tests updated for state-based validation

### 3. Documentation Updates

**File**: `.cursor/rules/wallet-flows.mdc`

- Updated service references from Mellat to Saman Kish
- Added comprehensive backend flow documentation
- Added Saman Kish environment variables section
- Documented single-step verification process

---

## API Differences: Mellat v3 vs Saman Kish

| Aspect | Mellat v3 | Saman Kish |
|--------|-----------|------------|
| **Service Name** | `api::payment-gateway.mellat-v3` | `api::payment-gateway.saman-kish` |
| **Token Request** | Returns `refId` | Returns `token` and `resNum` |
| **Callback Parameters** | `ResCode`, `SaleOrderId`, `SaleReferenceId` | `State`, `RefNum`, `ResNum` |
| **Success Check** | `ResCode === "0"` | `State === "OK"` |
| **Verification** | Two-step (verify + settle) | Single-step (verify only) |
| **Result Code** | Numeric response code | `resultCode` with descriptive messages |
| **Error Messages** | Code-based | State-based (OK, CANCELEDBYUSER, FAILED, etc.) |

---

## Environment Variables

### Required for Saman Kish

Add these to your `.env` file:

```bash
# Saman Kish (SEP) Payment Gateway
SAMAN_GATEWAY_URL=https://sep.shaparak.ir/onlinepg/onlinepg
SAMAN_PAYMENT_PAGE_URL=https://sep.shaparak.ir/OnlinePG/OnlinePG
SAMAN_SEND_TOKEN_URL=https://sep.shaparak.ir/OnlinePG/SendToken
SAMAN_VERIFY_URL=https://sep.shaparak.ir/verifyTxnRandomSessionkey/ipg/VerifyTransaction
SAMAN_REVERSE_URL=https://sep.shaparak.ir/verifyTxnRandomSessionkey/ipg/ReverseTransaction

# Required credentials
SAMAN_TERMINAL_ID=your-terminal-id
SAMAN_USERNAME=your-username  # Optional
SAMAN_PASSWORD=your-password  # Optional

# Callback configuration
SAMAN_CALLBACK_URL=https://api.infinitycolor.org/api/wallet/payment-callback
SAMAN_TOKEN_EXPIRY_MIN=20
```

### Removed (Mellat-specific)

The following environment variables are no longer needed for wallet top-ups (but may still be used for order payments if Mellat is still active):

```bash
MELLAT_TERMINAL_ID
MELLAT_USERNAME
MELLAT_PASSWORD
MELLAT_GATEWAY_URL
MELLAT_PAYMENT_URL
```

---

## Frontend Compatibility

### No Changes Required

The frontend wallet service (`frontend/src/services/wallet/index.ts`) does **NOT** require any changes because:

1. The API contract remains the same:
   - Request: `POST /wallet/charge-intent` with `{ amount }`
   - Response: `{ success, redirectUrl, refId, saleOrderId }`

2. The callback flow remains transparent to the frontend:
   - User is redirected to payment gateway
   - Gateway POSTs to backend callback
   - User is redirected back to frontend with status

3. Frontend only checks query parameters:
   - `?status=success` - Payment successful
   - `?status=failure&reason=...` - Payment failed

---

## Payment Flow Comparison

### Mellat v3 Flow (Before)

```
1. Frontend: POST /wallet/charge-intent → Backend
2. Backend: Create wallet-topup record (Status: Pending)
3. Backend: Call Mellat requestPayment() → Get refId
4. Backend: Return redirectUrl to frontend
5. User: Redirected to Mellat payment page
6. User: Completes payment
7. Mellat: POST callback to /wallet/payment-callback
   - Body: { ResCode, SaleOrderId, SaleReferenceId }
8. Backend: Check ResCode === "0"
9. Backend: Call Mellat verifyTransaction()
10. Backend: Call Mellat settleTransaction()
11. Backend: Update wallet balance
12. Backend: Redirect user to frontend
```

### Saman Kish Flow (After)

```
1. Frontend: POST /wallet/charge-intent → Backend
2. Backend: Create wallet-topup record (Status: Pending)
3. Backend: Call Saman requestPayment() → Get token
4. Backend: Return redirectUrl to frontend
5. User: Redirected to Saman payment page
6. User: Completes payment
7. Saman: POST callback to /wallet/payment-callback
   - Body: { State, RefNum, ResNum }
8. Backend: Check State === "OK"
9. Backend: Call Saman verifyTransaction()
   - No settlement step needed (single-step)
10. Backend: Update wallet balance
11. Backend: Redirect user to frontend
```

**Key Difference**: Saman Kish uses single-step verification (no separate settlement), making the flow simpler and faster.

---

## Testing

### Unit Tests

All test cases have been updated in `wallet-topup.spec.ts`:

```bash
cd backend
npm test -- wallet-topup.spec.ts
```

**Test Coverage**:
- ✅ Charge intent with valid amount
- ✅ Charge intent with invalid amount
- ✅ Charge intent without authentication
- ✅ Payment gateway errors
- ✅ Successful callback flow
- ✅ User cancellation (State: CANCELEDBYUSER)
- ✅ Verification failure
- ✅ Wallet creation for new users
- ✅ Topup not found
- ✅ Balance integrity checks
- ✅ Transaction logging

### Manual Testing

1. **Test Charge Intent**:
```bash
curl -X POST http://localhost:1337/api/wallet/charge-intent \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"amount": 100000}'
```

Expected response:
```json
{
  "data": {
    "success": true,
    "redirectUrl": "https://sep.shaparak.ir/OnlinePG/SendToken?token=...",
    "refId": "TOKEN-...",
    "saleOrderId": "1733158923123456"
  }
}
```

2. **Test Callback** (simulate Saman POST):
```bash
curl -X POST http://localhost:1337/api/wallet/payment-callback \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "State=OK&RefNum=123456789&ResNum=1733158923123456"
```

Expected: Redirect to `https://infinitycolor.org/wallet?status=success`

---

## Rollback Plan

If issues arise with Saman Kish integration:

1. **Revert controller changes**:
```bash
git revert <commit-hash>
```

2. **Restore Mellat v3 service reference**:
```typescript
const paymentService = strapi.service("api::payment-gateway.mellat-v3");
```

3. **Update callback handler** to parse Mellat parameters again

4. **Restore environment variables** for Mellat

---

## Migration Checklist

- [x] Update wallet-topup controller charge intent
- [x] Update wallet-topup controller callback handler
- [x] Remove Mellat settlement step
- [x] Update test cases for Saman Kish
- [x] Update documentation (wallet-flows.mdc)
- [x] Add Saman Kish environment variables to .env.example
- [ ] Deploy to staging environment
- [ ] Test end-to-end wallet top-up flow
- [ ] Verify callback handling with real Saman Kish gateway
- [ ] Monitor error logs for 24 hours
- [ ] Deploy to production

---

## Known Issues & Considerations

### 1. Token vs RefId
- Saman returns `token` field, but we store it in `RefId` column for consistency
- Frontend still receives it as `refId` in the response

### 2. Cell Number Normalization
- Saman Kish service has built-in phone number normalization
- Supports formats: `0912...`, `912...`, `98912...`, `00989...`

### 3. Token Expiry
- Default: 20 minutes (`SAMAN_TOKEN_EXPIRY_MIN=20`)
- User must complete payment within this window

### 4. State Messages
Saman Kish provides descriptive state messages in Persian:
- `OK`: "پرداخت با موفقیت انجام شد"
- `CANCELEDBYUSER`: "کاربر از ادامه تراکنش منصرف شد"
- `FAILED`: "پرداخت انجام نشد"
- `SESSIONISNULL`: "کاربر در بازه زمانی تعیین شده پاسخی ارسال نکرده است"

### 5. Idempotency
- Callback handler includes idempotency check
- If topup status is already "Success", callback is skipped
- Prevents duplicate balance updates

---

## Support & Troubleshooting

### Common Issues

**Issue**: Token request fails
- **Check**: `SAMAN_TERMINAL_ID` is correctly configured
- **Check**: Server URL is accessible from Saman's network
- **Check**: Callback URL is absolute and includes `/api` prefix

**Issue**: Callback never received
- **Check**: Callback URL is correct in .env
- **Check**: Server is publicly accessible (not localhost)
- **Check**: Firewall allows POST requests from Saman's IPs

**Issue**: Verification fails with resultCode -2
- **Cause**: "تراکنش یافت نشد" (Transaction not found)
- **Fix**: Ensure RefNum from callback is passed correctly

---

## Related Files

**Backend**:
- `src/api/wallet-topup/controllers/wallet-topup.ts`
- `src/api/wallet-topup/__tests__/wallet-topup.spec.ts`
- `src/api/payment-gateway/services/saman-kish.ts`

**Frontend** (no changes required):
- `src/services/wallet/index.ts`
- `src/components/User/Wallet/IncreaseBalance.tsx`

**Documentation**:
- `.cursor/rules/wallet-flows.mdc`
- `backend/docs/wallet-saman-kish-migration.md` (this file)

---

## References

- Saman Kish (SEP) API Documentation: https://sep.shaparak.ir
- Mellat Bank v3 Integration (legacy): Internal docs
- Wallet Service Implementation: `.cursor/rules/wallet-flows.mdc`
- Payment Gateway Abstraction: `backend/src/api/payment-gateway/services/`

