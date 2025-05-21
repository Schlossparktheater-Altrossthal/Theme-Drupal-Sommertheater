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

    ${hasJsFile && includeJs ? `
    // Initialize JS when component is rendered
    const initializeComponent = useCallback(async () => {
      // Skip if not mounted or still loading
      if (!componentRef.current || isLoading || !html) {
        return;
      }

      // Initialize each JS dependency
      const jsModules = [${jsPaths.map(path => `'${path}'`).join(', ')}];
      
      for (const modulePath of jsModules) {
        // Skip if already initialized
        if (initializedModulesRef.current.has(modulePath)) {
          continue;
        }

        try {
          // Dynamically import the component JS
          const componentModule = await import(/* @vite-ignore */ modulePath);

          // Try different initialization methods
          if (typeof componentModule.initialize === 'function') {
            componentModule.initialize(componentRef.current);
          } else if (typeof componentModule.default === 'function') {
            componentModule.default(componentRef.current);
          } else if (typeof componentModule.init === 'function') {
            componentModule.init(componentRef.current);
          } else {
            console.log('[Storybook] No explicit initialization found for module:', modulePath);
          }

          initializedModulesRef.current.add(modulePath);
        } catch (error) {
          console.error('[Storybook] Failed to initialize module:', modulePath, error);
        }
      }
    }, [html, isLoading]);

    // Run initialization after HTML updates
    useEffect(() => {
      initializeComponent();

      // Cleanup when unmounting
      return () => {
        if (componentRef.current) {
          // Clean up each initialized module
          const jsModules = [${jsPaths.map(path => `'${path}'`).join(', ')}];
          
          for (const modulePath of jsModules) {
            if (initializedModulesRef.current.has(modulePath)) {
              import(/* @vite-ignore */ modulePath)
                .then(module => {
                  if (typeof module.cleanup === 'function') {
                    module.cleanup(componentRef.current);
                  }
                })
                .catch(err => {
                  console.warn('[Storybook] Cleanup error for module:', modulePath, err);
                });
            }
          }
          
          initializedModulesRef.current.clear();
        }
      };
    }, [initializeComponent]);` : ''}

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
  `
}
