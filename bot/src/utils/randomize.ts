export function randomizeEnum(enumType: any): string {
  const keys = Object.keys(enumType);
  const randomKey = keys[Math.floor(Math.random() * keys.length)];
  return enumType[randomKey];
}
