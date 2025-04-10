/** @type { import('@storybook/react-vite').StorybookConfig } */

const config = {
  stories: [
    "../src/**/*.mdx", 
    "../src/**/*.stories.@(js|jsx|mjs|ts|tsx)",
  ],
  staticDirs: [
    "../public"
  ],
  addons: [
    "@storybook/addon-a11y",
    "@storybook/addon-onboarding",
    "@storybook/addon-essentials",
    "@storybook/addon-interactions",
  ],
  framework: {
    name: "@storybook/react-vite",
    options: {},
  },
  core: {
    builder: '@storybook/builder-vite',
  },
  
  // Configure Vite for Storybook
  viteFinal: (config, { configType }) => {
    console.log(`[storybook] Configuring Vite for Storybook (${configType})`);
    
    // Only run this step during build-storybook (not during development)
    if (configType === 'PRODUCTION') {
      console.log('[storybook] Executing custom build step for production build');
      // Add your custom build step here
      // For example, you could:
      // - Import and run functions from your custom script
      // - Process additional assets
      // - Modify the build configuration
    }
    
    return config;
  },
};
export default config;
