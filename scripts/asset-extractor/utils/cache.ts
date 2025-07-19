import constants from "node:constants";
import { access, mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { ASSET_EXTRACTOR_ROOT } from "../constants.ts";

const CACHE_BASE_PATH =
  process.env.NODE_ENV === "test"
    ? path.join(ASSET_EXTRACTOR_ROOT, "cache-test")
    : path.join(ASSET_EXTRACTOR_ROOT, "cache");

export async function saveCache<K, V>(key: string, value: Map<K, V>) {
  const dir = path.dirname(CACHE_BASE_PATH);
  const cacheValue = Object.fromEntries(value);

  await mkdir(dir, { recursive: true });
  await writeFile(`${CACHE_BASE_PATH}/${key}.json`, JSON.stringify(cacheValue, null, 2), "utf-8");
}

export async function restoreCache<K, V>(key: string, keyResolver?: (value: unknown) => K): Promise<Map<K, V>> {
  try {
    await access(CACHE_BASE_PATH, constants.F_OK);
    const text = await readFile(`${CACHE_BASE_PATH}/${key}.json`, "utf-8");
    const cache = JSON.parse(text);
    const entries = Object.entries(cache);
    if (keyResolver) {
      return new Map(entries.map(([k, v]) => [keyResolver(k), v] as [K, V]));
    }
    return new Map<K, V>(entries as [K, V][]);
  } catch {
    // file doesn't exist or unreadable
    return new Map<K, V>();
  }
}
