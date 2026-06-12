import { expect, test } from "@playwright/test";
import { authStorageStatePath } from "../../helpers/auth";
import { prepareStorefrontPage } from "../../helpers/page";

test.describe("authenticated checkout smoke", () => {
  test.use({ storageState: authStorageStatePath("customer") });

  test("@smoke authenticated checkout shows validation before payment", async ({ page }) => {
    test.skip(
      test.info().project.name.includes("mobile"),
      "Authenticated checkout validation is desktop-only in Phase 1.5",
    );
    const runtime = await prepareStorefrontPage(page);

    await page.goto("/checkout", { waitUntil: "domcontentloaded" });
    await expect(page).toHaveURL(/\/checkout/);
    await expect(page.getByTestId("checkout-auth-gate")).toHaveCount(0);
    await expect(page.getByTestId("checkout-submit")).toBeVisible({ timeout: 30_000 });

    await page.getByTestId("checkout-submit").click();

    const validationError = page.getByTestId("checkout-form-error");
    await expect(validationError).toBeVisible();
    await expect(validationError).toHaveText(/\S+/);
    await expect(page).toHaveURL(/\/checkout/);
    await expect.poll(() => page.evaluate(() => localStorage.getItem("pendingOrderId"))).toBeNull();

    runtime.assertClean();
  });
});
