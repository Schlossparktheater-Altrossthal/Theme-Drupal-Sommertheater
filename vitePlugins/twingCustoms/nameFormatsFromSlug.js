/**
 * Generate various name formats from a component slug
 * @param {string} slug - The component slug (kebab-case)
 * @param {string|null} friendlyTitle - Optional friendly title override
 * @returns {Object} - Object containing different name formats
 */
export default function nameFormatsFromSlug(slug, friendlyTitle = null) {
  const kebabCase = slug.toLowerCase();
  const camelCase = kebabCase
    .split('-')
    .map((word, index) =>
      index === 0 ? word : word.slice(0, 1).toUpperCase() + word.slice(1)
    )
    .join('');
  const pascalCase =
    camelCase.slice(0, 1).toLocaleUpperCase() + camelCase.slice(1);
  const titleCase =
    friendlyTitle ||
    kebabCase
      .split('-')
      .map((word) => word.slice(0, 1).toLocaleUpperCase() + word.slice(1))
      .join(' ');

  return {
    original: slug,
    kebabCase,
    camelCase,
    pascalCase,
    titleCase,
  };
}
