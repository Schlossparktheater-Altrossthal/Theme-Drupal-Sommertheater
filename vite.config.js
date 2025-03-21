import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'
import createTwigPlugin from '@nightlycommit/rollup-plugin-twig';
import TwingEnvironment from './.storybook/twingEnvironment.js';
import { nodePolyfills } from 'vite-plugin-node-polyfills';
import yaml from '@rollup/plugin-yaml';
import storybookGenerator from './vite-plugin-storybook-generator';
import tailwindcss from '@tailwindcss/vite';
import fs from 'fs';
import { glob } from 'glob';

// Function to generate the components CSS file
function generateComponentsCSS() {
  const cssFiles = glob.sync('components/**/*.css');
  const imports = cssFiles.map(file => `@import '../../../${file}';`).join('\n');
  fs.writeFileSync('./src/stories/sdc-stories/components.css', imports);
}

// Generate the CSS file before Vite starts
generateComponentsCSS();

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    nodePolyfills(),
    react(),
    yaml(),
    createTwigPlugin(TwingEnvironment),
    tailwindcss(),
    storybookGenerator({
      componentsDir: 'components',
      includeJs: true,
      storiesDir: './src/stories/sdc-stories'
    }),
  ],
  build: {
    outDir: './build',
    rollupOptions: {
      input: {
        main: './src/main.css',
        components: './src/components.css'
      },
      output: {
        assetFileNames: (assetInfo) => {
          const fileNames = assetInfo.names;
          const fileName = fileNames.pop();
          if (fileName === 'style.css') {
            return 'css/[name].min.css';
          }
          return 'css/[name].min[extname]';
        }
      }
    },
    cssMinify: true
  }
});
