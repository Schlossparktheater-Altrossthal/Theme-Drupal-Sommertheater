// plugins/vite-plugin-precompile-twig.js
import { readdirSync, readFileSync, existsSync } from 'fs';
import { resolve, relative, dirname, join } from 'path';
import { fileURLToPath } from 'url';
import getComponentReferences from './twingCustoms/getComponentReferences';

// Get current file directory.
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export default function precompileTwigPlugin(options = {}) {
  const {
    include = /\.twig(\?.*)?$/,
    namespaces = {}, // e.g. { components: 'src/components' } or { components: ['src/components', 'other-components'] }
  } = options;

  // Fix process.cwd() linter error.
  const cwd = typeof process !== 'undefined' ? process.cwd() : '.';

  // Get all template directories from namespaces
  const templateDirs = Object.values(namespaces)?.flatMap((namespace) =>
    Array.isArray(namespace) ? namespace : [namespace]
  );

  // Resolve all template directory paths
  const templateDirPaths = templateDirs.map((dir) => resolve(cwd, dir));

  // Resolve all namespace paths - support multiple directories per namespace
  const resolvedNamespaces = {};
  Object.entries(namespaces).forEach(([namespace, paths]) => {
    // Convert to array if a single string is provided
    const pathsArray = Array.isArray(paths) ? paths : [paths];
    // Resolve all paths for this namespace
    resolvedNamespaces[namespace] = pathsArray.map((path) =>
      resolve(cwd, path)
    );
  });

  // Function to collect templates from a directory.
  function walk(dir, filemap = {}, prefix = '') {
    try {
      const entries = readdirSync(dir, { withFileTypes: true });
      for (const entry of entries) {
        const full = resolve(dir, entry.name);
        if (entry.isDirectory()) {
          walk(full, filemap, prefix ? `${prefix}/${entry.name}` : entry.name);
        } else if (entry.isFile() && /\.twig$/.test(entry.name)) {
          const relativePath = prefix ? `${prefix}/${entry.name}` : entry.name;
          filemap[relativePath] = readFileSync(full, 'utf8');
        }
      }
    } catch (err) {
      console.warn(`Warning: Could not walk directory ${dir}: ${err.message}`);
    }
    return filemap;
  }

  // Load templates from all directories and namespaces
  function loadAllTemplates() {
    const templates = {};

    // Load templates from all template directories
    templateDirPaths.forEach((dirPath) => {
      try {
        const dirTemplates = walk(dirPath);
        Object.entries(dirTemplates).forEach(([path, content]) => {
          templates[path] = content;
        });
      } catch (err) {
        console.error(
          `Error loading templates from directory "${dirPath}": ${err.message}`
        );
      }
    });

    // Add templates from each namespace (which may have multiple directories).
    Object.entries(resolvedNamespaces).forEach(([namespace, dirPaths]) => {
      // Process each directory path for this namespace
      dirPaths.forEach((dir) => {
        try {
          const namespacedTemplates = walk(dir);
          // Add namespace prefix to all templates from this directory.
          Object.entries(namespacedTemplates).forEach(([path, content]) => {
            templates[`@${namespace}/${path}`] = content;
          });
        } catch (err) {
          console.error(
            `Error loading templates from namespace "${namespace}" directory "${dir}": ${err.message}`
          );
        }
      });
    });

    return templates;
  }

  // Maintain a cache of template sources that we can update during development.
  const templateSources = loadAllTemplates();
  console.log(
    `[Twig] Loaded ${
      Object.keys(templateSources).length
    } templates (including namespaces)`
  );

  // Track which modules import which templates
  const templateToModuleMap = new Map();

  // Utility function to check if a file exists
  function fileExists(filePath) {
    return existsSync(filePath);
  }

  // Improved template resolution function
  function resolveTemplate(path) {
    // If path starts with @, it's a namespaced path
    if (path.startsWith('@')) {
      const [, namespace, ...rest] = path.split('/');
      const namespacePaths = resolvedNamespaces[namespace];
      if (namespacePaths) {
        const relativePath = rest.join('/');

        // Try each directory for this namespace
        for (const dir of namespacePaths) {
          const fullPath = resolve(dir, relativePath);
          if (fileExists(fullPath)) {
            const key = `@${namespace}/${relativePath}`;
            const content = readFileSync(fullPath, 'utf8');
            templateSources[key] = content; // Cache it
            return { key, content };
          }
        }
      }
    }

    // Try to resolve via template directories
    for (const dirPath of templateDirPaths) {
      const fullPath = resolve(dirPath, path);
      if (fileExists(fullPath)) {
        const key = path;
        const content = readFileSync(fullPath, 'utf8');
        templateSources[key] = content; // Cache it
        return { key, content };
      }
    }

    // Try each template directory with a direct relative path
    for (const dirPath of templateDirPaths) {
      if (path.startsWith(dirPath)) {
        const relativePath = relative(dirPath, path).replace(/\\/g, '/');
        if (templateSources[relativePath]) {
          return { key: relativePath, content: templateSources[relativePath] };
        }
      }
    }

    // Try as an absolute path
    if (fileExists(path)) {
      // Find which directory it belongs to
      for (const dirPath of templateDirPaths) {
        if (path.startsWith(dirPath)) {
          const relativePath = relative(dirPath, path).replace(/\\/g, '/');
          const content = readFileSync(path, 'utf8');
          templateSources[relativePath] = content; // Cache it
          return { key: relativePath, content };
        }
      }

      // Check if it belongs to any namespace directory
      for (const [namespace, dirPaths] of Object.entries(resolvedNamespaces)) {
        for (const dir of dirPaths) {
          if (path.startsWith(dir)) {
            const relativePath = relative(dir, path).replace(/\\/g, '/');
            const key = `@${namespace}/${relativePath}`;
            const content = readFileSync(path, 'utf8');
            templateSources[key] = content; // Cache it
            return { key, content };
          }
        }
      }

      // Not under a template directory, use as is
      const content = readFileSync(path, 'utf8');
      templateSources[path] = content; // Cache it
      return { key: path, content };
    }

    // Try namespace directories with direct paths
    for (const [namespace, dirPaths] of Object.entries(resolvedNamespaces)) {
      for (const dir of dirPaths) {
        // Check if path is under this namespace directory
        if (path.startsWith(dir)) {
          const relativePath = relative(dir, path).replace(/\\/g, '/');
          const key = `@${namespace}/${relativePath}`;
          if (templateSources[key]) {
            return { key, content: templateSources[key] };
          }

          // If not in cache but file exists, load it
          if (fileExists(path)) {
            const content = readFileSync(path, 'utf8');
            templateSources[key] = content; // Cache it
            return { key, content };
          }
        }

        // Try path as subdirectory within the namespace
        const fullPath = resolve(dir, path);
        if (fileExists(fullPath)) {
          const content = readFileSync(fullPath, 'utf8');
          const key = `@${namespace}/${path}`;
          templateSources[key] = content; // Cache it
          return { key, content };
        }
      }
    }

    // Last resort: check if any template path ends with the requested path
    const key = Object.keys(templateSources).find((k) =>
      k.endsWith(path.replace(/\\/g, '/'))
    );
    if (key) {
      return { key, content: templateSources[key] };
    }

    return null;
  }

  // Helper function to resolve a template and handle errors
  function resolveTemplateWithErrorHandling(filePath) {
    try {
      const resolved = resolveTemplate(filePath);
      if (!resolved) {
        console.warn(`[HMR] Could not resolve template: ${filePath}`);
        return null;
      }
      return resolved;
    } catch (error) {
      console.error(
        `[HMR] Error resolving template ${filePath}: ${error.message}`
      );
      return null;
    }
  }

  // Helper function to get all templates that need to be updated
  function getTemplatesForUpdate(originalFile) {
    const originalTemplate = resolveTemplateWithErrorHandling(originalFile);
    if (!originalTemplate) {
      return [];
    }

    const referencingFiles =
      getComponentReferences(resolvedNamespaces, [originalFile]) ?? [];
    const referencingTemplates = referencingFiles
      .map((file) => resolveTemplateWithErrorHandling(file))
      .filter((template) => template !== null);

    return [originalTemplate, ...referencingTemplates];
  }

  // Helper function to update template cache
  function updateTemplateCache(templates) {
    templates.forEach((template) => {
      console.log(`[HMR] Updating template cache: ${template.key}`);
      templateSources[template.key] = template.content;
    });
  }

  // Helper function to find affected modules
  function findAffectedModules(server, templateKeys) {
    const affectedModules = [];
    const seenModuleIds = new Set();

    for (const moduleId of server.moduleGraph.idToModuleMap.keys()) {
      const module = server.moduleGraph.getModuleById(moduleId);

      if (
        isModuleAffectedByTemplates(module, templateKeys) &&
        !seenModuleIds.has(moduleId)
      ) {
        affectedModules.push(module);
        seenModuleIds.add(moduleId);
      }
    }
    return affectedModules;
  }

  // Helper function to check if a module is affected by template changes
  function isModuleAffectedByTemplates(module, templateKeys) {
    return (
      module &&
      module.file &&
      module.file.endsWith('.twig') &&
      templateKeys.some((key) => key.endsWith(module.file))
    );
  }

  // Helper function to emit HMR completion event
  function emitHMRCompletionEvent(server, originalFile) {
    setTimeout(() => {
      server.ws.send('twig-compilation-complete', {
        file: originalFile,
        key: originalFile,
        timestamp: Date.now(),
      });
    }, 0);
  }

  return {
    name: 'vite-plugin-precompile-twig',
    enforce: 'pre',

    resolveId(importee) {
      return include.test(importee) ? importee : null;
    },

    load(id) {
      const clean = id.split('?')[0];
      if (!include.test(clean)) return null;

      // Use the improved resolution function.
      console.log(`[Twig] Resolving template: ${clean}`);
      const resolved = resolveTemplate(clean);

      if (!resolved) {
        console.error(`Cannot find template: ${clean}`);
        console.error(
          `Available templates: ${Object.keys(templateSources).join(', ')}`
        );
        console.error(`Template directories: ${templateDirPaths.join(', ')}`);
        console.error(`Namespaces: ${JSON.stringify(resolvedNamespaces)}`);
        this.error(`Cannot find template: ${clean}`);
      }

      const { key } = resolved;

      // Track this module for HMR
      if (!templateToModuleMap.has(key)) {
        templateToModuleMap.set(key, new Set());
      }
      templateToModuleMap.get(key).add(id);

      // Create a JSON object with ALL templates.
      const allSourcesString = Object.entries(templateSources)
        .map(
          ([templateKey, templateContent]) =>
            `'${templateKey}': ${JSON.stringify(templateContent)}`
        )
        .join(',\n    ');

      const twingNamespacesString = Object.keys(resolvedNamespaces)
        .map(
          (namespace) =>
            `'${namespace}': ${JSON.stringify(resolvedNamespaces[namespace])}`
        )
        .join(',\n    ');

      // Generate a module that uses the ESM-friendly Twing APIs
      // and creates direct imports of the custom functions/filters
      return `
        import { createArrayLoader, createEnvironment } from 'twing';
        import createSDCLoader from '/${relative(
          cwd,
          resolve(__dirname, './twingCustoms/createSDCLoader.js')
        )}';
        import functions from '/${relative(
          cwd,
          resolve(__dirname, './twingCustoms/functions.js')
        )}';
        import filters from '/${relative(
          cwd,
          resolve(__dirname, './twingCustoms/filters.js')
        )}';
        
        // Include all templates, including namespaced ones.
        const allSources = {
          ${allSourcesString}
        };

        const twingNamespaces = {
          ${twingNamespacesString}
        };
        
        // Create a loader and environment.
        const loader = createSDCLoader(allSources, twingNamespaces);
        const env = createEnvironment(loader);
        
        // Add functions and filters directly.
        for (const func of functions) {
          env.addFunction(func);
        }
        
        for (const filter of filters) {
          env.addFilter(filter);
        }
        
        /**
         * Renders the preloaded Twig template.
         * @param {Object} context - the Twig context
         * @returns {Promise<string>}
         */
        export function render(context = {}) {
          return env.render('${key}', context);
        }

        // Add default export to support both import styles.
        export default render;
      `;
    },

    // HMR implementation - main entry point
    handleHotUpdate({ file, server }) {
      if (!file.endsWith('.twig')) {
        return;
      }

      console.log(`[HMR] Processing Twig file change: ${file}`);

      try {
        const templatesToUpdate = getTemplatesForUpdate(file);

        if (templatesToUpdate.length === 0) {
          console.warn(`[HMR] No templates to update for: ${file}`);
          return [];
        }

        updateTemplateCache(templatesToUpdate);

        const templateKeys = templatesToUpdate.map((template) => template.key);
        const affectedModules = findAffectedModules(server, templateKeys);

        console.log(`[HMR] Found ${affectedModules.length} affected modules`);

        emitHMRCompletionEvent(server, file);

        return affectedModules;
      } catch (error) {
        console.error(
          `[HMR] Error processing template update for ${file}: ${error.message}`
        );
        return [];
      }
    },
  };
}
