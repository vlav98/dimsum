export function pick<T>(items: readonly T[]): T {
  if (items.length === 0)
    throw new Error("Cannot choose from an empty collection.");
  return items[Math.floor(Math.random() * items.length)];
}

export function sample<T>(items: readonly T[], count: number): T[] {
  if (!Number.isInteger(count) || count < 1 || count > items.length) {
    throw new Error("The requested sample size is out of range.");
  }
  const pool = [...items];
  return Array.from(
    { length: count },
    () => pool.splice(Math.floor(Math.random() * pool.length), 1)[0],
  );
}

export function choose<T extends string>(
  items: readonly T[],
  value?: string | null,
): T {
  if (!value) return pick(items);
  const match = items.find((item) => item === value);
  if (!match) throw new Error(`Unknown generator choice: ${value}`);
  return match;
}
