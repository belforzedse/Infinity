import { renderHook, act } from "@testing-library/react";
import { useToggle } from "../useToggle";

describe("useToggle", () => {
  it("should initialize with false by default", () => {
    const { result } = renderHook(() => useToggle());
    expect(result.current[0]).toBe(false);
  });

  it("should initialize with provided initial state", () => {
    const { result } = renderHook(() => useToggle(true));
    expect(result.current[0]).toBe(true);
  });

  it("should toggle state from false to true", () => {
    const { result } = renderHook(() => useToggle(false));

    act(() => {
      result.current[1]();
    });

    expect(result.current[0]).toBe(true);
  });

  it("should toggle state from true to false", () => {
    const { result } = renderHook(() => useToggle(true));

    act(() => {
      result.current[1]();
    });

    expect(result.current[0]).toBe(false);
  });

  it("should toggle multiple times", () => {
    const { result } = renderHook(() => useToggle());

    act(() => {
      result.current[1](); // false -> true
    });
    expect(result.current[0]).toBe(true);

    act(() => {
      result.current[1](); // true -> false
    });
    expect(result.current[0]).toBe(false);

    act(() => {
      result.current[1](); // false -> true
    });
    expect(result.current[0]).toBe(true);
  });

  it("should maintain stable toggle function reference", () => {
    const { result, rerender } = renderHook(() => useToggle());
    const firstToggle = result.current[1];

    rerender();

    expect(result.current[1]).toBe(firstToggle);
  });
});
