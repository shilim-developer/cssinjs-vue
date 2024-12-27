import path from "node:path";
import vue from "@vitejs/plugin-vue";
import vueJsx from "@vitejs/plugin-vue-jsx";
import { defineConfig } from "vite";
import dts from "vite-plugin-dts";

export default defineConfig({
  resolve: {
    alias: {
      "cssinjs-vue": path.resolve(__dirname, "./src"),
    },
  },
  plugins: [
    vue(),
    vueJsx(),
    dts(),
  ],
  build: {
    minify: false,
    rollupOptions: {
      external: [
        "@emotion/hash",
        "@emotion/unitless",
        "csstype",
        "stylis",
        "vue",
      ],
    },
    lib: {
      entry: "src/index.ts",
      formats: ["es", "cjs"],
      fileName: format => `index.${format === "es" ? "mjs" : "js"}`,
    },
  },
});
