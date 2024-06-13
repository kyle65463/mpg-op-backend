import * as path from "path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["src/**/*.test.ts"],
    singleThread: true,
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "@prisma/pg": path.resolve(__dirname, "./prisma/pg"),
    },
  },
});
