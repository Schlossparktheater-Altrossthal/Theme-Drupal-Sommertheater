// plugins/vite-plugin-precompile-twig.js
import { readdirSync, readFileSync } from 'fs';
import { resolve, relative, dirname } from 'path';
import { fileURLToPath } from 'url';

// Get current file directory.
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export default function precompileTwigPlugin(options = {}) {
  const {
    templatesDir = 'src/templates',
    include = /\.twig(\?.*)?$/,
    namespaces = {} // e.g. { components: 'src/components' }
  } = options;

  // Fix process.cwd() linter error.
  const cwd = typeof process !== 'undefined' ? process.cwd() : '.';
  const templateDirPath = resolve(cwd, templatesDir);
  
  // Resolve all namespace paths.
  const resolvedNamespaces = {};
  Object.entries(namespaces).forEach(([namespace, path]) => {
    resolvedNamespaces[namespace] = resolve(cwd, path);
  });

  // Function to collect templates from a directory.
  function walk(dir, filemap = {}, prefix = '') {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const full = resolve(dir, entry.name);
      if (entry.isDirectory()) {
        walk(full, filemap, prefix ? `${prefix}/${entry.name}` : entry.name);
      } else if (entry.isFile() && /\.twig$/.test(entry.name)) {
        const relativePath = prefix ? `${prefix}/${entry.name}` : entry.name;
        filemap[relativePath] = readFileSync(full, 'utf8');
      }
    }
    return filemap;
  }
  
  // Load templates from main directory and all namespaces
  function loadAllTemplates() {
    // Start with main templates directory
    const templates = walk(templateDirPath);
    
    // Add templates from each namespace.
    Object.entries(resolvedNamespaces).forEach(([namespace, dir]) => {
      try {
        const namespacedTemplates = walk(dir);
        // Add namespace prefix to all templates from this directory.
        Object.entries(namespacedTemplates).forEach(([path, content]) => {
          templates[`@${namespace}/${path}`] = content;
        });
      } catch (err) {
        console.error(`Error loading templates from namespace "${namespace}": ${err.message}`);
      }
    });
    
    return templates;
  }
  
  // Maintain a cache of template sources that we can update during development.
  const templateSources = loadAllTemplates();
  console.log(`[Twig] Loaded ${Object.keys(templateSources).length} templates (including namespaces)`);
  
  // Track which modules import which templates
  const templateToModuleMap = new Map();

  return {
    name: 'vite-plugin-precompile-twig',
    enforce: 'pre',

    resolveId(importee) {
      return include.test(importee) ? importee : null;
    },

    load(id) {
      const clean = id.split('?')[0];
      if (!include.test(clean)) return null;

      // Try to find this template in our sources.
      // First check if it's a direct match by path.
      let key = relative(templateDirPath, clean).replace(/\\/g, '/');
    
      let content = templateSources[key];
      
      // If not found directly, see if it's a namespaced template.
      if (!content) {
        // Check if it's under any of our namespace directories.
        for (const [namespace, dir] of Object.entries(resolvedNamespaces)) {
          if (clean.startsWith(dir)) {
            const relPath = relative(dir, clean).replace(/\\/g, '/');
            key = `@${namespace}/${relPath}`;
            content = templateSources[key];
            if (content) break;
          }
        }
        
        // If still not found, check if it matches any template ending.
        if (!content) {
          key = Object.keys(templateSources).find(k => k.endsWith(clean.replace(/\\/g, '/')));
          content = key ? templateSources[key] : null;
        }
      }
     
      if (content == null) {
        this.error(`Cannot find template: ${clean}`);
      }
      
      // Track this module for HMR
      if (!templateToModuleMap.has(key)) {
        templateToModuleMap.set(key, new Set());
      }
      templateToModuleMap.get(key).add(id);

      // Create a JSON object with ALL templates.
      const allSourcesString = Object.entries(templateSources)
        .map(([templateKey, templateContent]) => 
          `'${templateKey}': ${JSON.stringify(templateContent)}`)
        .join(',\n    ');

      // Generate a module that uses the ESM-friendly Twing APIs 
      // and creates direct imports of the custom functions/filters
      return `
        import { createArrayLoader, createEnvironment } from 'twing';
        import functions from '/${relative(cwd, resolve(__dirname, './twingCustoms/functions.js'))}';
        import filters from '/${relative(cwd, resolve(__dirname, './twingCustoms/filters.js'))}';
        
        // Include all templates, including namespaced ones.
        const allSources = {
          ${allSourcesString}
        };
        
        // Create a loader and environment.
        const loader = createArrayLoader(allSources);
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

    // HMR implementation
    handleHotUpdate({ file, server }) {
      // Only handle .twig files.
      if (!file.endsWith('.twig')) return;
      
      // Figure out the template key.
      let templateKey = '';
      
      // Check if it's in the main templates directory.
      if (file.startsWith(templateDirPath)) {
        templateKey = relative(templateDirPath, file).replace(/\\/g, '/');
      } else {
        // Check if it's in a namespace directory.
        for (const [namespace, dir] of Object.entries(resolvedNamespaces)) {
          if (file.startsWith(dir)) {
            const relPath = relative(dir, file).replace(/\\/g, '/');
            templateKey = `@${namespace}/${relPath}`;
            break;
          }
        }
      }
      
      if (!templateKey) {
        console.warn(`[HMR] Could not determine template key for file: ${file}`);
        return [];
      }
      
      console.log(`[HMR] Twig template updated: ${templateKey}`);
      
      try {
        // Read the updated template content.
        const updatedContent = readFileSync(file, 'utf8');
        
        // Update our template cache.
        templateSources[templateKey] = updatedContent;
        
        // Find modules that import this template.
        const affectedModules = [];
        
        // All modules are affected since they all share templates.
        for (const moduleId of server.moduleGraph.idToModuleMap.keys()) {
          const mod = server.moduleGraph.getModuleById(moduleId);
          if (mod && mod.file && mod.file.endsWith('.twig')) {
            affectedModules.push(mod);
          }
        }
        
        console.log(`[HMR] Reloading ${affectedModules.length} Twig modules`);
        
        // Return affected modules to trigger HMR.
        return affectedModules;
      } catch (err) {
        console.error(`[HMR] Error updating Twig template: ${err.message}`);
      }
      
      // If we reach here, something went wrong.
      return [];
    }
  };
}