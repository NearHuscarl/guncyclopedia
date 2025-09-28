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

export function joinWords(words: (string | undefined)[], separator = ", "): string {
  words = words.filter((word): word is string => word !== undefined);

  if (words.length === 0) return "";
  if (words.length === 1) return words[0] || "";
  return words.slice(0, -1).join(separator) + " and " + words.at(-1);
}

/**
 * Linearly interpolates between two values.
 *
 * @param {number} a - The start value.
 * @param {number} b - The end value.
 * @param {number} t - The interpolation factor, typically between 0 and 1.
 *   - If t = 0, the result is `a`.
 *   - If t = 1, the result is `b`.
 *   - If 0 < t < 1, the result is between `a` and `b`.
 *   - Values outside [0, 1] will extrapolate beyond the range.
 * @returns {number} The interpolated value between `a` and `b`.
 */
export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

/**
 * Calculates the interpolation factor (inverse lerp) of a value within a range.
 *
 * @param {number} a - The start of the range.
 * @param {number} b - The end of the range.
 * @param {number} v - The value to locate within the range.
 * @returns {number} The normalized interpolation factor `t` such that:
 *   - If v = a, returns 0.
 *   - If v = b, returns 1.
 *   - If a < v < b, returns a value between 0 and 1.
 *   - Values outside [a, b] return factors < 0 or > 1 (extrapolation).
 */
export function inverseLerp(a: number, b: number, v: number): number {
  return (v - a) / (b - a);
}
