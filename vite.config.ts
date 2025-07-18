import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  test: {
    include: ["scripts/**/*.test.ts", "src/**/*.test.tsx?"],
  },
});
