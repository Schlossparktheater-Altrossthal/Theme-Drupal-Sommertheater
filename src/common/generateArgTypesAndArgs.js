const generateControlType = (property) => {
  if (property.enum) {
    return {
      type: "select",
      options: property.enum,
    };
  }
  if (property.type === "array") {
    return {
      type: "object",
    };
  }

  if (property.type === "string") {
    return {
      type: "text",
    };
  }

  if (Array.isArray(property.type) && property.type.length > 0) {
    const firstType = property.type[0];
    
    return generateControlType({
      type: firstType,
    });
  }

  return {
    type: property.type,
  };
};

const generateArgTypesAndArgs = (parsedMetadata) => {
  // Parse metadata if it's a string
  const argTypes = {};
  const args = {};

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

    // Set the default value from the first example, if available.
    args[key] =
      property.examples && property.examples.length > 0
        ? property.examples[0]
        : "";
  });

  return { argTypes, args };
};

export default generateArgTypesAndArgs;
