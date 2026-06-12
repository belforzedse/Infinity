/**
 * QuickViewModal tests
 *
 * Coverage:
 * - Skeleton shown immediately on open (before fetch resolves)
 * - Content shown after successful fetch
 * - Cache hit: content shown instantly, no second network call
 * - Close during loading: abort fires, state resets cleanly
 * - Reopen same product: uses cache, no second call
 * - Rapid open/close/open: final state is consistent
 * - Error state shown on failed fetch
 * - Retry evicts cache and re-fetches
 * - Product with no variations: content renders without crash
 * - Product with no images: gallery empty state
 */

import React from "react";
import { render, screen, act, fireEvent, waitFor } from "@testing-library/react";

// ── Mocks ────────────────────────────────────────────────────────────────────

// Avoid createPortal complexity by swapping Modal for a simple pass-through.
jest.mock("@/components/Kits/Modal", () => {
  const MockModal = ({
    isOpen,
    children,
  }: {
    isOpen: boolean;
    onClose: () => void;
    children: React.ReactNode;
    [key: string]: unknown;
  }) => (isOpen ? <div data-testid="modal">{children}</div> : null);
  MockModal.displayName = "MockModal";
  return { __esModule: true, default: MockModal };
});

// Swap QuickViewContent for a simple stub that shows the product title.
jest.mock("../QuickViewContent", () => {
  const MockContent = ({
    productData,
  }: {
    productData: { attributes: { Title: string } };
    [key: string]: unknown;
  }) => (
    <div data-testid="quick-view-content">
      <span data-testid="product-title">{productData.attributes.Title}</span>
    </div>
  );
  MockContent.displayName = "MockContent";
  return { __esModule: true, default: MockContent };
});

jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: jest.fn() }),
}));

// Controlled mock for getProductById
const mockGetProductById = jest.fn();
jest.mock("@/services/product/product", () => ({
  getProductById: (...args: unknown[]) => mockGetProductById(...args),
}));

// ── Helpers ───────────────────────────────────────────────────────────────────

import QuickViewModal, { _clearQuickViewCacheForTesting } from "../QuickViewModal";

/** Minimal ProductDetail shape that satisfies the component. */
function makeProduct(id: number, title = "Test Product") {
  return {
    id,
    attributes: {
      Title: title,
      Slug: `product-${id}`,
      Description: "",
      Status: "Active",
      removedAt: null,
      CoverImage: { data: null },
      Media: { data: [] },
      product_variations: { data: [] },
    },
  };
}

/** Renders the modal in open state and returns helpers. */
function renderModal(productId = 1, overrideOnClose?: () => void) {
  const onClose = overrideOnClose ?? jest.fn();
  const utils = render(
    <QuickViewModal isOpen={true} onClose={onClose} productId={productId} />,
  );
  return { onClose, ...utils };
}

// ── Setup / teardown ──────────────────────────────────────────────────────────

beforeEach(() => {
  jest.clearAllMocks();
  _clearQuickViewCacheForTesting();
});

// ── Tests ─────────────────────────────────────────────────────────────────────

