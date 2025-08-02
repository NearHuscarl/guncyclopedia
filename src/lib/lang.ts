export function randomBetween(min: number, max: number): number {
  return min + Math.random() * (max - min);
}

export function pickRandom<T>(arr: T[]): T {
  if (arr.length === 0) throw new Error("Cannot pick from an empty array");
  const index = Math.floor(Math.random() * arr.length);
  return arr[index];
}

export function formatNumber(value: number, precision = 2): string {
  return value === Infinity ? "∞" : Number(value.toFixed(precision)).toString();
}
