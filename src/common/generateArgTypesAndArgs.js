const controlTypeMap = {
  array: 'object',
  string: 'text',
};

const generateControlType = (property) => {
  // Handle enum types.
  if (property.enum) {
    return {
      type: 'select',
      options: property.enum
    };
  }

  // Handle objects.
  if (property.type === 'object') {

  }

  // Handle array of types (e.g. ['string', null]).
  if (Array.isArray(property.type)) {
    const nonNullTypes = property.type.filter(type => type !== null && type !== 'null');
    if (nonNullTypes.length) {
      return generateControlType({ type: nonNullTypes[0] });
    }
    return { type: 'text' };
  }

  // Look up mapped control type or use property type directly
  return {
    type: controlTypeMap[property.type] || property.type
  };
};

const generateArgTypesAndArgs = (parsedMetadata, componentPath = '') => {
  // Parse metadata if it's a string
  const argTypes = {};
  const args = {};

  args.componentMetadata = {
    path: componentPath
  };

  if (!parsedMetadata.props || !parsedMetadata.props.properties) {
    console.error('YAML metadata is missing the "props.properties" field.');
    return { argTypes, args };
  }
  const properties = parsedMetadata.props.properties;

  Object.keys(properties).forEach((key) => {
    const property = properties[key];

    // Infer the control type based on the property type.
    const control = generateControlType(property);

    // Build the argTypes entry.
    argTypes[key] = {
      ...control,
      description: property.description,
      table: {
        type: { summary: property.type },
      },
    };

    if (argTypes[key].type === 'object') {
      const arg = {};
      for (const childPropertyName in property.properties) {
        arg[childPropertyName] = property.properties[childPropertyName].examples?.[0] || '';
      }

      args[key] = arg;
    } else {
      // Set the default value from the first example, if available.
      args[key] =
      property.examples && property.examples.length > 0
        ? property.examples[0]
        : "";
    }


  });

  return { argTypes, args };
};

export default generateArgTypesAndArgs;
