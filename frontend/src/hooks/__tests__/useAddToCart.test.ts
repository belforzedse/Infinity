import { renderHook, act } from "@testing-library/react";
import useAddToCart from "../useAddToCart";

const mockAddToCart = jest.fn();
const mockOpenDrawer = jest.fn();
const mockUpdateQuantity = jest.fn();
let cartItemsMock: Array<{ id: string; quantity: number }> = [];

jest.mock("@/contexts/CartContext", () => ({
  useCart: () => ({
    addToCart: mockAddToCart,
    openDrawer: mockOpenDrawer,
    cartItems: cartItemsMock,
    updateQuantity: mockUpdateQuantity,
  }),
}));

jest.mock("@/utils/notify", () => ({
  __esModule: true,
  default: {
    error: jest.fn(),
    success: jest.fn(),
  },
}));

describe("useAddToCart", () => {
  const mockProps = {
    productId: "123",
    name: "Test Product",
    category: "Test Category",
    price: 100000,
    image: "/test.jpg",
  };

  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
    cartItemsMock = [];
  });

  it("should initialize with quantity 0", () => {
    const { result } = renderHook(() => useAddToCart(mockProps));

    expect(result.current.quantity).toBe(0);
    expect(result.current.isAdding).toBe(false);
    expect(result.current.isInCart).toBe(false);
  });

  it("should update quantity and sync cart when item exists", () => {
    cartItemsMock = [{ id: "123---", quantity: 2 }];

    const { result, rerender } = renderHook(() => useAddToCart(mockProps));

    act(() => {
      result.current.setQuantity(5);
    });

    expect(mockUpdateQuantity).toHaveBeenCalledWith("123---", 5);

    cartItemsMock = [{ id: "123---", quantity: 5 }];

    act(() => {
      rerender();
    });

    expect(result.current.quantity).toBe(5);
  });

  it("should add item to cart", () => {
    const { result } = renderHook(() => useAddToCart(mockProps));

    act(() => {
      result.current.addToCart(2);
    });

    expect(mockAddToCart).toHaveBeenCalledWith(
      expect.objectContaining({
        productId: "123",
        name: "Test Product",
        category: "Test Category",
        price: 100000,
        quantity: 2,
      }),
    );
    expect(mockOpenDrawer).toHaveBeenCalled();
  });

  it("should use current quantity if no initial quantity provided", () => {
    cartItemsMock = [{ id: "123---", quantity: 3 }];

    const { result } = renderHook(() => useAddToCart(mockProps));

    act(() => {
      result.current.addToCart();
    });

    expect(mockAddToCart).toHaveBeenCalledWith(
      expect.objectContaining({
        quantity: 3,
      }),
    );
  });

  it("should not add if quantity is 0", () => {
    const { result } = renderHook(() => useAddToCart(mockProps));

    act(() => {
      result.current.addToCart(0);
    });

    expect(mockAddToCart).not.toHaveBeenCalled();
  });

  it("should create unique cart item id with variation", () => {
    const { result } = renderHook(() =>
      useAddToCart({ ...mockProps, variationId: "var-1" }),
    );

    expect(result.current.cartItemId).toBe("123-var-1");
  });

  it("should create unique cart item id without variation", () => {
    const { result } = renderHook(() =>
      useAddToCart({ ...mockProps, color: "red", size: "L" }),
    );

    expect(result.current.cartItemId).toBe("123-red-L-");
  });
});
