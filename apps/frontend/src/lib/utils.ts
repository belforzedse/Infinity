import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Utility helper for conditionally joining class names.
 *
 * Wraps `clsx` and `tailwind-merge` so that Tailwind classes are merged
 * intelligently while still supporting conditional expressions.
 *
 * @param inputs - A list of class values which may include strings,
 * arrays, or conditional expressions.
 * @returns A single space-delimited className string.
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
