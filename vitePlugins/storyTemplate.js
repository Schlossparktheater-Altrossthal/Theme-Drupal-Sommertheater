/**
 *
 * @param {Object} name An object with `kebabCase`, `camelCase`, `pascalCase`, `titleCase`, and `original` keys.
 * @param {boolean} hasJsFile
 * @param {boolean} includeJs
 * @param {string[]} jsPaths Array of paths to JS files that need to be initialized
 * @returns
 */
export default function storyTemplate(name, hasJsFile, includeJs, jsPaths) {
  return `/**
   * Component template that renders the ${name.original} component with provided args.
   */
  const ${name.pascalCase}Template = (args) => {
    // Component state
    const [html, setHtml] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    // Refs
    const componentRef = useRef(null);
    const initializedModulesRef = useRef(new Set());
    const moduleInstancesRef = useRef(new Map());

    // Memoize args values to use in effect dependencies
    const depsArray = Object.values(args);

    // Render Twig template when args change
    useEffect(() => {
      let isMounted = true;
      setIsLoading(true);

      ${name.camelCase}RenderTemplate(args)
        .then(renderedHtml => {
          if (isMounted) {
            setHtml(renderedHtml);
            setIsLoading(false);
            setError(null);
          }
        })
        .catch(err => {
          if (isMounted) {
            console.error('[Storybook] Error rendering template:', err);
            setError(err.message);
            setIsLoading(false);
          }
        });

      return () => {
        isMounted = false;
      };
    }, depsArray);

    ${
      hasJsFile && includeJs
        ? `
    // Initialize JS when component is rendered
    const initializeComponent = useCallback(async () => {
      
      // Skip if not mounted or still loading
      if (!componentRef.current || isLoading || !html) {
        return;
      }

      // Initialize each JS dependency
      // For production: bundled files are in /assets/, so use ../components/ to reach components
      // For development: use original relative paths
      const jsModules = window.CONFIG_TYPE === 'PRODUCTION' 
        ? [${jsPaths.map((path) => `'${path.replace(/^\.\.\/\.\.\/\.\.\//, "../")}'`).join(", ")}]
        : [${jsPaths.map((path) => `'${path}'`).join(", ")}];
      
      for (const modulePath of jsModules) {
        try {
          // Dynamically import the component JS
          const componentModule = await import(/* @vite-ignore */ modulePath);
    
          // The module import will register the component with window.mercuryComponents
          // We need to manually trigger initialization since we're not in Drupal
          await new Promise(resolve => setTimeout(resolve, 10)); // Small delay to ensure registration
          
          // Find all registered components and initialize them within our container
          if (window.mercuryComponents) {
            Object.values(window.mercuryComponents).forEach(componentType => {
              if (componentType && typeof componentType.initComponent === 'function') {
                if (componentRef.current) {
                  componentType.initComponent(componentRef.current);
                }
              }
            });
          }
          
          moduleInstancesRef.current.set(modulePath, componentModule);
          initializedModulesRef.current.add(modulePath);
        } catch (error) {
          console.error('[Storybook] Failed to initialize module:', modulePath, error);
        }
      }
    }, [html, isLoading]);

    // Run initialization after HTML updates
    useEffect(() => {
    
      
      // Ensure window.mercuryComponents exists
      if (!window.mercuryComponents) {
        window.mercuryComponents = {};
      }

      // Clean up any existing instances before initialization
      if (window.mercuryComponents) {
        Object.values(window.mercuryComponents).forEach(componentType => {
          if (componentType && typeof componentType.removeComponent === 'function') {
            if (componentRef.current) {
              componentType.removeComponent(componentRef.current);
            }
          }
        });
      }

      initializeComponent();

      // Cleanup when unmounting
      return () => {
        if (componentRef.current) {
          // Clean up component instances using the ComponentType's removeComponent method
          if (window.mercuryComponents) {
            Object.values(window.mercuryComponents).forEach(componentType => {
              if (componentType && typeof componentType.removeComponent === 'function') {
                if (componentRef.current) {
                  componentType.removeComponent(componentRef.current);
                }
              }
            });
          }
          
          // Clear all references
          moduleInstancesRef.current.clear();
          initializedModulesRef.current.clear();
          
          // Debug logs removed
        }
      };
    }, [initializeComponent]);`
        : ""
    }

    // Early render states
    if (isLoading && !html) {
      return <div className="storybook-loading">Loading component...</div>;
    }

    if (error) {
      return <div className="storybook-error">Error: {error}</div>;
    }

    // Render the component
    return (
      <div
        className="storybook-component storybook-component--${name.kebabCase}"
        data-component="${name.original}"
        ref={componentRef}
        dangerouslySetInnerHTML={{ __html: html }}
      />
    );
  };

  export const ${name.pascalCase} = ${name.pascalCase}Template.bind({});
  `;
}
