/**
 * Vite plugin to automatically generate Storybook stories for components.
 * This plugin generates physical story files in a separate directory (not in component directories).
 */

import path from 'path';
import generateStoryForComponent from './twingCustoms/generateStoryForComponent.js';
import generateAllStoryFiles from './twingCustoms/generateAllStoryFiles.js';
import fs from 'fs';

/**
 * Vite plugin for generating Storybook stories in a separate directory.
 */
export default function storybookGenerator(options = {}) {
  const {
    componentsDir = 'components',
    includeJs = true,
    storiesDir = './src/stories/sdc-stories',
    namespaces = {},
  } = options;

  // Create options object that will be passed to extracted functions
  const functionOptions = {
    namespaces,
    componentsDir,
    storiesDir,
    includeJs,
  };

  const plugin = {
    name: 'vite-plugin-storybook-generator',

    generateStoryForComponent(namespaces, componentDir) {
      return generateStoryForComponent(functionOptions, componentDir);
    },

    generateAllStoryFiles() {
      return generateAllStoryFiles(functionOptions);
    },

    buildStart() {
      plugin.generateAllStoryFiles();
    },

    configureServer({ watcher }) {
      plugin.generateAllStoryFiles();
      watcher.add(`${componentsDir}/**/*`);
      watcher.on('change', (changedPath) => {
        if (
          changedPath.includes(componentsDir) &&
          !changedPath.endsWith('.tailwind.css')
        ) {
          const componentDir = path.dirname(changedPath);
          if (fs.existsSync(componentDir)) {
            console.log(
              `[storybook-generator] Change detected in ${changedPath}, regenerating story`
            );
            plugin.generateStoryForComponent(namespaces, componentDir);
          }
        }
      });
    },
  };

  return plugin;
}
