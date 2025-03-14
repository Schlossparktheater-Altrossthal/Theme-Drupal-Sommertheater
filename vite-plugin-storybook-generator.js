/**
 * Vite plugin to automatically generate Storybook stories for components.
 * This plugin generates physical story files in a separate directory (not in component directories).
 */

import fs from 'fs';
import path from 'path';
import { glob } from 'glob';
import yaml from 'js-yaml'; // Import js-yaml to parse .yml files for component metadata (e.g., extracting 'group' property)

/**
 * Generate story content for a component
 * @param {string} componentPath - Path to the component
 * @param {string} componentName - Name of the component
 * @param {boolean} includeJs - Whether to include JS imports
 * @returns {string} - Story content
 */
function generateStoryContent(componentPath, componentName, includeJs = true) {
  const lowerCaseName = componentName.toLowerCase();
  const yamlFilePath = path.join(componentPath, `${lowerCaseName}.component.yml`);

  // Variables to org components based on .yml
  // Start with null to prevent default duplication
  let group = null;
  let name = null;

  if (fs.existsSync(yamlFilePath)) {
    try {
      const yamlContent = fs.readFileSync(yamlFilePath, 'utf8');
      const parsedYaml = yaml.load(yamlContent);
      group = parsedYaml?.group ?? null;
      name = parsedYaml?.name ?? null;
    } catch (error) {
      console.warn(`[storybook-generator] Warning: Could not read YAML for ${componentName}: ${error.message}`);
    }
  }

  // Construct the story title
  const title = group ? `${group}/${name}` : `Components/${name}`;

  // Check if JS file exists
  const jsFilePath = path.join(componentPath, `${lowerCaseName}.js`);
  const hasJsFile = fs.existsSync(jsFilePath);

  // Check if the CSS file exists
  const cssFilePath = path.join(componentPath, `${lowerCaseName}.css`);
  const hasCssFile = fs.existsSync(cssFilePath);

  // Use absolute paths for imports to ensure they work from any location
  const componentRelativePath = path.relative(process.cwd(), componentPath).replace(/\\/g, '/');

  let imports = `// Import the YAML metadata and the Twig template.
import ${lowerCaseName}Metadata from '/${componentRelativePath}/${lowerCaseName}.component.yml';
import ${lowerCaseName}Template from '/${componentRelativePath}/${lowerCaseName}.twig'`;

  // Conditionally add the CSS import if the file exists
  if (hasCssFile) {
    imports += `
import '/${componentRelativePath}/${lowerCaseName}.css';`;
  }
  // Conditionally add the JS import if the file exists and includeJs is true
  if (hasJsFile && includeJs) {
    imports += `
import '/${componentRelativePath}/${lowerCaseName}.js';`;
  }

  return `${imports}
import twingStory from '/src/common/twingStory.js';
import generateArgTypesAndArgs from '/src/common/generateArgTypesAndArgs.js';

const { argTypes, args } = generateArgTypesAndArgs(${lowerCaseName}Metadata);

export default {
    title: '${title}',
    component: '${componentName}',
    argTypes,
    args
};

export const Default = twingStory(${lowerCaseName}Template);
`;
}

/**
 * Vite plugin for generating Storybook stories in a separate directory
 */
export default function storybookGenerator(options = {}) {
  const {
    componentsDir = 'components',
    includeJs = true,
    storiesDir = './src/generated-stories'  // Directory to store generated stories
  } = options;

  /**
   * Generate story files for all components in a separate directory
   */
  function generateStoryFiles() {
    // Ensure the stories directory exists
    const absoluteStoriesDir = path.resolve(storiesDir);
    if (!fs.existsSync(absoluteStoriesDir)) {
      fs.mkdirSync(absoluteStoriesDir, { recursive: true });
    } else {
      // Clean up old story files
      const oldStoryFiles = glob.sync(`${absoluteStoriesDir}/*.stories.js`);
      oldStoryFiles.forEach(file => {
        fs.unlinkSync(file);
      });
      console.log(`[storybook-generator] Cleaned up ${oldStoryFiles.length} old story files`);
    }

    const componentDirs = glob.sync(`${componentsDir}/*/`);
    console.log(`[storybook-generator] Found ${componentDirs.length} component directories`);

    componentDirs.forEach(dir => {
      const componentName = path.basename(dir);
      const lowerCaseName = componentName.toLowerCase();

      // Check if the component has the required files
      const hasYaml = fs.existsSync(path.join(dir, `${lowerCaseName}.component.yml`));
      const hasTwig = fs.existsSync(path.join(dir, `${lowerCaseName}.twig`));

      // Skip if any required file is missing
      if (!hasYaml || !hasTwig) {
        console.warn(`[storybook-generator] Skipping ${componentName}: missing required files (YAML or Twig)`);
        return;
      }

      try {
        // Generate the story content
        const storyContent = generateStoryContent(dir, componentName, includeJs);

        // Create story file path in the separate directory
        const storyFilePath = path.join(absoluteStoriesDir, `${lowerCaseName}.stories.js`);

        // Write the story file to the separate directory
        fs.writeFileSync(storyFilePath, storyContent);
        console.log(`[storybook-generator] Generated story file for ${componentName} at ${storyFilePath}`);
      } catch (error) {
        console.error(`[storybook-generator] Error generating story for ${componentName}:`, error);
      }
    });

    console.log(`[storybook-generator] All stories generated in ${absoluteStoriesDir}`);
  }

  return {
    name: 'vite-plugin-storybook-generator',

    // Initialize during build start
    buildStart() {
      generateStoryFiles();
    },

    // Set up file watching and HMR
    configureServer({ watcher }) {
      // Initial generation
      generateStoryFiles();

      // Watch for changes in component files
      watcher.add(`${componentsDir}/**/*`);
      watcher.on('change', (changedPath) => {
        if (changedPath.includes(componentsDir)) {
          console.log(`[storybook-generator] Change detected in ${changedPath}, regenerating stories`);
          generateStoryFiles();
        }
      });
    }
  };
} 