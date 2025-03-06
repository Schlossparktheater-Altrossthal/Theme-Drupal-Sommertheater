import path from 'path';
import { createEnvironment, createFunction, createFilesystemLoader, createFilter } from 'twing';
import * as fs from 'fs';

const namespacePaths = [
  '../components'
];

const loader = createFilesystemLoader(fs);
const environment = createEnvironment(loader);

// In storybook we get this returned as an instance of TwigLoaderNull
if (typeof loader.addPath === "function") {
  // The loader expects aliases to be prefixed with a `@` sign.
  // To import a component, you would include it from `@src/components/../..`
    namespacePaths.forEach(namespacePath => {
      loader.addPath(path.resolve(import.meta.url, namespacePath), 'mercury_theme');
    });
}

environment.addFilter(createFilter('t', function (t) { return Promise.resolve(t); }));
environment.addFunction(
  createFunction(
    '__',
    function (t, n) {
      return Promise.resolve(t);
    },
    [
      { name: 't', default: '' },
      { name: 'n', default: 'mercury-theme' }
    ]
  )
);
environment.addFunction(createFunction('attach_scripts', function (t) { return Promise.resolve(null); }));
environment.addFunction(createFunction('attach_styles', function (t) { return Promise.resolve(null); }));
environment.addFunction(createFunction('attach_library', function (t) { return Promise.resolve(null); }));
environment.addFilter(
  createFilter(
    'clean_class',
    async function (_executionContext, c) {
      return c.replace(/[^a-zA-Z0-9]+/g, '-').replace(/^[0-9]+/, '').toLowerCase();
    },
    [
      { name: 'c', defaultValue: '' },
    ]
  )
);
export default environment;
