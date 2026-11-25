export function randomizeEnum<T extends Record<string, string>>(
  enumType: T
): T[keyof T] {
  const values = Object.values(enumType) as T[keyof T][];
  return values[Math.floor(Math.random() * values.length)];
}
