/**
 * Maps JSON schema types to Storybook control types
 */
const controlTypeMap = {
  array: "object",
  string: "text",
};

/**
 * Strategy for handling different property types
 */
const propertyHandlers = {
  /**
   * Handle enum properties
   */
  enum: () => ({
    type: "select",
  }),

  /**
   * Handle object properties
   */
  object: () => ({
    type: "object",
  }),

  /**
   * Handle array properties
   */
  array: () => ({
    type: "object",
  }),

  /**
   * Handle array of types (e.g. ['string', null])
   */
  arrayOfTypes: (property) => {
    const nonNullTypes = property.type.filter(
      (type) => type !== null && type !== "null"
    );
    if (nonNullTypes.length) {
      return generateControlType({ type: nonNullTypes[0] });
    }
    return { type: "text" };
  },

  /**
   * Default handler for other property types
   */
  default: (property) => ({
    type: controlTypeMap[property.type] || property.type,
  }),
};

/**
 * Generate the appropriate control type for a property
 */
function generateControlType(property) {
  // Handle enum types
  if (property.enum) {
    return {
      control: {
        ...propertyHandlers.enum(property),
      },
      options: property.enum,
    };
  }

  // Handle objects
  if (property.type === "object") {
    return { control: { ...propertyHandlers.object(property) } };
  }

  // Handle arrays
  if (property.type === "array") {
    return { control: { ...propertyHandlers.array(property) } };
  }

  // Handle array of types
  if (Array.isArray(property.type)) {
    return { control: { ...propertyHandlers.arrayOfTypes(property) } };
  }

  // Default handler
  return { control: { ...propertyHandlers.default(property) } };
}

/**
 * Strategy for generating default values for different property types
 */
const valueGenerators = {
  /**
   * Generate default value for image properties
   */
  image: (property) => {
    if (property.examples?.length) {
      return property.examples[0];
    }
    return {
      src: "",
      alt: "",
    };
  },

  /**
   * Generate default value for object properties
   */
  object: (property) => {
    // If examples are provided, use the first example
    if (property.examples && property.examples.length > 0) {
      return property.examples[0];
    }
    
    // If the object has properties defined, recursively generate values for them
    if (property.properties) {
      const result = {};
      Object.keys(property.properties).forEach(key => {
        result[key] = generateDefaultValue(property.properties[key]);
      });
      return result;
    }
    
    // Fallback to empty object
    return {};
  },

  /**
   * Generate default value for array properties
   */
  array: (property) => {
    return property.examples || [];
  },

  /**
   * Generate default value for primitive properties
   */
  primitive: (property) => {
    return property.examples && property.examples.length > 0
      ? property.examples[0]
      : "";
  },

  enum: (property) => {
    return property.examples && property.examples.length > 0
      ? property.examples[0]
      : "";
  },
};

/**
 * Generate default value for a property
 */
function generateDefaultValue(property) {
  // Handle image properties
  if (
    property.$ref ===
    "json-schema-definitions://experience_builder.module/image"
  ) {
    return valueGenerators.image(property);
  }

  if (property.enum) {
    return valueGenerators.enum(property);
  }

  // Handle object properties
  if (property.type === "object") {
    return valueGenerators.object(property);
  }

  // Handle array properties
  if (property.type === "array") {
    return valueGenerators.array(property);
  }

  // Handle primitive properties
  return valueGenerators.primitive(property);
}

/**
 * Generate argTypes and args for a component
 */
function generateArgTypesAndArgs(parsedMetadata, componentPath = "", storybookMetadata = {}) {
  const argTypes = {};
  const args = {
    componentMetadata: {
      path: componentPath,
    },
    storybook: storybookMetadata,
  };

  // Validate metadata
  if (!parsedMetadata.props || !parsedMetadata.props.properties) {
    console.error('YAML metadata is missing the "props.properties" field.', parsedMetadata);
    return { argTypes, args };
  }

  const properties = parsedMetadata.props.properties;

  // Process each property
  Object.keys(properties).forEach((key) => {
    const property = properties[key];

    // Generate control type
    const control =
      generateControlType(property);

    // Build argTypes entry
    argTypes[key] = {
      ...control,
      description: property.description,
      name: property.title,
      table: {
        type: { summary: property.type },
      },
    };

    // Generate default value
    args[key] = generateDefaultValue(property);
  });

  return { argTypes, args };
}

export default generateArgTypesAndArgs;
