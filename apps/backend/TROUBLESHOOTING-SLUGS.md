# Troubleshooting Product Slugs

## Issue 1: "No permissions to see this field" in Strapi Admin

This is a known issue with `uid` fields in Strapi v4. The field is not actually private, but the admin panel may show this message.

### ✅ FIXED: Added `unique: true` constraint

The schema has been updated to include `unique: true` which may help with visibility. However, this is primarily a Strapi admin UI limitation.

### Solutions:

1. **Field Works in API**: The Slug field works perfectly in the API even if it doesn't show in admin. This is just a UI limitation.

2. **Check Admin Panel Permissions**:
   - Go to **Settings** → **Users & Permissions Plugin** → **Roles**
   - Select your role (e.g., "Superadmin" or "Store manager")
   - Under **Product** permissions, ensure:
     - ✅ `find` is enabled
     - ✅ `findOne` is enabled
     - ✅ `create` is enabled
     - ✅ `update` is enabled

3. **Workarounds**:
   - **Use Migration**: Run `npm run strapi db:migrate` to generate slugs for all products
   - **Use API**: Slugs can be set/updated via API calls
   - **Auto-Generation**: New products will auto-generate slugs via lifecycle hooks
   - **View via API**: Check slugs using the test script: `node scripts/test-product-slug-endpoint.js [id]`

4. **Note**: The field functionality is not affected - this is purely a visual issue in the admin panel.

## Issue 2: Product Not Found ("یافت نشد")

### Possible Causes:

1. **Product doesn't exist**: Product ID 73 might not exist
2. **Product is trashed**: Product might have `removedAt` set
3. **Migration hasn't run**: Product might not have a slug yet
4. **Backend endpoint issue**: The `findBySlug` endpoint might have an issue

### ✅ FIXED: Added Better Error Logging

The `findBySlug` controller now logs detailed information about lookup attempts, making debugging easier.

### How to Check:

1. **Test the endpoint directly**:
   ```bash
   cd backend
   node scripts/test-product-slug-endpoint.js 73
   ```
   This will show you exactly what's happening with the product lookup.

2. **Check if product exists**:
   ```bash
   # Via API
   curl http://localhost:1337/api/products/73
   ```

3. **Check if product is trashed**:
   - Look for `removedAt` field in the response
   - If it's not null, the product is trashed

4. **Check if migration ran**:
   ```bash
   cd backend
   npm run strapi db:migrate
   ```

5. **Check backend logs**:
   - Look for `[Product.findBySlug]` log messages
   - The controller now logs:
     - When a lookup starts
     - When slug lookup fails
     - When ID fallback is attempted
     - When product is found or not found

### Solution:

1. **Run the migration** (if not already done):
   ```bash
   cd backend
   npm run strapi db:migrate
   ```

2. **Verify product exists**:
   - Check Strapi admin panel
   - Or use the API: `GET /api/products/73`

3. **Check backend endpoint**:
   - Test: `GET /api/products/by-slug/73`
   - Should return the product even if it doesn't have a slug (ID fallback)

## Issue 3: Empty Homepage/PLP

### Possible Causes:

1. **Slug field not being fetched**: API queries might not include Slug field
2. **Products filtered out**: Products might be filtered incorrectly
3. **No products in database**: Database might be empty

### Solution:

1. **Verify API queries include Slug**:
   - Check `frontend/src/services/product/homepage.ts`
   - Check `frontend/src/app/(product)/plp/page.tsx`
   - Both should have `fields[1]=Slug` in queries

2. **Check product filters**:
   - Ensure `filters[Status][$eq]=Active`
   - Ensure `filters[removedAt][$null]=true`
   - Check stock filters aren't too restrictive

3. **Check database**:
   - Verify products exist in Strapi admin
   - Check if products have `Status = Active`
   - Check if products have `removedAt = null`

## Quick Diagnostic Steps

1. **Check migration status**:
   ```bash
   cd backend
   npm run strapi db:migrate:status
   ```

2. **Manually check a product**:
   ```bash
   # Via API
   curl http://localhost:1337/api/products/73
   ```

3. **Test slug endpoint**:
   ```bash
   # Should work even without slug (ID fallback)
   curl http://localhost:1337/api/products/by-slug/73
   ```

4. **Check Strapi admin**:
   - Go to Content Manager → Products
   - Find product ID 73
   - Check if it has a Slug field value
   - Check if `removedAt` is null
   - Check if `Status` is "Active"

## Common Fixes

### Fix 1: Make Slug Field Visible in Admin

If the Slug field doesn't show in admin, you can still:
- Use the API to set slugs
- Run the migration script
- The field works in the API even if hidden in admin

### Fix 2: Ensure Migration Ran

```bash
cd backend
npm run strapi db:migrate
```

This will generate slugs for all products without one.

### Fix 3: Verify Product Status

Make sure:
- Product `Status` = "Active"
- Product `removedAt` = null
- Product has at least one variation with stock

### Fix 4: Check Backend Logs

Look for errors in:
- Strapi console output
- `findBySlug` controller logs
- Database connection issues

## Still Having Issues?

1. Check backend logs for specific errors
2. Verify database connection
3. Test the API endpoints directly
4. Check if products exist and are active
5. Verify migration completed successfully


