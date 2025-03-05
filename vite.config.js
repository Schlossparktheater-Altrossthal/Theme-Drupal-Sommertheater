import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'
import createTwigPlugin from '@nightlycommit/rollup-plugin-twig';
import TwingEnvironment from './.storybook/twingEnvironment.js';
import { nodePolyfills } from 'vite-plugin-node-polyfills';
import yaml from '@rollup/plugin-yaml';
import storybookGenerator from './vite-plugin-storybook-generator';

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    nodePolyfills(),
    react(),
    yaml(),
    createTwigPlugin(TwingEnvironment),
    storybookGenerator({
       // Optional: override default options
       componentsDir: 'components',   // Default directory containing components
       forceOverwrite: true,         // Whether to overwrite existing story files
    }),
  ],
});
