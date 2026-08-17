/// <reference types="vitest" />
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  // Exclude the large Sketchfab source folder — its filename has spaces that
  // crash Vite's FSWatcher on Windows (EBUSY error).
  server: {
    watch: {
      ignored: ["**/public/animated-football-player-trips-loop/**"],
    },
  },
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: "./src/setupTests.ts",
  },
});
