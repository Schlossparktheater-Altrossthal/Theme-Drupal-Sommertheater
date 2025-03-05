# Storybook Generator Vite Plugin

This Vite plugin automatically generates Storybook stories for your components based on their YAML metadata.

## Installation

1. Make sure you have the required dependencies:

```bash
npm install glob --save-dev
```

2. Copy the `vite-plugin-storybook-generator.js` file to your project root or plugins directory.

## Usage

Add the plugin to your `vite.config.js` file:

```javascript
import { defineConfig } from 'vite';
import storybookGenerator from './vite-plugin-storybook-generator';

export default defineConfig({
  plugins: [
    storybookGenerator({
      // Optional: override default options
      componentsDir: 'components',   // Default directory containing components
      forceOverwrite: false,         // Whether to overwrite existing story files
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
3. Generates a Storybook story file (`[component-name].stories.js`) that:
   - Imports the component's YAML metadata, Twig template, and CSS
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
│   └── component-name.stories.js (will be generated)
```

## Options

- `componentsDir` (string): Path to the directory containing component folders (default: 'components')
- `forceOverwrite` (boolean): Whether to overwrite existing story files (default: false)

## Notes

- The plugin runs during the Vite build process
- It will log information about generated stories and any errors
- If `forceOverwrite` is set to `false`, it will skip components that already have a story file 