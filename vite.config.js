import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'
import createTwigPlugin from '@nightlycommit/rollup-plugin-twig';
import TwingEnvironment from './.storybook/twingEnvironment.js';
import { nodePolyfills } from 'vite-plugin-node-polyfills';
import yaml from '@rollup/plugin-yaml';
import storybookGenerator from './vite-plugin-storybook-generator';
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
      // Generate story files in a separate directory (NOT in component directories)
      componentsDir: 'components',
      includeJs: true,
      storiesDir: './src/generated-stories'
    }),
  ],
  build: {
    outDir: './build',
    rollupOptions: {
      input: {
        main: './src/main.css',
      },
      output: {
        assetFileNames: 'css/main.min.css',
      }
    }
  }
});
