export function randomBetween(min: number, max: number): number {
  return min + Math.random() * (max - min);
}

export function formatNumber(value: number, precision: number = 2): string {
  return value === Infinity ? "∞" : Number(value.toFixed(precision)).toString();
}
