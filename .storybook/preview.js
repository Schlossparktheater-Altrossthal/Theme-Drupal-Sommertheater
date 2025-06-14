import parse from 'html-react-parser';
import once from '../src/common/once.js';
import '../src/main.css';
import '../src/overrides.css';
import '../src/ui.css';
import '../src/stories/sdc-stories/components.css';

// Make the `once` function globally available in Storybook.
window.once = once;

/** @type { import('@storybook/react').Preview } */
const preview = {
  parameters: {
    actions: { argTypesRegex: '^on[A-Z].*' },
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
    options: {
      storySort: {
        method: 'alphabetical',
      },
    },
  },
};

export const loaders = [
  async ({ args, originalStoryFn }) => {
    if (originalStoryFn.render) {
      const component = parse(await originalStoryFn.render(args));
      return { component };
    }
  },
];

export default preview;
