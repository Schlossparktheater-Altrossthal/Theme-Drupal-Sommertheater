## Mercury & Storybook

If you want to run Storybook locally for component development, [ensure all dependencies are installed](../README.md), then run the following command:

```shell
pnpm run storybook
````

Mercury also includes a Vite plugin that automatically generates Storybook stories for your components based on their YAML metadata.

## Installation

1. Make sure you have the required dependencies:

```shell
npm install glob --save-dev
```

2. Copy the `vite-plugin-storybook-generator.js` file to your project root or plugins directory.

## Usage

To set up the Storybook plugin for Vite, add the it to your `vite.config.js` file:

```javascript
import { defineConfig } from 'vite';
import storybookGenerator from './vite-plugin-storybook-generator';

export default defineConfig({
  plugins: [
    storybookGenerator({
      // Optional: override default options
      componentsDir: 'components', // Default directory containing components
      forceOverwrite: false, // Whether to overwrite existing story files
    }),
    // Your other plugins...
  ],
});
```

## How It Works

The plugin:

1. Scans the components directory for component folders
2. For each component, checks if it has the required files:
    - `[component-name].component.yml` - YAML metadata file
    - `[component-name].twig` - Twig template file
    - `[component-name].css` - CSS file (optional)
    - `[component-name].js` - JavaScript file (optional, imported if exists)
3. Generates a Storybook story file (`[component-name].stories.js`) that:
    - Imports the component's YAML metadata, Twig template, and CSS
    - Conditionally imports the component's JavaScript file if it exists
    - Uses the `generateArgTypesAndArgs` helper to generate Storybook args and argTypes
    - Sets up the story with the Default export using the `twingStory` helper

## Component Structure

The plugin expects components to follow this file structure:

```
components/
├── component-name/
│   ├── component-name.component.yml
│   ├── component-name.twig
│   ├── component-name.css
│   ├── component-name.js (optional)
│   └── component-name.stories.js (will be generated)
```

## Options

- `componentsDir` (string): Path to the directory containing component folders (default: 'components')
- `forceOverwrite` (boolean): Whether to overwrite existing story files (default: false)

## Notes

- The plugin runs during the Vite build process
- It will log information about generated stories and any errors
- If `forceOverwrite` is set to `false`, it will skip components that already have a story file

## Storybook: Variants and custom data

Components may have a `component-name.storybook.yml` file with arbitrary data, which will be available in its Twig files as a top-level `storybook` variable.

Components may also have additional Twig files for variants of the main component. Any file named like `component-name~variant-name.twig` will show up as a variant nested under the main component. (Note the tilde (~) separating the component name from the variable name.) If you wish for one of your variants to replace the main component Twig altogether in Storybook, do two things:

- Add a component-name.storybook.yml file, with `hide_main: true` as a top-level property
- Name your variant file `component-name~main.twig`.

You can see all of the above in action in the Collapsible Section component.
