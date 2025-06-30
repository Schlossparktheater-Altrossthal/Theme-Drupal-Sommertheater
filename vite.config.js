import { defineConfig } from 'vite'
import { nodePolyfills } from 'vite-plugin-node-polyfills';
import yaml from '@rollup/plugin-yaml';
import storybookGenerator from './vitePlugins/vite-plugin-storybook-generator.js';
import sdcCssWatcher from './vitePlugins/vite-plugin-sdc-storybook-css-watcher.js';
import tailwindcss from '@tailwindcss/vite';
import precompileTwig from './vitePlugins/vite-plugin-precompile-twig.js';

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    nodePolyfills(),
    yaml(),
    precompileTwig({
      include: /\.twig(\?.*)?$/     ,      // match bare and query imports.
      namespaces: {
        mercury: ['components', 'templates']
      }
    }),
    tailwindcss(),

    storybookGenerator({
      componentsDir: 'components',
      includeJs: true,
      storiesDir: './src/stories/sdc-stories',
      namespaces: {
        mercury: ['components', 'templates']
      }
    }),
    sdcCssWatcher(),
  ],
  optimizeDeps: {
    exclude: ['@storybook/addon-essentials', '@storybook/addon-interactions', '@storybook/blocks', '@storybook/react', '@storybook/react-vite', '@storybook/testing-library']
  },
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
