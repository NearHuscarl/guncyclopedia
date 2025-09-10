import { createHash } from "node:crypto";

export function sanitizeTestData(obj: unknown): unknown {
  if (typeof obj === "number") {
    return Number(obj.toFixed(3));
  }
  if (Array.isArray(obj)) {
    return obj.map((v) => sanitizeTestData(v));
  }
  if (obj && typeof obj === "object") {
    const entries = Object.entries(obj)
      .filter(([, v]) => v !== undefined)
      .map(([k, v]) => [k, sanitizeTestData(v)] as const);
    const sorted = entries.sort(([a], [b]) => a.localeCompare(b));
    return Object.fromEntries(sorted);
  }
  return obj;
}

export function JSONstringifyOrder(obj: object, space = 2) {
  const allKeys = new Set<string>();
  JSON.stringify(obj, (key, value) => (allKeys.add(key), value));
  return JSON.stringify(obj, Array.from(allKeys).sort(), space);
}

export function hashObject(obj: object): string {
  const str = JSONstringifyOrder(obj);
  return createHash("md5").update(str).digest("hex").slice(0, 16);
}
