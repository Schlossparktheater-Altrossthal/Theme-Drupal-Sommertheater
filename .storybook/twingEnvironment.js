import { createFilter, createSynchronousFunction } from "twing";
import { cva } from "class-variance-authority";

export function initEnvironment(twingEnvironment) {
  twingEnvironment.addFunction(
    createSynchronousFunction(
      "html_cva",
      function html_cva(...args) {
        console.log('html_cva raw args:', args);
        // Skip Twing context arg
        const base = args[1] ?? "";
        const variantsMap = args[2] ?? new Map();
        const compoundVariants = args[3] ?? [];
        const defaultVariants = args[4] ?? {};
        // Convert variants Map to object
        function mapToObject(map) {
          if (!(map instanceof Map)) return map;
          const obj = {};
          for (const [key, value] of map.entries()) {
            if (value instanceof Map) {
              obj[key] = Object.fromEntries(value.entries());
            } else {
              obj[key] = value;
            }
          }
          return obj;
        }
        function normalizeBase(base) {
          if (Array.isArray(base)) return base;
          if (typeof base === 'string') return base;
          return '';
        }
        const cvaConfig = {
          base: normalizeBase(base),
          variants: mapToObject(variantsMap),
          compoundVariants,
          defaultVariants,
        };
        console.log('CVA config:', cvaConfig);
        const component = cva(cvaConfig);
        return {
          apply: (selectedVariants = {}, additionalClasses = "") => {
            const props =
              selectedVariants instanceof Map ? Object.fromEntries(selectedVariants) : selectedVariants || {};
            if (additionalClasses) {
              props.class = Array.isArray(additionalClasses)
                ? additionalClasses.join(" ")
                : additionalClasses;
            }
            console.log('CVA apply props:', props);
            const result = component(props);
            console.log('CVA result (raw):', result);

            // Some bundlers/environments cause `cva` to return an unexpected
            // placeholder string (e.g. "base variants compoundVariants defaultVariants").
            // Detect that case and build the class string ourselves as a fallback.
            function buildClassString(config, props) {
              const classes = [];
              // base can be array or string
              if (Array.isArray(config.base)) {
                classes.push(...config.base);
              } else if (typeof config.base === 'string' && config.base.length) {
                classes.push(config.base);
              }

              const applied = {};
              // apply defaultVariants then props
              if (config.defaultVariants && typeof config.defaultVariants === 'object') {
                Object.assign(applied, config.defaultVariants);
              }
              if (props && typeof props === 'object') {
                Object.assign(applied, props);
              }

              // variants: for each variant name, pick the class for the chosen option
              if (config.variants && typeof config.variants === 'object') {
                for (const [variantName, options] of Object.entries(config.variants)) {
                  const choice = applied[variantName];
                  if (!choice) continue;
                  const optionClasses = options[choice];
                  if (!optionClasses) continue;
                  if (Array.isArray(optionClasses)) classes.push(...optionClasses);
                  else if (typeof optionClasses === 'string') classes.push(optionClasses);
                }
              }

              // compoundVariants: an array of { variants: {..}, class: '...' }
              if (Array.isArray(config.compoundVariants)) {
                for (const cv of config.compoundVariants) {
                  if (!cv || typeof cv !== 'object') continue;
                  const { class: cvClass, variants: cvVariants } = cv;
                  if (!cvVariants || typeof cvVariants !== 'object') continue;
                  let match = true;
                  for (const [k, v] of Object.entries(cvVariants)) {
                    if (applied[k] !== v) {
                      match = false;
                      break;
                    }
                  }
                  if (match) {
                    if (Array.isArray(cvClass)) classes.push(...cvClass);
                    else if (typeof cvClass === 'string') classes.push(cvClass);
                  }
                }
              }

              return classes.join(' ').trim();
            }

            let stringResult = typeof result === 'string' ? result : String(result);
            const placeholder = 'base variants compoundVariants defaultVariants';
            if (!stringResult || stringResult === placeholder) {
              try {
                stringResult = buildClassString(cvaConfig, props);
                console.log('CVA fallback result:', stringResult);
              } catch (e) {
                console.warn('CVA fallback failed', e);
              }
            }

            console.log('CVA result (string):', stringResult);
            return stringResult;
          },
        };
      },
      [
        { name: "base", defaultValue: "" },
        { name: "variants", defaultValue: {} },
        { name: "compoundVariants", defaultValue: [] },
        { name: "defaultVariants", defaultValue: {} },
      ]
    )
  );

  twingEnvironment.addFunction(createSynchronousFunction("attach_library", () => null));

  twingEnvironment.addFilter(
    createFilter(
      "t",
      async function (_executionContext, text, replacements) {
        if (replacements && typeof replacements === "object") {
          let result = text;
          replacements.forEach((replacement, stringToReplace) => {
            // Escape special regex characters in the key for safe replacement
            const escapedStringToReplace = stringToReplace.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
            result = result.replace(new RegExp(escapedStringToReplace, "g"), replacement);
          });
          return result;
        }
        return text;
      },
      [
        { name: "text", defaultValue: "" },
        { name: "replacements", defaultValue: null },
      ]
    )
  );

  twingEnvironment.addFilter(
    createFilter(
      "clean_class",
      async function (_executionContext, c) {
        return c
          .replace(/[^a-zA-Z0-9]+/g, "-")
          .replace(/^[0-9]+/, "")
          .toLowerCase();
      },
      [{ name: "c", defaultValue: "" }]
    )
  );

  twingEnvironment.addFilter(
    createFilter(
      "clean_unique_id",
      async function (_executionContext, id) {
        return `${id}-${crypto.randomUUID()}`;
      },
      [{ name: "id", defaultValue: "" }]
    )
  );

  twingEnvironment.addFilter(
    createFilter(
      "without",
      async function (_executionContext, obj, ...keys) {
        if (!obj || typeof obj !== "object") {
          return obj;
        }

        // Collect all non-undefined keys to remove
        const keysToRemove = keys.filter((key) => key !== undefined);

        const result = { ...obj };
        keysToRemove.forEach((key) => {
          delete result[key];
        });

        return result;
      },
      [{ name: "obj", defaultValue: {} }],
      { is_variadic: true }
    )
  );
}
