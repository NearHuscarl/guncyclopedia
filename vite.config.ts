import path from "path";
import tailwindcss from "@tailwindcss/vite";
import { tanstackRouter } from "@tanstack/router-plugin/vite";
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import PublicSpritesheetsPlugin from "./vite/vite-plugin-public-spritesheets";

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    tanstackRouter({
      target: "react",
      autoCodeSplitting: true,
    }),
    react(),
    tailwindcss(),
    PublicSpritesheetsPlugin(),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  test: {
    include: ["scripts/**/*.test.ts", "src/**/*.test.tsx?"],
  },
});
