import fs from 'fs';
import path from 'path';
import yaml from 'js-yaml';
import storyTemplate from '../storyTemplate.js';
import getComponentDependencies from './getComponentDependencies.js';
import nameFormatsFromSlug from './nameFormatsFromSlug.js';

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
  let name = nameFormatsFromSlug(componentName);

  const yamlFilePath = path.join(
    componentPath,
    `${name.kebabCase}.component.yml`
  );
  const storybookYamlFilePath = path.join(
    componentPath,
    `${name.kebabCase}.storybook.yml`
  );
  const cssFilePath = path.join(
    componentPath,
    `${name.kebabCase}.tailwind.css`
  );
  const jsFilePath = path.join(componentPath, `${name.kebabCase}.js`);

  const hasStorybookYamlFile = fs.existsSync(storybookYamlFilePath);
  const hasCssFile = fs.existsSync(cssFilePath);
  const hasJsFile = fs.existsSync(jsFilePath);

  const variantRegExp = new RegExp(`^${name.kebabCase}\~(.*)\.twig$`);
  const variantPaths = fs
    .readdirSync(componentPath)
    .filter((filename) => variantRegExp.test(filename));
  const componentPaths = [`${name.kebabCase}.twig`].concat(variantPaths);
  const componentDependencies = getComponentDependencies(
    namespaces,
    componentPaths
  );
  if (componentDependencies.length > 0) {
    console.log(
      `[storybook-generator] Found ${componentDependencies.length} JS dependencies for ${name.original}`
    );
    console.log(componentDependencies);
  }

  // Variables to org components based on .yml
  let metadata = {
    group: null,
    name: null,
  };

  if (fs.existsSync(yamlFilePath)) {
    try {
      const yamlContent = fs.readFileSync(yamlFilePath, 'utf8');
      const parsedYaml = yaml.load(yamlContent);
      metadata.group = parsedYaml?.group ?? null;
      metadata.name = parsedYaml?.name ?? null;
    } catch (error) {
      console.warn(
        `[storybook-generator] Warning: Could not read SDC YAML for ${name.original}: ${error.message}`
      );
    }
  }

  // Redo the names now that we have a possible friendly name.
  name = nameFormatsFromSlug(componentName, metadata.name);

  let storybookMetadata = {};

  if (fs.existsSync(storybookYamlFilePath)) {
    try {
      storybookMetadata = yaml.load(
        fs.readFileSync(storybookYamlFilePath, 'utf8')
      );
    } catch (error) {
      console.warn(
        `[storybook-generator] Warning: Could not read Storybook YAML for ${name.original}: ${error.message}`
      );
    }
  }

  const variants = variantPaths.map((variantPath) => {
    const variantSlug = variantPath.match(variantRegExp)[1];

    if (variantSlug.toLocaleLowerCase() === 'main') {
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

  const title = metadata.group
    ? `${metadata.group}/${metadata.name}`
    : `Components/${metadata.name}`;

  // Use absolute paths for imports to ensure they work from any location
  const componentRelativePath = path
    .relative(process.cwd(), componentPath)
    .replace(/\\/g, '/');
  const jsPath = `../../../${componentRelativePath}/${name.kebabCase}.js`;
  const jsPaths = componentDependencies.map(
    (dependency) => `../../../${dependency}`
  );

  // Base imports that are always needed
  let imports = `// Import the YAML metadata and the Twig template
import ${name.camelCase}Metadata from '../../../${componentRelativePath}/${name.kebabCase}.component.yml';`;

  // Import the main Twig file only if none of the variants is supposed to take its place.
  if (
    variants
      .map((variantNames) => variantNames.withComponent.original)
      .indexOf(name.original) === -1
  ) {
    imports += `
import { render as ${name.camelCase}RenderTemplate } from './${componentRelativePath}/${name.original}.twig';
    `;
  }

  // Only add CSS import if the file exists
  if (hasCssFile) {
    imports += `
import '../../../${componentRelativePath}/${name.kebabCase}.tailwind.css';`;
  }

  if (hasStorybookYamlFile) {
    imports += `
import ${name.camelCase}StorybookMetadata from '../../../${componentRelativePath}/${name.kebabCase}.storybook.yml';
    `;
  }

  variants.forEach((variantNames) => {
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
${
  !storybookMetadata?.hide_main
    ? storyTemplate(name, hasJsFile, includeJs, jsPaths)
    : ''
}
${variants
  .map((variantNames) =>
    storyTemplate(variantNames.withComponent, hasJsFile, includeJs, jsPaths)
  )
  .join('\n')}
`;
}
