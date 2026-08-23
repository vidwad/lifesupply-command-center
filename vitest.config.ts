import { defineConfig } from "vitest/config";
import { resolve } from "node:path";

export default defineConfig({
  resolve: {
    alias: {
      "@": resolve(__dirname, "./src"),
    },
  },
  test: {
    environment: "node",
    // scripts/ is included so the production-touching bootstrap script's safety
    // canaries run in CI. A script that can be pointed at a production database
    // needs its write surface asserted on every commit, not just when someone
    // remembers to run it.
    include: ["src/**/*.{test,spec}.{ts,tsx}", "scripts/**/*.{test,spec}.{ts,tsx}"],
    exclude: ["**/node_modules/**", "**/.next/**"],
    coverage: {
      provider: "v8",
      reporter: ["text", "html"],
      include: ["src/server/**/*.ts", "src/lib/**/*.ts"],
      exclude: ["**/*.test.ts", "**/*.spec.ts"],
    },
  },
});
