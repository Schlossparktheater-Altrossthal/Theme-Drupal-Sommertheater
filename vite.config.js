import { defineConfig } from "vite";
import { nodePolyfills } from "vite-plugin-node-polyfills";
import yaml from "@rollup/plugin-yaml";
import tailwindcss from "@tailwindcss/vite";

// https://vite.dev/config/
export default defineConfig({
  plugins: [nodePolyfills(), yaml(), tailwindcss()],
  build: {
    outDir: "./build",
    rollupOptions: {
      input: {
        main: "./src/main.css",
      },
      output: {
        assetFileNames: (assetInfo) => {
          const fileNames = assetInfo.names;
          const fileName = fileNames.pop();
          if (fileName === "style.css") {
            return "css/[name].min.css";
          }
          return "css/[name].min[extname]";
        },
      },
    },
    cssMinify: true,
  },
});