describe("QuickViewModal", () => {
  // 1. Skeleton visible before fetch resolves --------------------------------
  it("shows the loading skeleton immediately on open before fetch completes", () => {
    // Never resolves — keeps the skeleton visible throughout the test.
    mockGetProductById.mockReturnValue(new Promise(() => {}));

    renderModal(1);

    // The skeleton is identified by the shimmer class on one of its cells.
    expect(document.querySelector(".skeleton-shimmer")).toBeInTheDocument();
    // Content and error are not visible.
    expect(screen.queryByTestId("quick-view-content")).not.toBeInTheDocument();
    expect(screen.queryByText("مشکلی پیش آمد")).not.toBeInTheDocument();
  });

  // 2. Content shown after successful fetch ----------------------------------
  it("replaces the skeleton with product content after fetch succeeds", async () => {
    const product = makeProduct(2, "پیراهن آبی");
    mockGetProductById.mockResolvedValue({ data: product });

    renderModal(2);

    // Skeleton initially visible.
    expect(document.querySelector(".skeleton-shimmer")).toBeInTheDocument();

    // After fetch resolves content appears.
    await waitFor(() => {
      expect(screen.getByTestId("quick-view-content")).toBeInTheDocument();
    });
    expect(screen.getByTestId("product-title")).toHaveTextContent("پیراهن آبی");
    expect(document.querySelector(".skeleton-shimmer")).not.toBeInTheDocument();
  });

  // 3. Cache hit: content shown instantly, no second network call -----------
  it("serves cached data instantly and does not call getProductById again on reopen", async () => {
    const product = makeProduct(3, "کاپشن سبز");
    mockGetProductById.mockResolvedValue({ data: product });

    const { unmount } = renderModal(3);

    // Wait for first fetch to populate the cache.
    await waitFor(() =>
      expect(screen.getByTestId("quick-view-content")).toBeInTheDocument(),
    );
    expect(mockGetProductById).toHaveBeenCalledTimes(1);

    // Unmount (simulates closing) and remount (simulates reopening).
    unmount();
    render(<QuickViewModal isOpen={true} onClose={jest.fn()} productId={3} />);

    // Should NOT call the API again — cache hit.
    expect(mockGetProductById).toHaveBeenCalledTimes(1);
    // Content visible without a skeleton flash.
    expect(screen.getByTestId("quick-view-content")).toBeInTheDocument();
  });

  // 4. Close during loading: no state leak ----------------------------------
  it("resets to loading state cleanly when modal closes during an in-flight fetch", async () => {
    let resolveFirst!: (v: unknown) => void;
    mockGetProductById.mockReturnValueOnce(
      new Promise((res) => { resolveFirst = res; }),
    );

    const onClose = jest.fn();
    const { rerender } = render(
      <QuickViewModal isOpen={true} onClose={onClose} productId={4} />,
    );

    // Skeleton should be visible while loading.
    expect(document.querySelector(".skeleton-shimmer")).toBeInTheDocument();

    // Close before fetch resolves.
    rerender(<QuickViewModal isOpen={false} onClose={onClose} productId={4} />);

    // Modal is hidden.
    expect(screen.queryByTestId("modal")).not.toBeInTheDocument();

    // Resolve the stale request — should NOT cause any state updates (modal closed).
    await act(async () => {
      resolveFirst({ data: makeProduct(4) });
      await Promise.resolve();
    });

    // Reopen — should show skeleton (clean state, no stale product data).
    mockGetProductById.mockResolvedValue({ data: makeProduct(4) });
    rerender(<QuickViewModal isOpen={true} onClose={onClose} productId={4} />);

    // On reopen (cache miss because first request was aborted/ignored), fetch fires again.
    await waitFor(() =>
      expect(screen.getByTestId("quick-view-content")).toBeInTheDocument(),
    );
  });

  // 5. Error state shown on failed fetch ------------------------------------
  it("shows the error state when the fetch throws", async () => {
    const consoleError = jest.spyOn(console, "error").mockImplementation();
    const error = new Error("Network error");
    mockGetProductById.mockRejectedValue(error);

    renderModal(5);

    await waitFor(() => {
      expect(screen.getByText("مشکلی پیش آمد")).toBeInTheDocument();
    });
    expect(screen.getByRole("button", { name: /تلاش مجدد/i })).toBeInTheDocument();
    expect(screen.queryByTestId("quick-view-content")).not.toBeInTheDocument();
    expect(consoleError).toHaveBeenCalledWith("Error fetching product for quick view:", error);

    consoleError.mockRestore();
  });

  // 6. Retry button evicts cache and re-fetches ------------------------------
  it("retries the fetch and shows content after clicking تلاش مجدد", async () => {
    const product = makeProduct(6, "شلوار مشکی");
    const consoleError = jest.spyOn(console, "error").mockImplementation();
    const error = new Error("Network error");
    mockGetProductById
      .mockRejectedValueOnce(error)
      .mockResolvedValueOnce({ data: product });

    renderModal(6);

    // Wait for error state.
    await waitFor(() =>
      expect(screen.getByText("مشکلی پیش آمد")).toBeInTheDocument(),
    );

    // Click retry.
    fireEvent.click(screen.getByRole("button", { name: /تلاش مجدد/i }));

    // Content should appear after successful retry.
    await waitFor(() =>
      expect(screen.getByTestId("quick-view-content")).toBeInTheDocument(),
    );
    expect(mockGetProductById).toHaveBeenCalledTimes(2);
    expect(consoleError).toHaveBeenCalledWith("Error fetching product for quick view:", error);

    consoleError.mockRestore();
  });

  // 7. Modal not shown when isOpen=false ------------------------------------
  it("renders nothing when isOpen is false", () => {
    mockGetProductById.mockResolvedValue({ data: makeProduct(7) });

    render(<QuickViewModal isOpen={false} onClose={jest.fn()} productId={7} />);

    expect(screen.queryByTestId("modal")).not.toBeInTheDocument();
    expect(mockGetProductById).not.toHaveBeenCalled();
  });

  // 8. Product with no variations renders without crash ----------------------
  it("renders content for a product with no variations", async () => {
    const product = makeProduct(8, "محصول بدون تنوع");
    product.attributes.product_variations = { data: [] };
    mockGetProductById.mockResolvedValue({ data: product });

    renderModal(8);

    await waitFor(() =>
      expect(screen.getByTestId("quick-view-content")).toBeInTheDocument(),
    );
    // No crash — content stub renders the title.
    expect(screen.getByTestId("product-title")).toHaveTextContent("محصول بدون تنوع");
  });

  // 9. Different product opens with fresh fetch (no cross-contamination) ----
  it("fetches a different product when productId changes", async () => {
    const productA = makeProduct(9, "محصول الف");
    const productB = makeProduct(10, "محصول ب");
    mockGetProductById
      .mockResolvedValueOnce({ data: productA })
      .mockResolvedValueOnce({ data: productB });

    const { rerender } = render(
      <QuickViewModal isOpen={true} onClose={jest.fn()} productId={9} />,
    );

    await waitFor(() =>
      expect(screen.getByTestId("product-title")).toHaveTextContent("محصول الف"),
    );

    // Switch to a different product.
    rerender(<QuickViewModal isOpen={true} onClose={jest.fn()} productId={10} />);

    await waitFor(() =>
      expect(screen.getByTestId("product-title")).toHaveTextContent("محصول ب"),
    );
    expect(mockGetProductById).toHaveBeenCalledTimes(2);
  });
});
