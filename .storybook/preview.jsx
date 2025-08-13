import parse from 'html-react-parser';
import once from '@drupal/once';
import React from 'react';
import '../src/main.css';
import '../src/schemes.css';
import '../src/ui.css';
import '../src/stories/sdc-stories/components.css';

// Make the `once` function globally available in Storybook.
window.once = once;

const wrapperClasses = [
  {
    key: 'mercury-scheme--vanilla-light',
    title: 'Vanilla Light',
  },
  {
    key: 'mercury-scheme--vanilla-dark',
    title: 'Vanilla Dark',
  },
  {
    key: 'mercury-scheme--byte-light',
    title: 'Byte Light',
  },
  {
    key: 'mercury-scheme--byte-dark',
    title: 'Byte Dark',
  }
];

const WithTheme = (Story, context) => {
  let { scheme } = context.globals;
  scheme = scheme || wrapperClasses[0].key;

  React.useLayoutEffect(() => {
    const rootEl = document.documentElement;

    rootEl.classList.remove(...wrapperClasses.map(c => c.key));
    rootEl.classList.add(scheme);
  });

  return <Story />;
}

/** @type { import('@storybook/react').Preview } */
const preview = {
  parameters: {
    actions: { argTypesRegex: '^on[A-Z].*' },
    backgrounds: {},
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
    layout: 'fullscreen',
    options: {
      storySort: {
        method: 'alphabetical',
      },
    },
  },
  decorators: [WithTheme],
  globalTypes: {
    scheme: {
      description: 'Mercury Scheme',
      defaultValue: wrapperClasses[0].key,
      toolbar: {
        title: 'Scheme',
        icon: 'circlehollow',
        items: wrapperClasses.map(c => ({
          value: c.key,
          title: c.title,
          icon: 'circle',
        }) ),
        dynamicTitle: true,
      }
    }
  }
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
