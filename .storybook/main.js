/** @type { import('@storybook/react-vite').StorybookConfig } */

const config = {
  stories: ["../src/**/*.mdx", "../src/**/*.stories.@(js|jsx|mjs|ts|tsx)"],
  staticDirs: ["../public"],
  addons: ["@storybook/addon-a11y", "@storybook/addon-docs"],
  framework: {
    name: "@storybook/react-vite",
    options: {},
  },
  core: {
    builder: "@storybook/builder-vite",
  },

  // Configure Vite for Storybook
  viteFinal: (config, { configType }) => {
    console.log(`[storybook] Configuring Vite for Storybook (${configType})`);

    return config;
  },
};
export default config;
