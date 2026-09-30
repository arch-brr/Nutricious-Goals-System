import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";
import path from "node:path";

const __dirname = fileURLToPath(new URL(".", import.meta.url));

export default defineConfig({
  test: {
    environment: "node",
    globals: true,
    include: ["**/*.test.ts", "**/*.spec.ts"],
    exclude: ["node_modules", ".next", "dist"],
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});

