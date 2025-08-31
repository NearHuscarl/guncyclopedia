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

export function toPercent(value: number): string {
  return (value * 100).toFixed(0) + "%";
}

export function joinWords(words: string[], separator = ", "): string {
  if (words.length === 0) return "";
  if (words.length === 1) return words[0];
  return words.slice(0, -1).join(separator) + " and " + words.at(-1);
}
