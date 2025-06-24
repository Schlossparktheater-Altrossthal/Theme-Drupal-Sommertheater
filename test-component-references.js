import getComponentReferences from './vitePlugins/twingCustoms/getComponentReferences.js';

// Test the function with the user's specific case
const namespaces = {
  mercury: [
    '/Users/dantecastillo/Projects/MediaCurrent/xb-drupal-theme/components',
    '/Users/dantecastillo/Projects/MediaCurrent/xb-drupal-theme/templates',
  ],
};

const componentFiles = [
  '/Users/dantecastillo/Projects/MediaCurrent/xb-drupal-theme/components/link/link.twig',
];

console.log('Testing getComponentReferences with:');
console.log('Namespaces:', JSON.stringify(namespaces, null, 2));
console.log('Component files:', componentFiles);
console.log('');

try {
  const result = getComponentReferences(namespaces, componentFiles);
  console.log('Result:', result);

  if (result && result.length > 0) {
    console.log('✅ Function returned references successfully');
  } else {
    console.log('❌ Function returned empty or null result');
  }
} catch (error) {
  console.error('❌ Error occurred:', error.message);
}
