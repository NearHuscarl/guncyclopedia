import path from "node:path";
import fg from "fast-glob";
import sharp from "sharp";
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
      const paths: { path: string; width: number; height: number }[] = [];

      for (const file of files) {
        const imagePath = `spritesheet/${file.replace(/\\/g, "/")}`;
        const { width, height } = await sharp(path.join(publicDir, file)).metadata();
        paths.push({ path: imagePath, width, height });
      }

      return `export const spritesheetPaths = ${JSON.stringify(paths)};`;
    },
  };
}
