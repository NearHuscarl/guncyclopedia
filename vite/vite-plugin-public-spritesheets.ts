import path from "node:path";
import fg from "fast-glob";
import type { Plugin } from "vite";

export default function PublicSpritesheetsPlugin(): Plugin<unknown> {
  const virtualModuleId = "virtual:spritesheets";
  const resolvedVirtualModuleId = "\0" + virtualModuleId;

  return {
    name: "vite-plugin-public-spritesheets",
    async resolveId(id) {
      if (id === virtualModuleId) return resolvedVirtualModuleId;
    },
    async load(id) {
      if (id !== resolvedVirtualModuleId) return;

      const publicDir = path.resolve(process.cwd(), "public/spritesheet");
      const files = await fg("**/*.png", { cwd: publicDir });
      const paths = files.map((f) => `spritesheet/${f.replace(/\\/g, "/")}`);

      return `export const spritesheetPaths = ${JSON.stringify(paths)};`;
    },
  };
}
