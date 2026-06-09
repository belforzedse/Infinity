// Contract-transaction changes (created on payment success, refunds, etc.) are NOT admin edits.
// They previously bumped the parent order's `updated_at` via `touchOrderByContract`, which
// corrupted the "last edited by admin" ordering. That side effect has been removed; admin edits
// are tracked exclusively through the gated audit log (see utils/adminAudit.ts).
export default {};
