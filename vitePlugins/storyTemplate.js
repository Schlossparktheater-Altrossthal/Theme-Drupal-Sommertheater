/**
 *
 * @param {Object} name An object with `kebabCase`, `camelCase`, `pascalCase`, `titleCase`, and `original` keys.
 * @param {boolean} hasJsFile
 * @param {boolean} includeJs
 * @param {string} jsPath
 * @returns
 */
export default function storyTemplate(name, hasJsFile, includeJs, jsPath) {
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
    const isInitializedRef = useRef(false);

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
      // Skip if not mounted, already initialized, or still loading
      if (!componentRef.current || isInitializedRef.current || isLoading || !html) {
        return;
      }

      try {
        // Dynamically import the component JS
        const componentModule = await import('${jsPath}');

        // Try different initialization methods
        if (typeof componentModule.initialize === 'function') {
          componentModule.initialize(componentRef.current);
        } else if (typeof componentModule.default === 'function') {
          componentModule.default(componentRef.current);
        } else if (typeof componentModule.init === 'function') {
          componentModule.init(componentRef.current);
        } else {
          console.log('[Storybook] No explicit initialization found for ${name.original}');
        }

        isInitializedRef.current = true;
      } catch (error) {
        console.error('[Storybook] Failed to initialize ${name.original}:', error);
      }
    }, [html, isLoading]);

    // Run initialization after HTML updates
    useEffect(() => {
      initializeComponent();

      // Cleanup when unmounting
      return () => {
        if (isInitializedRef.current && componentRef.current) {
          // Call cleanup if available
          import('${jsPath}')
            .then(module => {
              if (typeof module.cleanup === 'function') {
                module.cleanup(componentRef.current);
              }
            })
            .catch(err => {
              console.warn('[Storybook] Cleanup error:', err);
            });

          isInitializedRef.current = false;
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
