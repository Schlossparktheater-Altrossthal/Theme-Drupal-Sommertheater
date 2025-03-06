/** @type { import('@storybook/react-vite').StorybookConfig } */

const config = {
  stories: [
    "../src/**/*.mdx", 
    "../src/**/*.stories.@(js|jsx|mjs|ts|tsx)",
    "../src/generated-stories/**/*.stories.js"  // Include our generated stories
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
  viteFinal: (config) => {
    console.log('[storybook] Configuring Vite for Storybook');
    return config;
  },
};
export default config;
