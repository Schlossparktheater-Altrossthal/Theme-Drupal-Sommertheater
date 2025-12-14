import { join } from "node:path";
import { cwd } from "node:process";

/** @type { import('@storybook/html-vite').StorybookConfig } */
const config = {
  stories: ["../components/**/*.component.yml"],
  addons: [
    {
      name: "storybook-addon-sdc",
      options: {
        sdcStorybookOptions: {
          twigLib: "twing",
          // Provide custom JSON schema definitions used by SDC components.
          // This mirrors the `customDefs` support described in the sdc-addon README
          // and ensures $ref values like `json-schema-definitions://canvas.module/image`
          // are resolvable in Storybook.
          customDefs: {
            "json-schema-definitions://canvas.module/image": {
              type: "object",
              title: "Image",
              properties: {
                src: { type: "string", title: "Image source" },
                width: { type: "number", title: "Width" },
                height: { type: "number", title: "Height" },
                alt: { type: "string", title: "Alt text" }
              },
            }
          },
        },
        vitePluginTwingDrupalOptions: {
          hooks: join(cwd(), ".storybook/twingEnvironment.js"),
        },
      },
    },
  ],
  framework: "@storybook/html-vite",
};
export default config;
