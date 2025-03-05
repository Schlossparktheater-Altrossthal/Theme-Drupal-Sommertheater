/**
 * Vite plugin to automatically generate Storybook stories for components.
 * This plugin scans the components directory and generates stories based on YAML metadata.
 */

import fs from 'fs';
import path from 'path';
import {glob} from 'glob';

/**
 * Generate a story file content for a component
 * @param {string} componentPath - Path to the component directory
 * @param {string} componentName - Name of the component
 * @returns {string} - Content of the generated story file
 */
function generateStoryContent(componentPath, componentName) {
  const lowerCaseName = componentName.toLowerCase();
  
  // Check if JS file exists
  const jsFilePath = path.join(componentPath, `${lowerCaseName}.js`);
  const hasJsFile = fs.existsSync(jsFilePath);
  
  let imports = `// Import the YAML metadata and the Twig template.
import ${lowerCaseName}Metadata from './${lowerCaseName}.component.yml';
import ${lowerCaseName}Template from './${lowerCaseName}.twig';
import './${lowerCaseName}.css';`;

  // Conditionally add the JS import if the file exists
  if (hasJsFile) {
    imports += `
import './${lowerCaseName}.js';`;
  }

  return `${imports}
import twingStory from '../../src/common/twingStory.js';
import generateArgTypesAndArgs from '../../src/common/generateArgTypesAndArgs.js';


const { argTypes, args } = generateArgTypesAndArgs(${lowerCaseName}Metadata);

export default {
    title: 'Components/${componentName}',
    component: '${componentName}',
    argTypes,
    args
};

export const Default = twingStory(${lowerCaseName}Template);
`;
}

/**
 * Vite plugin for generating Storybook stories
 * @param {Object} options - Plugin options
 * @returns {Object} - Vite plugin object
 */
export default function storybookGenerator(options = {}) {
  const {
    componentsDir = 'components',
    forceOverwrite = false,
  } = options;
  
  return {
    name: 'vite-plugin-storybook-generator',
    
    buildStart() {
      const componentDirs = glob.sync(`${componentsDir}/*/`);
      
      componentDirs.forEach(dir => {
        const componentName = path.basename(dir);
        const storyFilePath = path.join(dir, `${componentName.toLowerCase()}.stories.js`);
        
        // Check if the component has the required files
        const hasYaml = fs.existsSync(path.join(dir, `${componentName.toLowerCase()}.component.yml`));
        const hasTwig = fs.existsSync(path.join(dir, `${componentName.toLowerCase()}.twig`));
        const hasCss = fs.existsSync(path.join(dir, `${componentName.toLowerCase()}.css`));
        const hasJs = fs.existsSync(path.join(dir, `${componentName.toLowerCase()}.js`));
        
        // Skip if any required file is missing
        if (!hasYaml || !hasTwig) {
          console.warn(`Skipping ${componentName}: missing required files (YAML or Twig)`);
          return;
        }
        
        // Skip if story file already exists and forceOverwrite is false
        if (fs.existsSync(storyFilePath) && !forceOverwrite) {
          console.log(`Story file for ${componentName} already exists, skipping`);
          return;
        }
        
        try {
          // Generate the story file content
          const storyContent = generateStoryContent(dir, componentName);
          
          // Write the story file
          fs.writeFileSync(storyFilePath, storyContent, 'utf-8');
          console.log(`Generated story file for ${componentName}${hasJs ? ' (with JS file)' : ''}`);
        } catch (error) {
          console.error(`Error generating story for ${componentName}:`, error);
        }
      });
    }
  };
} 