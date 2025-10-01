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
function fileExistenceFromFilePaths(filePaths) {
  return {
    hasComponentYamlFile: fs.existsSync(filePaths.yamlFile),
    hasStorybookYamlFile: fs.existsSync(filePaths.storybookYamlFile),
    hasCssFile: fs.existsSync(filePaths.cssFile),
    hasJsFile: fs.existsSync(filePaths.jsFile),
  };
}

/**
 * Read and parse YAML metadata from component file
 * @param {Object} filePaths - Object containing file paths
 * @param {Object} fileExistence - Object indicating which files exist
 * @param {string} componentSlug - Component name for error logging
 * @returns {Object} - Parsed metadata with group and name properties
 */
function readComponentMetadata(filePaths, fileExistence, componentSlug) {
  const metadata = { group: null, name: null };

  if (!fileExistence.hasComponentYamlFile && !fileExistence.hasStorybookYamlFile) {
    return metadata;
  }

  try {
    let highestPriorityMetadata = null;
    if (fileExistence.hasComponentYamlFile) {
      highestPriorityMetadata = yaml.load(fs.readFileSync(filePaths.yamlFile, 'utf8'));
    } else {
      highestPriorityMetadata = yaml.load(fs.readFileSync(filePaths.storybookYamlFile, 'utf8'));
    }
    metadata.group = highestPriorityMetadata?.group ?? null;
    metadata.name = highestPriorityMetadata?.name ?? null;
  } catch (error) {
    console.warn(
      `[storybook-generator] Warning: Could not read SDC YAML for ${componentSlug}: ${error.message}`
    );
  }

  return metadata;
}

/**
 * Read and parse Storybook YAML metadata
 * @param {string} storybookYamlFilePath - Path to the Storybook YAML file
 * @param {string} componentSlug - Component name for error logging
 * @returns {Object} - Parsed Storybook metadata
 */
function readStorybookMetadata(storybookYamlFilePath, componentSlug) {
  if (!fs.existsSync(storybookYamlFilePath)) {
    return {};
  }

  try {
    return yaml.load(fs.readFileSync(storybookYamlFilePath, 'utf8'));
  } catch (error) {
    console.warn(
      `[storybook-generator] Warning: Could not read Storybook YAML for ${componentSlug}: ${error.message}`
    );
    return {};
  }
}

/**
 * Find and process component variants
 * @param {string} componentPath - Path to the component directory
 * @param {string} kebabCaseName - Kebab case component name
 * @param {Object} nameFormats - Name formats object
 * @returns {Array} - Array of variant objects
 */
