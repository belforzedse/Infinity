import { renderHook, act } from "@testing-library/react";
import { useCountdown } from "../useCountdown";

jest.useFakeTimers();

describe("useCountdown", () => {
  afterEach(() => {
    jest.clearAllTimers();
  });

  it("should initialize with default 120 seconds", () => {
    const { result } = renderHook(() => useCountdown());
    expect(result.current.timeLeft).toBe("۰۲:۰۰"); // 02:00 in Persian
    expect(result.current.isActive).toBe(true);
  });

  it("should initialize with custom seconds", () => {
    const { result } = renderHook(() => useCountdown(60));
    expect(result.current.timeLeft).toBe("۰۱:۰۰"); // 01:00 in Persian
  });

  it("should countdown correctly", () => {
    const { result } = renderHook(() => useCountdown(5));

    expect(result.current.timeLeft).toBe("۰۰:۰۵");

    act(() => {
      jest.advanceTimersByTime(1000);
    });

    expect(result.current.timeLeft).toBe("۰۰:۰۴");

    act(() => {
      jest.advanceTimersByTime(1000);
    });

    expect(result.current.timeLeft).toBe("۰۰:۰۳");
  });

  it("should stop at zero", () => {
    const { result } = renderHook(() => useCountdown(2));

    act(() => {
      jest.advanceTimersByTime(2000);
    });

    expect(result.current.timeLeft).toBe("۰۰:۰۰");
    expect(result.current.isActive).toBe(false);

    // Should not go negative
    act(() => {
      jest.advanceTimersByTime(1000);
    });

    expect(result.current.timeLeft).toBe("۰۰:۰۰");
  });

  it("should format time correctly in Persian numbers", () => {
    const { result } = renderHook(() => useCountdown(125)); // 2 minutes 5 seconds

    expect(result.current.timeLeft).toBe("۰۲:۰۵");

    act(() => {
      jest.advanceTimersByTime(66000); // 66 seconds
    });

    expect(result.current.timeLeft).toBe("۰۰:۵۹");
  });

  it("should reset timer", () => {
    const { result } = renderHook(() => useCountdown(10));

    act(() => {
      jest.advanceTimersByTime(5000);
    });

    expect(result.current.timeLeft).toBe("۰۰:۰۵");

    act(() => {
      result.current.resetTimer();
    });

    expect(result.current.timeLeft).toBe("۰۰:۱۰");
    expect(result.current.isActive).toBe(false);
  });

  it("should restart timer", () => {
    const { result } = renderHook(() => useCountdown(10));

    act(() => {
      jest.advanceTimersByTime(5000);
    });

    expect(result.current.timeLeft).toBe("۰۰:۰۵");

    act(() => {
      result.current.startTimer();
    });

    expect(result.current.timeLeft).toBe("۰۰:۱۰");
    expect(result.current.isActive).toBe(true);

    act(() => {
      jest.advanceTimersByTime(1000);
    });

    expect(result.current.timeLeft).toBe("۰۰:۰۹");
  });

  it("should clean up interval on unmount", () => {
    const { unmount } = renderHook(() => useCountdown(60));

    const clearIntervalSpy = jest.spyOn(global, "clearInterval");

    unmount();

    expect(clearIntervalSpy).toHaveBeenCalled();

    clearIntervalSpy.mockRestore();
  });

  it("should not tick when inactive", () => {
    const { result } = renderHook(() => useCountdown(10));

    act(() => {
      result.current.resetTimer();
    });

    expect(result.current.isActive).toBe(false);

    const beforeTime = result.current.timeLeft;

    act(() => {
      jest.advanceTimersByTime(5000);
    });

    expect(result.current.timeLeft).toBe(beforeTime);
  });
});
