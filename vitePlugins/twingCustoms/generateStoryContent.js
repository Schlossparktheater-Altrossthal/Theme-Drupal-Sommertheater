import fs from 'fs';
import path from 'path';
import yaml from 'js-yaml';
import storyTemplate from '../storyTemplate.js';
import getComponentDependencies from './getComponentDependencies.js';
import nameFormatsFromSlug from './nameFormatsFromSlug.js';

/**
 * Generate file paths for component files
 * @param {string} componentPath - Path to the component
 * @param {string} kebabCaseName - Kebab case component name
 * @returns {Object} - Object containing file paths
 */
function generateFilePaths(componentPath, kebabCaseName) {
  return {
    yamlFile: path.join(componentPath, `${kebabCaseName}.component.yml`),
    storybookYamlFile: path.join(
      componentPath,
      `${kebabCaseName}.storybook.yml`
    ),
    cssFile: path.join(componentPath, `${kebabCaseName}.tailwind.css`),
    jsFile: path.join(componentPath, `${kebabCaseName}.js`),
  };
}

/**
 * Check which component files exist
 * @param {Object} filePaths - Object containing file paths
 * @returns {Object} - Object indicating which files exist
 */
function checkFileExistence(filePaths) {
  return {
    hasStorybookYamlFile: fs.existsSync(filePaths.storybookYamlFile),
    hasCssFile: fs.existsSync(filePaths.cssFile),
    hasJsFile: fs.existsSync(filePaths.jsFile),
  };
}

/**
 * Read and parse YAML metadata from component file
 * @param {string} yamlFilePath - Path to the YAML file
 * @param {string} componentName - Component name for error logging
 * @returns {Object} - Parsed metadata with group and name properties
 */
function readComponentMetadata(yamlFilePath, componentName) {
  const metadata = { group: null, name: null };

  if (!fs.existsSync(yamlFilePath)) {
    return metadata;
  }

  try {
    const yamlContent = fs.readFileSync(yamlFilePath, 'utf8');
    const parsedYaml = yaml.load(yamlContent);
    metadata.group = parsedYaml?.group ?? null;
    metadata.name = parsedYaml?.name ?? null;
  } catch (error) {
    console.warn(
      `[storybook-generator] Warning: Could not read SDC YAML for ${componentName}: ${error.message}`
    );
  }

  return metadata;
}

/**
 * Read and parse Storybook YAML metadata
 * @param {string} storybookYamlFilePath - Path to the Storybook YAML file
 * @param {string} componentName - Component name for error logging
 * @returns {Object} - Parsed Storybook metadata
 */
function readStorybookMetadata(storybookYamlFilePath, componentName) {
  if (!fs.existsSync(storybookYamlFilePath)) {
    return {};
  }

  try {
    return yaml.load(fs.readFileSync(storybookYamlFilePath, 'utf8'));
  } catch (error) {
    console.warn(
      `[storybook-generator] Warning: Could not read Storybook YAML for ${componentName}: ${error.message}`
    );
    return {};
  }
}

/**
 * Find and process component variants
 * @param {string} componentPath - Path to the component directory
 * @param {string} kebabCaseName - Kebab case component name
 * @param {Object} name - Name formats object
 * @returns {Array} - Array of variant objects
 */
function processComponentVariants(componentPath, kebabCaseName, name) {
  const variantRegExp = new RegExp(`^${kebabCaseName}~(.*)\.twig$`);
  const variantPaths = fs
    .readdirSync(componentPath)
    .filter((filename) => variantRegExp.test(filename));

  return variantPaths.map((variantPath) => {
    const variantSlug = variantPath.match(variantRegExp)[1];

    if (variantSlug.toLowerCase() === 'main') {
      return {
        withComponent: name,
        withoutComponent: name,
        path: variantPath,
      };
    }

    return {
      withComponent: nameFormatsFromSlug(`${name.original}-${variantSlug}`),
      withoutComponent: nameFormatsFromSlug(`${variantSlug}`),
      path: variantPath,
    };
  });
}

/**
 * Generate import statements for the story file
 * @param {Object} params - Parameters object
 * @returns {string} - Import statements
 */
