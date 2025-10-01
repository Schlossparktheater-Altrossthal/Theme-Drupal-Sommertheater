import fs from 'fs';
import path from 'path';
import generateStoryContent from './generateStoryContent.js';
import nameFormatsFromSlug from './nameFormatsFromSlug.js';

/**
 * Generate a Storybook story for a single component
 * @param {Object} options - Configuration options
 * @param {Object} options.namespaces - Namespace configuration
 * @param {string} options.storiesDir - Stories output directory
 * @param {boolean} options.includeJs - Whether to include JS imports
 * @param {string} componentDir - Path to the component directory
 */
export default function generateStoryForComponent(options, componentDir) {
  const { namespaces, storiesDir, includeJs } = options;

  const name = nameFormatsFromSlug(path.basename(componentDir));

  // Check if the component has the required files.
  const hasComponentYaml = fs.existsSync(
    path.join(componentDir, `${name.kebabCase}.component.yml`)
  );

  const hasStorybookYaml = fs.existsSync(
    path.join(componentDir, `${name.kebabCase}.storybook.yml`)
  );

  const hasTwig = fs.existsSync(
    path.join(componentDir, `${name.kebabCase}.twig`)
  );

  // Skip if any required file is missing.
  if (
    (!hasComponentYaml && !hasStorybookYaml) ||
    !hasTwig
  ) {
    console.warn(
      `[storybook-generator] Skipping ${name.original}: missing required files (YAML or Twig)`
    );
    return;
  }

  try {
    // Generate the story content.
    const storyContent = generateStoryContent(
      namespaces,
      componentDir,
      name.original,
      includeJs
    );

    if (!storyContent) {
      return;
    }

    // Create story file path in the separate directory.
    const absoluteStoriesDir = path.resolve(storiesDir);
    if (!fs.existsSync(absoluteStoriesDir)) {
      fs.mkdirSync(absoluteStoriesDir, { recursive: true });
    }

    const storyFilePath = path.join(
      absoluteStoriesDir,
      `${name.kebabCase}.stories.jsx`
    );

    // Write the story file to the separate directory.
    fs.writeFileSync(storyFilePath, storyContent);
  } catch (error) {
    console.error(
      `[storybook-generator] Error generating story for ${name.original}:`,
      error
    );
  }
}
