import { defineConfig } from "@lovable.dev/vite-tanstack-config";

export default defineConfig({
  nitro: {
    preset: "vercel",
  },
  tanstackStart: {
    server: { entry: "server" },
  },
  react: {
    jsxRuntime: "automatic",
  },
  vite: {
    esbuild: {
      jsxDev: false,
    },
  },
});
