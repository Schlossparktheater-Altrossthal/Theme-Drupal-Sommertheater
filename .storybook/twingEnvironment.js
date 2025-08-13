import path from 'path';
import { createEnvironment, createFunction, createFilesystemLoader, createFilter } from 'twing';
import customFunctions from '../vitePlugins/twingCustoms/functions.js';
import * as fs from 'fs';

const namespacePaths = [
  '../'
];

const loader = createFilesystemLoader(fs);
const environment = createEnvironment(loader);

// In storybook we get this returned as an instance of TwigLoaderNull
if (typeof loader.addPath === "function") {
    namespacePaths.forEach(namespacePath => {
      loader.addPath(path.resolve(import.meta.url, namespacePath), 'mercury');
    });
}
customFunctions.forEach(customFunction => environment.addFunction(customFunction));

environment.addFilter(createFilter('t', function (t) { return Promise.resolve(t); }));
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
