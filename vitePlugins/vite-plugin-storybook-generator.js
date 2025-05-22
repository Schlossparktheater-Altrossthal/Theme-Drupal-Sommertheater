/**
 * Vite plugin to automatically generate Storybook stories for components.
 * This plugin generates physical story files in a separate directory (not in component directories).
 */

import fs from 'fs';
import path from 'path';
import { glob } from 'glob';
import yaml from 'js-yaml'; // Import js-yaml to parse .yml files for component metadata (e.g., extracting 'group' property)
import storyTemplate from './storyTemplate';


function getComponentDependencies(namespaces, componentFiles) {

  const findFileInNamespaces = (filePath) => {
    
    
    // Handle namespaced paths (e.g., @mercury/heading/heading.twig)
    if (filePath.startsWith('@')) {
      const [namespace, ...rest] = filePath.slice(1).split('/');
      const namespacePaths = namespaces[namespace];
      
      if (namespacePaths) {
        const relativePath = rest.join('/');
        for (const namespacePath of Array.isArray(namespacePaths) ? namespacePaths : [namespacePaths]) {
          const fullPath = path.join(namespacePath, relativePath);
          
          if (fs.existsSync(fullPath)) {
            return { path: fullPath, namespace };
          }
        }
      }
      return null;
    }

    const filePathWithoutTwig = filePath.replace('.twig', '');
    const [baseName, variant] = filePathWithoutTwig.split('~');
    const fileName = variant ? `${baseName}~${variant}` : baseName;

    for (const [namespace, paths] of Object.entries(namespaces)) {
      for (const namespacePath of Array.isArray(paths) ? paths : [paths]) {
        // Construct path following the convention
        const fullPath = path.join(
          namespacePath,
          baseName,
          `${fileName}.twig`
        );
        
        if (fs.existsSync(fullPath)) {
          return { path: fullPath, namespace };
        }
      }
    }

    
    return null;
  };

  const getJsPath = (twigPath) => {
    // Convert the Twig path to a potential JS path
    const jsPath = twigPath.replace('.twig', '.js');
    return fs.existsSync(jsPath) ? jsPath : null;
  };

  const extractDependencies = (content) => {
    const patterns = [
      /{%\s*extends\s+['"]([^'"]+)['"]\s*%}/g,
      /{{?\s*include\s*\(\s*['"]([^'"]+)['"]/g,  // Updated to catch include() with parameters
      /{%\s*include\s+['"]([^'"]+)['"]\s*%}/g,   // Keep original include pattern
      /{%\s*embed\s+['"]([^'"]+)['"]\s*%}/g,
      /{%\s*import\s+['"]([^'"]+)['"]\s*%}/g,
      /{%\s*from\s+['"]([^'"]+)['"]\s*%}/g
    ];

    const deps = patterns.flatMap(pattern => {
      const matches = [];
      let match;
      while ((match = pattern.exec(content)) !== null) {
        const dep = match[1];
        // Convert mercury: format to @mercury format
        if (dep.startsWith('mercury:')) {
          const componentName = dep.replace('mercury:', '');
          matches.push(`@mercury/${componentName}/${componentName}.twig`);
        } else {
          matches.push(dep);
        }
      }
      return matches;
    });
    return deps;
  };

  const processFile = (filePath, processed = new Set()) => {
    if (processed.has(filePath)) {
      return [];
    }
    processed.add(filePath);

    const fileInfo = findFileInNamespaces(filePath);
    if (!fileInfo) {
      return [];
    }

    try {
      const content = fs.readFileSync(fileInfo.path, 'utf8');
      
      // Get Twig dependencies from the content
      const twigDeps = extractDependencies(content);
      
      // Process each Twig dependency recursively and collect their JS files
      const twigDepResults = twigDeps.flatMap(dep => {
        // If it's a mercury: dependency, convert it to the proper format
        if (dep.startsWith('mercury:')) {
          const componentName = dep.replace('mercury:', '');
          const twigPath = `@mercury/${componentName}/${componentName}.twig`;
          return processFile(twigPath, processed);
        }
        return processFile(dep, processed);
      });

      // Get the JS file for the current component if it exists
      const jsPath = getJsPath(fileInfo.path);
      
      // Return all JS paths (current component + twig dependencies)
      return jsPath ? [jsPath, ...twigDepResults] : twigDepResults;
    } catch (error) {
      console.warn(`Warning: Could not process file ${filePath}: ${error.message}`);
      return [];
    }
  };

  // Process all component files and get unique JS paths
  const jsFiles = [...new Set(componentFiles.flatMap(file => processFile(file)))];
  
  return jsFiles;
}

function nameFormatsFromSlug(slug, friendlyTitle = null) {
  const kebabCase = slug.toLowerCase();
  const camelCase = kebabCase.split('-').map(
    (word, index) => index === 0 ? word : word.slice(0, 1).toUpperCase() + word.slice(1)
  ).join('');
  const pascalCase = camelCase.slice(0, 1).toLocaleUpperCase() + camelCase.slice(1);
  const titleCase = friendlyTitle || kebabCase.split('-').map(word => word.slice(0, 1).toLocaleUpperCase() + word.slice(1)).join(' ');

  return {
    original: slug,
    kebabCase,
    camelCase,
    pascalCase,
    titleCase,
  };
}

/**
 * Generate story content for a component
 * @param {string} componentPath - Path to the component
 * @param {string} componentName - Name of the component
 * @param {boolean} includeJs - Whether to include JS imports
 * @returns {string} - Story content
 */
function generateStoryContent(namespaces, componentPath, componentName, includeJs = true) {

  let name = nameFormatsFromSlug(componentName);

  const yamlFilePath = path.join(componentPath, `${name.kebabCase}.component.yml`);
  const storybookYamlFilePath = path.join(componentPath, `${name.kebabCase}.storybook.yml`);
  const cssFilePath = path.join(componentPath, `${name.kebabCase}.css`);
  const jsFilePath = path.join(componentPath, `${name.kebabCase}.js`);

  const hasStorybookYamlFile = fs.existsSync(storybookYamlFilePath);
  const hasCssFile = fs.existsSync(cssFilePath);
  const hasJsFile = fs.existsSync(jsFilePath);

  const variantRegExp = new RegExp(`^${name.kebabCase}\~(.*)\.twig$`);
  const variantPaths = fs.readdirSync(componentPath).filter(filename => variantRegExp.test(filename));
  const componentPaths = [`${name.kebabCase}.twig`].concat(variantPaths);
  const componentDependencies = getComponentDependencies(namespaces, componentPaths);
  if(componentDependencies.length > 0) {
    console.log(`[storybook-generator] Found ${componentDependencies.length} JS dependencies for ${name.original}`);
    console.log(componentDependencies);
  }
  
  // Variables to org components based on .yml
  let metadata = {
    group: null,
    name: null,
  }

  if (fs.existsSync(yamlFilePath)) {
    try {
      const yamlContent = fs.readFileSync(yamlFilePath, 'utf8');
      const parsedYaml = yaml.load(yamlContent);
      metadata.group = parsedYaml?.group ?? null;
      metadata.name = parsedYaml?.name ?? null;
    } catch (error) {
      console.warn(`[storybook-generator] Warning: Could not read SDC YAML for ${name.original}: ${error.message}`);
    }
  }

  // Redo the names now that we have a possible friendly name.
  name = nameFormatsFromSlug(componentName, metadata.name);

  let storybookMetadata = {};

  if (fs.existsSync(storybookYamlFilePath)) {
    try {
      storybookMetadata = yaml.load(fs.readFileSync(storybookYamlFilePath, 'utf8'));
    } catch (error) {
      console.warn(`[storybook-generator] Warning: Could not read Storybook YAML for ${name.original}: ${error.message}`)
    }
  }

  const variants = variantPaths.map(variantPath => {
    const variantSlug = variantPath.match(variantRegExp)[1];

    if (variantSlug.toLocaleLowerCase() === 'main') {
      return {
        withComponent: name,
        withoutComponent: name,
        path: variantPath,
      }
    }

    return {
      withComponent: nameFormatsFromSlug(`${name.original}-${variantSlug}`),
      withoutComponent: nameFormatsFromSlug(`${variantSlug}`),
      path: variantPath,
    };
  });

  const title = metadata.group ? `${metadata.group}/${metadata.name}` : `Components/${metadata.name}`;

  // Use absolute paths for imports to ensure they work from any location
  const componentRelativePath = path.relative(process.cwd(), componentPath).replace(/\\/g, '/');
  const jsPath = `../../../${componentRelativePath}/${name.kebabCase}.js`;
  const jsPaths = componentDependencies.map(dependency => `../../../${dependency}`);

  // Base imports that are always needed
  let imports = `// Import the YAML metadata and the Twig template
import ${name.camelCase}Metadata from '../../../${componentRelativePath}/${name.kebabCase}.component.yml';`

  // Import the main Twig file only if none of the variants is supposed to take its place.
  if (variants.map(variantNames => variantNames.withComponent.original).indexOf(name.original) === -1) {
    imports += `
import { render as ${name.camelCase}RenderTemplate } from './${componentRelativePath}/${name.original}.twig';
    `;
  }


  // Only add CSS import if the file exists
  if (hasCssFile) {
    imports += `
import '../../../${componentRelativePath}/${name.kebabCase}.css';`;
  }

  if (hasStorybookYamlFile) {
    imports += `
import ${name.camelCase}StorybookMetadata from '../../../${componentRelativePath}/${name.kebabCase}.storybook.yml';
    `
  }

  variants.forEach(variantNames => {
    imports += `
import { render as ${variantNames.withComponent.camelCase}RenderTemplate } from './${componentRelativePath}/${variantNames.path}'
`;
  });

  return `${imports}
import generateArgTypesAndArgs from '/src/common/generateArgTypesAndArgs.js';
import React, { useState, useEffect, useRef, useCallback } from 'react';

let storybookMetadata = {};

try {
  storybookMetadata = ${name.camelCase}StorybookMetadata
} catch {}


const { argTypes, args } = generateArgTypesAndArgs(${name.camelCase}Metadata, '../../../${componentPath}', storybookMetadata);

/**
 * ${name.titleCase} component story.
 */
export default {
  title: '${title}',
  parameters: {
    docs: {
      description: {
        component: '${metadata.name || name.original} component'
      }
    }
  },
  argTypes,
  args
};

// TEMPLATE HERE
${!storybookMetadata?.hide_main ? storyTemplate(name, hasJsFile, includeJs, jsPaths) : ''}
${variants.map(variantNames => storyTemplate(variantNames.withComponent, hasJsFile, includeJs, jsPaths)).join('\n')}
`;
}

/**
 * Vite plugin for generating Storybook stories in a separate directory.
 */
export default function storybookGenerator(options = {}) {
  const {
    componentsDir = 'components',
    includeJs = true,
    storiesDir = './src/stories/sdc-stories',
    namespaces = {}
  } = options;

  const plugin = {
    name: 'vite-plugin-storybook-generator',

    generateStoryForComponent(namespaces, componentDir) {
      const name = nameFormatsFromSlug(path.basename(componentDir));

      // Check if the component has the required files.
      const hasYaml = fs.existsSync(path.join(componentDir, `${name.kebabCase}.component.yml`));
      const hasTwig = fs.existsSync(path.join(componentDir, `${name.kebabCase}.twig`));

      // Skip if any required file is missing.
      if (!hasYaml || !hasTwig) {
        console.warn(`[storybook-generator] Skipping ${name.original}: missing required files (YAML or Twig)`);
        return;
      }

      try {
        // Generate the story content.
        const storyContent = generateStoryContent(namespaces, componentDir, name.original, includeJs);

        // Create story file path in the separate directory.
        const absoluteStoriesDir = path.resolve(storiesDir);
        if (!fs.existsSync(absoluteStoriesDir)) {
          fs.mkdirSync(absoluteStoriesDir, { recursive: true });
        }

        const storyFilePath = path.join(absoluteStoriesDir, `${name.kebabCase}.stories.jsx`);

        // Write the story file to the separate directory.
        fs.writeFileSync(storyFilePath, storyContent);
        console.log(`[storybook-generator] Generated story file for ${name.original} at ${storyFilePath}`);
      } catch (error) {
        console.error(`[storybook-generator] Error generating story for ${name.original}:`, error);
      }
    },

    generateAllStoryFiles() {
      // Ensure the stories directory exists.
      const absoluteStoriesDir = path.resolve(storiesDir);
      if (!fs.existsSync(absoluteStoriesDir)) {
        fs.mkdirSync(absoluteStoriesDir, { recursive: true });
      } else {
        // Clean up old story files.
        const oldStoryFiles = glob.sync(`${absoluteStoriesDir}/*.stories.js`);
        oldStoryFiles.forEach(file => {
          fs.unlinkSync(file);
        });
        console.log(`[storybook-generator] Cleaned up ${oldStoryFiles.length} old story files`);
      }

      const componentDirs = glob.sync(`${componentsDir}/*/`);
      console.log(`[storybook-generator] Found ${componentDirs.length} component directories`);

      componentDirs.forEach(dir => {
        plugin.generateStoryForComponent(namespaces,dir);
      });

      console.log(`[storybook-generator] All stories generated in ${absoluteStoriesDir}`);
    },

    buildStart() {
      plugin.generateAllStoryFiles();
    },

    configureServer({ watcher }) {
      plugin.generateAllStoryFiles();
      watcher.add(`${componentsDir}/**/*`);
      watcher.on('change', (changedPath) => {
        if (changedPath.includes(componentsDir) && !changedPath.endsWith('.css')) {
          const componentDir = path.dirname(changedPath);
          if (fs.existsSync(componentDir)) {
            console.log(`[storybook-generator] Change detected in ${changedPath}, regenerating story`);
            const componentName = path.basename(componentDir);
            plugin.generateStoryForComponent(`${componentsDir}/${componentName}`);
          }
        }
      });
    }
  };

  return plugin;
}