function processComponentVariants(componentPath, kebabCaseName, nameFormats) {
  const variantRegExp = new RegExp(`^${kebabCaseName}~(.*)\.twig$`);
  const variantPaths = fs
    .readdirSync(componentPath)
    .filter((filename) => variantRegExp.test(filename));

  return variantPaths.map((variantPath) => {
    const variantSlug = variantPath.match(variantRegExp)[1];

    if (variantSlug.toLowerCase() === 'main') {
      return {
        withComponent: nameFormats,
        withoutComponent: nameFormats,
        path: variantPath,
      };
    }

    return {
      withComponent: nameFormatsFromSlug(`${nameFormats.original}-${variantSlug}`),
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
  nameFormats,
  componentRelativePath,
  fileExistence,
  variants,
}) {
  let imports = '';

  if (fileExistence.hasComponentYamlFile) {
    imports += `// Import the YAML metadata and the Twig template
import ${nameFormats.camelCase}Metadata from '../../../${componentRelativePath}/${nameFormats.kebabCase}.component.yml';`;
  }

  // Import the main Twig file only if none of the variants is supposed to take its place
  const shouldImportMainTemplate = !variants.some(
    (variant) => variant.withComponent.original === nameFormats.original
  );

  if (shouldImportMainTemplate) {
    imports += `
import { render as ${nameFormats.camelCase}RenderTemplate } from './${componentRelativePath}/${nameFormats.original}.twig';`;
  }

  if (fileExistence.hasCssFile) {
    imports += `
import '../../../${componentRelativePath}/${nameFormats.kebabCase}.tailwind.css';`;
  }

  if (fileExistence.hasStorybookYamlFile) {
    imports += `
import ${nameFormats.camelCase}StorybookMetadata from '../../../${componentRelativePath}/${nameFormats.kebabCase}.storybook.yml';`;
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
  nameFormats,
  metadata,
  componentRelativePath,
  storybookMetadata,
  variants,
  fileExistence,
  includeJs,
  jsPaths,
}) {
  const title = metadata.group
    ? `${metadata.group}/${metadata.name}`
    : `Components/${metadata.name}`;

  const mainStory = !storybookMetadata?.hide_main
    ? storyTemplate(nameFormats, fileExistence.hasJsFile, includeJs, jsPaths)
    : '';

  const variantStories = variants
    .map((variant) =>
      storyTemplate(variant.withComponent, fileExistence.hasJsFile, includeJs, jsPaths)
    )
    .join('\n');

  let componentMetadataStub = '';

  componentMetadataStub = fileExistence.hasComponentYamlFile ? '' : `const ${nameFormats.camelCase}Metadata = {};`;

  return `
import generateArgTypesAndArgs from '/src/common/generateArgTypesAndArgs.js';
import React, { useState, useEffect, useRef, useCallback } from 'react';

${componentMetadataStub}

let storybookMetadata = {};

try {
  storybookMetadata = ${nameFormats.camelCase}StorybookMetadata
} catch {}

const { argTypes, args } = generateArgTypesAndArgs(${
    nameFormats.camelCase
  }Metadata, '${componentRelativePath}', storybookMetadata);

/**
 * ${nameFormats.titleCase} component story.
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
 * Generate story content for a component
 * @param {Object} namespaces - Namespace configuration
 * @param {string} componentPath - Path to the component
 * @param {string} componentSlug - Name of the component
 * @param {boolean} includeJs - Whether to include JS imports
 * @returns {string} - Story content
 */
export default function generateStoryContent(
  namespaces,
  componentPath,
  componentSlug,
  includeJs = true
) {
  let nameFormats = nameFormatsFromSlug(componentSlug);
  const filePaths = generateFilePaths(componentPath, nameFormats.kebabCase);
  const fileExistence = fileExistenceFromFilePaths(filePaths);

  // Process variants and dependencies
  const variants = processComponentVariants(
    componentPath,
    nameFormats.kebabCase,
    nameFormats
  );
  const componentPaths = [`@mercury/components/${nameFormats.kebabCase}/${nameFormats.kebabCase}.twig`].concat(
    variants.map((v) => `@mercury/components/${nameFormats.kebabCase}/${v.path}`)
  );
  const componentDependencies = getComponentDependencies(
    namespaces,
    componentPaths
  );

  // Read metadata
  const metadata = readComponentMetadata(filePaths, fileExistence, nameFormats.original);

  // Update name formats with friendly name from metadata
  nameFormats = nameFormatsFromSlug(componentSlug, metadata.name);

  // Read Storybook metadata
  const storybookMetadata = readStorybookMetadata(
    filePaths.storybookYamlFile,
    nameFormats.original
  );

  if (storybookMetadata.hide_from_storybook) {
    return false;
  }

  // Generate paths for imports
  const componentRelativePath = path
    .relative(process.cwd(), componentPath)
    .replace(/\\/g, '/');
  const jsPaths = componentDependencies.map(
    (dependency) => `../../../${dependency}`
  );

  // Generate import statements
  const imports = generateImportStatements({
    nameFormats,
    componentRelativePath,
    fileExistence,
    variants,
  });

  // Generate story template
  const storyContent = generateStoryTemplate({
    nameFormats,
    metadata,
    componentRelativePath,
    storybookMetadata,
    variants,
    fileExistence,
    includeJs,
    jsPaths,
  });

  return imports + storyContent;
}
