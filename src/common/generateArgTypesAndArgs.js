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
      let controlType;
      switch (property.type) {
        case 'number':
          controlType = 'number';
          break;
        case 'boolean':
          controlType = 'boolean';
          break;
        case 'object':
          controlType = 'object';
          break;
        case 'array':
          controlType = 'object';
          break;
        case 'string':
        default:
          controlType = 'text';
      }
  
      // Build the argTypes entry.
      argTypes[key] = {
        control: { type: controlType },
        description: property.description,
        table: {
          type: { summary: property.type },
        },
      };
  
      // Set the default value from the first example, if available.
      args[key] =
        property.examples && property.examples.length > 0 ? property.examples[0] : '';
    });
  
    return { argTypes, args };
  };

  export default generateArgTypesAndArgs;