import fs from 'fs';
import path from 'path';
import { glob } from 'glob';
import generateStoryForComponent from './generateStoryForComponent.js';

/**
 * Generate Storybook stories for all components
 * @param {Object} options - Configuration options
 * @param {Object} options.namespaces - Namespace configuration
 * @param {string} options.componentsDir - Components directory path
 * @param {string} options.storiesDir - Stories output directory
 * @param {boolean} options.includeJs - Whether to include JS imports
 */
export default function generateAllStoryFiles(options) {
  const { componentsDir, storiesDir } = options;

  // Ensure the stories directory exists.
  const absoluteStoriesDir = path.resolve(storiesDir);
  if (!fs.existsSync(absoluteStoriesDir)) {
    fs.mkdirSync(absoluteStoriesDir, { recursive: true });
  } else {
    // Clean up old story files.
    const oldStoryFiles = glob.sync(`${absoluteStoriesDir}/*.stories.js`);
    oldStoryFiles.forEach((file) => {
      fs.unlinkSync(file);
    });
    console.log(
      `[storybook-generator] Cleaned up ${oldStoryFiles.length} old story files`
    );
  }

  const componentDirs = glob.sync(`${componentsDir}/*/`);
  console.log(
    `[storybook-generator] Found ${componentDirs.length} component directories`
  );

  componentDirs.forEach((dir) => {
    generateStoryForComponent(options, dir);
  });

  console.log(
    `[storybook-generator] All stories generated in ${absoluteStoriesDir}`
  );
}
