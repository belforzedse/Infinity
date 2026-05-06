/**
 * Checks if a value is null or undefined
 * @param value - The value to check
 * @returns True if the value is null or undefined
 */
export function isNullish(value: unknown): value is null | undefined {
  return value === null || value === undefined;
}
