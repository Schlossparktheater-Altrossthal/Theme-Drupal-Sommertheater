import fs from "fs";
import path from "path";
import { glob } from "glob";

export default function sdcCssWatcher(options = {}) {
  let viteConfig;
  let storyGeneratorPlugin;

  const regenerateComponentCSS = (componentPath) => {
    const cssFiles = glob.sync("components/**/*.tailwind.css");
    const imports = cssFiles
      .map((file) => `@import '../../../${file}';`)
      .join("\n");
    fs.writeFileSync("./src/stories/sdc-stories/components.css", imports);
    console.log(
      `[css-watcher] Regenerated components.css${
        componentPath
          ? ` after change in ${componentPath}`
          : " during initialization"
      }`
    );
  };

  return {
    name: "vite-plugin-sdc-storybook-css-watcher",

    configResolved(resolvedConfig) {
      viteConfig = resolvedConfig;
      // Find the story generator plugin.
      storyGeneratorPlugin = viteConfig.plugins.find(
        (p) => p.name === "vite-plugin-storybook-generator"
      );
    },

    buildStart() {
      regenerateComponentCSS();
    },

    configureServer({ watcher }) {
      regenerateComponentCSS();

      watcher.add("components/**/*.tailwind.css");

      watcher.on("add", (filePath) => {
        if (filePath.endsWith(".tailwind.css")) {
          regenerateComponentCSS(filePath);
        }
      });

      watcher.on("change", (filePath) => {
        if (filePath.endsWith(".tailwind.css")) {
          regenerateComponentCSS(filePath);
        }
      });

      watcher.on("unlink", (filePath) => {
        if (filePath.endsWith(".tailwind.css")) {
          // Get the component directory from the CSS file path.
          const componentDir = path.dirname(filePath);
          regenerateComponentCSS(filePath);

          // Trigger story regeneration for this component.
          if (
            storyGeneratorPlugin &&
            storyGeneratorPlugin.generateStoryForComponent
          ) {
            console.log(
              `[css-watcher] CSS file removed, regenerating story for ${componentDir}`
            );
            storyGeneratorPlugin.generateStoryForComponent(componentDir);
          }
        }
      });
    },
  };
}
