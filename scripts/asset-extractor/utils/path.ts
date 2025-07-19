import { readdir } from "node:fs/promises";
import path from "node:path";

export async function getAllFileRecursively(dir: string, extension: string): Promise<string[]> {
  const entries = await readdir(dir, { withFileTypes: true });
  const files: string[] = [];

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await getAllFileRecursively(fullPath, extension)));
    } else if (entry.isFile() && entry.name.endsWith(`.${extension}`)) {
      files.push(fullPath);
    }
  }

  return files;
}

export function normalizePath(filePath: string): string {
  return filePath.replace(/\\/g, "/");
}
