type EntityIdInput =
  | number
  | string
  | null
  | undefined
  | { id?: number | string | null; data?: any };

export function asEntityId(input: EntityIdInput): number | null {
  if (typeof input === "number" && Number.isFinite(input)) return input;
  if (typeof input === "string" && input.trim() && Number.isFinite(Number(input))) {
    return Number(input);
  }

  if (input && typeof input === "object") {
    if ("id" in input) return asEntityId((input as any).id);
    if ("data" in input) return asEntityId((input as any).data);
  }

  return null;
}
