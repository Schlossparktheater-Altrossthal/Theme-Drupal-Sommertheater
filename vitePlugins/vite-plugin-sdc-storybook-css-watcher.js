import fs from "fs";
import path from "path";
import { glob } from "glob";
import { execSync } from "child_process";

export default function sdcCssWatcher(options = {}) {
  let viteConfig;
  let storyGeneratorPlugin;

  const compileTailwindCSS = (tailwindCssPath) => {
    try {
      const outputPath = tailwindCssPath.replace(".tailwind.css", ".css");
      execSync(`pnpm tailwindcss -i ${tailwindCssPath} -o ${outputPath}`, {
        stdio: "inherit",
      });
    } catch (error) {
      console.error(`[css-watcher] Error compiling ${tailwindCssPath}:`, error);
    }
  };

  const compileAllTailwindCSS = () => {
    const tailwindFiles = glob.sync("components/**/*.tailwind.css");
    tailwindFiles.forEach((file) => {
      const outputPath = file.replace(".tailwind.css", ".css");
      if (!fs.existsSync(outputPath)) {
        compileTailwindCSS(file);
      }
    });
  };

  const regenerateComponentCSS = (componentPath) => {
    const cssFiles = glob.sync("components/**/*.tailwind.css");
    const imports = cssFiles.map((file) => `@import '../../../${file}';`).join("\n");
    fs.writeFileSync("./src/stories/sdc-stories/components.css", imports);
  };

  return {
    name: "vite-plugin-sdc-storybook-css-watcher",

    configResolved(resolvedConfig) {
      viteConfig = resolvedConfig;
      // Find the story generator plugin.
      storyGeneratorPlugin = viteConfig.plugins.find((p) => p.name === "vite-plugin-storybook-generator");
    },

    buildStart() {
      compileAllTailwindCSS();
      regenerateComponentCSS();
    },

    configureServer({ watcher }) {
      compileAllTailwindCSS();
      regenerateComponentCSS();

      watcher.add("components/**/*.tailwind.css");

      watcher.on("add", (filePath) => {
        if (filePath.endsWith(".tailwind.css")) {
          compileTailwindCSS(filePath);
          regenerateComponentCSS(filePath);
        }
      });

      watcher.on("change", (filePath) => {
        if (filePath.endsWith(".tailwind.css")) {
          compileTailwindCSS(filePath);
          regenerateComponentCSS(filePath);
        }
      });

      watcher.on("unlink", (filePath) => {
        if (filePath.endsWith(".tailwind.css")) {
          // Get the component directory from the CSS file path.
          const componentDir = path.dirname(filePath);
          const outputPath = filePath.replace(".tailwind.css", ".css");

          // Remove the compiled CSS file if it exists
          if (fs.existsSync(outputPath)) {
            fs.unlinkSync(outputPath);
          }

          regenerateComponentCSS(filePath);

          // Trigger story regeneration for this component.
          if (storyGeneratorPlugin && storyGeneratorPlugin.generateStoryForComponent) {
            storyGeneratorPlugin.generateStoryForComponent(componentDir);
          }
        }
      });
    },
  };
}
