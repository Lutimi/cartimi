import { defineConfig } from "vitest/config";

export default defineConfig({
  // Rutas relativas para poder subir la carpeta dist/ a itch.io tal cual.
  base: "./",
  // Phaser por sí solo pesa unos 1.4 MB.
  build: { chunkSizeWarningLimit: 1600 },
  test: {
    include: ["tests/**/*.test.ts"],
  },
});
