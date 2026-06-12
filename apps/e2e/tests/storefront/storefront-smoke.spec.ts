import { expect, test } from "@playwright/test";
import {
  E2E_CATEGORY_SLUG,
  E2E_HEXLESS_COLOR_TITLE,
  E2E_PRODUCT_SLUG,
  E2E_PRODUCT_TITLE,
  E2E_UNAVAILABLE_COLOR_TITLE,
} from "../../fixtures/storefront";
import { expectImageLoaded, prepareStorefrontPage } from "../../helpers/page";

const seededCardSelector = `[data-testid="product-card"][data-product-slug="${E2E_PRODUCT_SLUG}"]`;
const visibleSeededCardSelector = `${seededCardSelector}:visible`;
const visibleSeededSmallCardSelector = `[data-testid="product-small-card"][data-product-slug="${E2E_PRODUCT_SLUG}"]:visible`;
const visibleSeededProductLinkSelector = `a[data-testid="product-card-link"][href$="/pdp/${E2E_PRODUCT_SLUG}"]:visible`;

test.describe("storefront smoke", () => {
  test("@smoke homepage renders seeded product sections without critical runtime errors", async ({
    page,
  }) => {
    const runtime = await prepareStorefrontPage(page);

    await page.goto("/");

    const cards = page.getByTestId("product-card");
    await expect(cards.first()).toBeAttached({ timeout: 30_000 });

    const firstVisibleCard = page.locator('[data-testid="product-card"]:visible').first();
    await firstVisibleCard.scrollIntoViewIfNeeded();
    await expect(firstVisibleCard).toBeVisible();

    const seededCard = page.locator(visibleSeededCardSelector).first();
    await seededCard.scrollIntoViewIfNeeded();
    await expect(seededCard).toBeVisible();

    const image = seededCard.locator("img").first();
    await expectImageLoaded(image);

    runtime.assertClean();
  });

  test("@smoke category PLP navigates to PDP and exposes variation states", async ({ page }) => {
    const runtime = await prepareStorefrontPage(page);

    await page.goto(`/plp/category/${E2E_CATEGORY_SLUG}`);

    const productLink = page.locator(visibleSeededProductLinkSelector).first();
    await expect(productLink).toBeVisible({ timeout: 30_000 });
    await productLink.click();

    await expect(page).toHaveURL(new RegExp(`/pdp/${E2E_PRODUCT_SLUG}`));
    await expect(page.getByTestId("pdp-hero")).toBeVisible();
    await expect(page.locator('[data-testid="pdp-product-title"]:visible').first()).toContainText(
      E2E_PRODUCT_TITLE,
    );

    const hexlessColor = page
      .getByTestId("pdp-color-option")
      .filter({ hasText: E2E_HEXLESS_COLOR_TITLE })
      .first();
    await expect(hexlessColor).toBeVisible();
    await expect(hexlessColor).toHaveAttribute("data-color-code", "");
    await hexlessColor.click();

    const unavailableColor = page
      .locator(`[data-testid="pdp-color-option"][data-color-title="${E2E_UNAVAILABLE_COLOR_TITLE}"]`)
      .first();
    await expect(unavailableColor).toBeDisabled();

    await expect(page.getByTestId("pdp-add-to-cart")).toBeEnabled();
    runtime.assertClean();
  });

  test("@smoke desktop full product card quick view opens and links to the PDP", async ({
    page,
  }) => {
    test.skip(
      test.info().project.name.includes("mobile"),
      "Full product-card quick view is desktop-only; mobile small-card quick view has a separate contract",
    );
    const runtime = await prepareStorefrontPage(page);

    await page.goto(`/plp/category/${E2E_CATEGORY_SLUG}`);

    const card = page.locator(visibleSeededCardSelector).last();
    await expect(card).toBeVisible({ timeout: 30_000 });
    await card.scrollIntoViewIfNeeded();
    await card.hover();
    const quickViewButton = card.getByTestId("product-card-quick-view");
    await expect(quickViewButton).toBeVisible();
    await quickViewButton.click();

    await expect(page.getByTestId("quick-view-content")).toBeVisible({ timeout: 30_000 });
    await expect(page.getByTestId("quick-view-content")).toContainText(E2E_PRODUCT_TITLE);
    await page.getByTestId("quick-view-full-details").click();

    await expect(page).toHaveURL(new RegExp(`/pdp/${E2E_PRODUCT_SLUG}`));
    runtime.assertClean();
  });

  test("@smoke mobile small product card quick view opens from the action menu", async ({
    page,
  }) => {
    test.skip(
      !test.info().project.name.includes("mobile"),
      "Small product-card quick view is a mobile contract",
    );
    const runtime = await prepareStorefrontPage(page);

    await page.goto(`/plp/category/${E2E_CATEGORY_SLUG}`);

    const smallCard = page.locator(visibleSeededSmallCardSelector).first();
    await expect(smallCard).toBeVisible({ timeout: 30_000 });
    await smallCard.scrollIntoViewIfNeeded();
    await smallCard.getByTestId("product-small-card-menu").click();
    await expect(smallCard.getByTestId("product-small-card-quick-view")).toBeVisible();
    await smallCard.getByTestId("product-small-card-quick-view").click();

    await expect(page.getByTestId("quick-view-content")).toBeVisible({ timeout: 30_000 });
    await expect(page.getByTestId("quick-view-content")).toContainText(E2E_PRODUCT_TITLE);
    await page.getByTestId("quick-view-close").click();
    await expect(page.getByTestId("quick-view-content")).toBeHidden();
    runtime.assertClean();
  });

  test("@smoke guest cart can add, update, persist, and remove the seeded product", async ({
    page,
  }) => {
    const runtime = await prepareStorefrontPage(page);

    await page.goto(`/pdp/${E2E_PRODUCT_SLUG}`, { waitUntil: "domcontentloaded" });

    await expect(page.getByTestId("pdp-cart-action")).toHaveAttribute("data-cart-ready", "true", {
      timeout: 30_000,
    });
    await expect(page.getByTestId("pdp-add-to-cart")).toBeEnabled({ timeout: 30_000 });
    await page.getByTestId("pdp-add-to-cart").click();
    await expect
      .poll(() =>
        page.evaluate((title) => {
          const cart = JSON.parse(localStorage.getItem("cart") || "[]") as Array<{
            name?: string;
            quantity?: number;
          }>;
          return cart.find((item) => item.name === title)?.quantity ?? 0;
        }, E2E_PRODUCT_TITLE),
      )
      .toBe(1);

    await page.goto("/cart");
    const cartItem = page
      .locator('[data-testid="cart-item"]:visible')
      .filter({ hasText: E2E_PRODUCT_TITLE })
      .first();
    await expect(cartItem).toBeVisible({ timeout: 15_000 });

    await cartItem.getByTestId("cart-quantity-increase").click();
    await expect
      .poll(() => page.evaluate(() => JSON.parse(localStorage.getItem("cart") || "[]")[0]?.quantity))
      .toBe(2);

    await page.reload();
    await expect(
      page.locator('[data-testid="cart-item"]:visible').filter({ hasText: E2E_PRODUCT_TITLE }).first(),
    ).toBeVisible();

    await page
      .locator('[data-testid="cart-item"]:visible')
      .filter({ hasText: E2E_PRODUCT_TITLE })
      .first()
      .getByTestId("cart-item-remove")
      .click();
    await expect
      .poll(() => page.evaluate(() => JSON.parse(localStorage.getItem("cart") || "[]").length))
      .toBe(0);

    runtime.assertClean();
  });

  test("@smoke guest checkout redirects to auth with checkout return path", async ({
    page,
  }) => {
    await page.goto("/checkout", { waitUntil: "domcontentloaded" });

    await expect(page).toHaveURL(/\/auth\?(?:.*&)?redirect=(?:\/checkout|%2Fcheckout)/);
  });
});
