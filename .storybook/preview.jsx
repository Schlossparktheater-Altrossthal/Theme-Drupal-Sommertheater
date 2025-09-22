import parse from 'html-react-parser';
import once from '@drupal/once';
import React from 'react';
import '../src/globals.css';
import '../src/main.css';
import '../src/schemes.css';
import '../src/fonts.css';
import '../src/phosphor-icons.css';
import '../src/ui.css';
import '../src/stories/sdc-stories/components.css';

// Make the `once` function globally available in Storybook.
window.once = once;

const schemes = [
  {
    key: 'vanilla-light',
    title: 'Vanilla Light',
  },
  {
    key: 'vanilla-dark',
    title: 'Vanilla Dark',
  },
  {
    key: 'byte-light',
    title: 'Byte Light',
  },
  {
    key: 'byte-dark',
    title: 'Byte Dark',
  }
];

const wrapperClasses = schemes.map(s => `mercury-scheme--${s.key}`);

const wrapperClassesByScheme = schemes.reduce(
  (cumu, cur) => {
    cumu[cur.key] = `mercury-scheme--${cur.key}`
    return cumu;
  },
  {}
);

const WithScheme = (Story, context) => {
  let { scheme } = context.globals;
  scheme = scheme || wrapperClasses[0].key;

  React.useLayoutEffect(() => {
    const rootEl = document.documentElement;

    rootEl.classList.remove(...wrapperClasses);
    rootEl.classList.add(wrapperClassesByScheme[scheme]);

    document.querySelectorAll(`img[data-${scheme}-src]`).forEach(
      el => {
        el.src = el.getAttribute(`data-${scheme}-src`);
      }
    )
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
  decorators: [WithScheme],
  globalTypes: {
    scheme: {
      description: 'Mercury Scheme',
      defaultValue: wrapperClasses[0].key,
      toolbar: {
        title: 'Scheme',
        icon: 'circlehollow',
        items: schemes.map(c => ({
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
