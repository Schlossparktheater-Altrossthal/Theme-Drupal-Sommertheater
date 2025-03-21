import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'
import createTwigPlugin from '@nightlycommit/rollup-plugin-twig';
import TwingEnvironment from './.storybook/twingEnvironment.js';
import { nodePolyfills } from 'vite-plugin-node-polyfills';
import yaml from '@rollup/plugin-yaml';
import storybookGenerator from './vite-plugin-storybook-generator';
import sdcCssWatcher from './vite-plugin-sdc-storybook-css-watcher.js';
import tailwindcss from '@tailwindcss/vite';

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
    sdcCssWatcher(),
  ],
  build: {
    outDir: './build',
    rollupOptions: {
      input: {
        main: './src/main.css',
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