function generateImportStatements({
  name,
  componentRelativePath,
  hasCssFile,
  hasStorybookYamlFile,
  variants,
  componentDependencies,
}) {
  let imports = `// Import the YAML metadata and the Twig template
import ${name.camelCase}Metadata from '../../../${componentRelativePath}/${name.kebabCase}.component.yml';`;

  // Import the main Twig file only if none of the variants is supposed to take its place
  const shouldImportMainTemplate = !variants.some(
    (variant) => variant.withComponent.original === name.original
  );

  if (shouldImportMainTemplate) {
    imports += `
import { render as ${name.camelCase}RenderTemplate } from './${componentRelativePath}/${name.original}.twig';`;
  }

  if (hasCssFile) {
    imports += `
import '../../../${componentRelativePath}/${name.kebabCase}.tailwind.css';`;
  }

  if (hasStorybookYamlFile) {
    imports += `
import ${name.camelCase}StorybookMetadata from '../../../${componentRelativePath}/${name.kebabCase}.storybook.yml';`;
  }

  variants.forEach((variant) => {
    imports += `
import { render as ${variant.withComponent.camelCase}RenderTemplate } from './${componentRelativePath}/${variant.path}';`;
  });

  return imports;
}

/**
 * Generate the complete story template content
 * @param {Object} params - Parameters object
 * @returns {string} - Complete story template
 */
function generateStoryTemplate({
  name,
  metadata,
  componentRelativePath,
  storybookMetadata,
  variants,
  hasJsFile,
  includeJs,
  jsPaths,
}) {
  const title = metadata.group
    ? `${metadata.group}/${metadata.name}`
    : `Components/${metadata.name}`;

  const mainStory = !storybookMetadata?.hide_main
    ? storyTemplate(name, hasJsFile, includeJs, jsPaths)
    : '';

  const variantStories = variants
    .map((variant) =>
      storyTemplate(variant.withComponent, hasJsFile, includeJs, jsPaths)
    )
    .join('\n');

  return `
import generateArgTypesAndArgs from '/src/common/generateArgTypesAndArgs.js';
import React, { useState, useEffect, useRef, useCallback } from 'react';

let storybookMetadata = {};

try {
  storybookMetadata = ${name.camelCase}StorybookMetadata
} catch {}

const { argTypes, args } = generateArgTypesAndArgs(${
    name.camelCase
  }Metadata, '../../../${componentRelativePath}', storybookMetadata);

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
${mainStory}
${variantStories}
`;
}

/**
 * Log component dependencies if found
 * @param {Array} componentDependencies - Array of component dependencies
 * @param {string} componentName - Component name for logging
 */
function logComponentDependencies(componentDependencies, componentName) {
  if (componentDependencies.length > 0) {
    console.log(
      `[storybook-generator] Found ${componentDependencies.length} JS dependencies for ${componentName}`
    );
    console.log(componentDependencies);
  }
}

/**
 * Generate story content for a component
 * @param {Object} namespaces - Namespace configuration
 * @param {string} componentPath - Path to the component
 * @param {string} componentName - Name of the component
 * @param {boolean} includeJs - Whether to include JS imports
 * @returns {string} - Story content
 */
export default function generateStoryContent(
  namespaces,
  componentPath,
  componentName,
  includeJs = true
) {
  // Generate initial name formats
  let name = nameFormatsFromSlug(componentName);

  // Generate file paths
  const filePaths = generateFilePaths(componentPath, name.kebabCase);

  // Check file existence
  const fileExistence = checkFileExistence(filePaths);

  // Process variants and dependencies
  const variants = processComponentVariants(
    componentPath,
    name.kebabCase,
    name
  );
  const componentPaths = [`${name.kebabCase}.twig`].concat(
    variants.map((v) => v.path)
  );
  const componentDependencies = getComponentDependencies(
    namespaces,
    componentPaths
  );

  logComponentDependencies(componentDependencies, name.original);

  // Read metadata
  const metadata = readComponentMetadata(filePaths.yamlFile, name.original);

  // Update name formats with friendly name from metadata
  name = nameFormatsFromSlug(componentName, metadata.name);

  // Read Storybook metadata
  const storybookMetadata = readStorybookMetadata(
    filePaths.storybookYamlFile,
    name.original
  );

  // Generate paths for imports
  const componentRelativePath = path
    .relative(process.cwd(), componentPath)
    .replace(/\\/g, '/');
  const jsPaths = componentDependencies.map(
    (dependency) => `../../../${dependency}`
  );

  // Generate import statements
  const imports = generateImportStatements({
    name,
    componentRelativePath,
    hasCssFile: fileExistence.hasCssFile,
    hasStorybookYamlFile: fileExistence.hasStorybookYamlFile,
    variants,
    componentDependencies,
  });

  // Generate story template
  const storyContent = generateStoryTemplate({
    name,
    metadata,
    componentRelativePath,
    storybookMetadata,
    variants,
    hasJsFile: fileExistence.hasJsFile,
    includeJs,
    jsPaths,
  });

  return imports + storyContent;
}
