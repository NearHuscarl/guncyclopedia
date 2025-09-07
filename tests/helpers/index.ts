import { createHash } from "node:crypto";

export function sanitizeTestData(obj: unknown): unknown {
  if (typeof obj === "number") {
    return Number(obj.toFixed(3));
  }
  if (Array.isArray(obj)) {
    return obj.map((v) => sanitizeTestData(v));
  }
  if (obj && typeof obj === "object") {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(obj)) {
      out[k] = sanitizeTestData(v);
      if (v === undefined) {
        delete out[k];
      }
    }
    return out;
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
