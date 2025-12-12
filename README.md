# Mercury Theme

A modern and flexible Drupal theme designed to help developers quickly build scalable and efficient websites. It utilizes cutting-edge tools to create a seamless development experience.

## Installation

To customize this theme, you'll need to install [nvm (Node Version Manager)](github.com/nvm-sh/nvm), then follow these steps:

1. Install [pnpm](https://pnpm.io/installation) globally.
2. In this theme's directory, type `nvm use` to switch to the correct Node version.
3. Run `pnpm install` to install the required dependencies.

To install the theme in Drupal, run `drush theme:enable mercury`.

## Building Tailwind CSS

Mercury uses [Tailwind CSS](https://tailwindcss.com) to simplify styling by using classes to compose designs directly in the markup.

If you modify CSS files or classes in a Twig template, you need to rebuild the CSS:

```bash
pnpm build
```

For development, you can watch for changes and automatically rebuild the CSS:

```bash
pnpm dev
```

## Code Formatting

The codebase uses [Prettier](https://prettier.io) to automatically format code for consistency. The project is configured with plugins for Tailwind CSS and Twig templates.

For the best experience, it's recommended to [set up Prettier in your editor](https://prettier.io/docs/editors) to automatically format files on save.

To format all files in the project:

```bash
pnpm format
```

To check if files are formatted correctly without making changes:

```bash
pnpm format:check
```

**Note**: Some files are excluded from formatting via `.prettierignore`, such as Drupal's `html.html.twig` template which contains placeholder tokens that break Prettier's HTML parsing.

## Component JavaScript

`lib/component.js` has two classes you can use to nicely encapsulate your component JS without pasting all the `Drupal.behaviors.componentName` boilerplate into every file. The steps are:

1. Extend the `ComponentInstance` class to a new class with the code for your component.
2. Create a new instance of the `ComponentType` class to automatically activate all the component instances on that page.

For example, here's a stub of `accordion.js`:

```js
import { ComponentType, ComponentInstance } from "../../lib/component.js";

// Make a new class with the code for our component.
//
// In every method of this class, `this.el` is an HTMLElement object of
// the component container, whose selector you provide below. You don't
// have an array of elements that you have to `.forEach()` over yourself;
// the ComponentType class handles all that for you.
class Accordion extends ComponentInstance {
  // Every subclass must have an `init` method to activate the component.
  init() {
    this.el.querySelector(".accordion--content").classList.toggle("visible");
    this.el.addClass("js");
  }

  // You may also implement a `remove()` method to clean up when a component is
  // about to be removed from the document. This will be invoked during the
  // `detach()` method of the Drupal behavior.

  // You can create as many other methods as you want; in all of them,
  // `this.el` represents the single instance of the component. Any other
  // properties you add to `this` will be isolated to that one instance
  // as well.
}

// Now we instantiate ComponentType to find the component elements and run
// our script.
new ComponentType(
  // First argument: The subclass of ComponentInstance we just created above.
  Accordion,
  // Second argument: A camel-case unique ID for the behavior (and for `once()`
  // if applicable).
  "accordion",
  // Third argument: A selector for `querySelectorAll()`. All matching elements
  // on the page get their own instance of the subclass you created, each of
  // which has `this.el` pointing to one of those matches.
  ".accordion",
);
```

This is all the code required to be in each component. The ComponentType instance handles finding the elements, running them through `once` if available, and adding them to `Drupal.behaviors`.

All the objects created this way will be stored in a global variable so you can do stuff with them later. Since the `namespace` variable at the top of component.js is `mercuryComponents`, you would find the Accordion's ComponentType instance at `window.mercuryComponents.accordion`.

Furthermore, `window.mercuryComponents.accordion.instances` is an array of all the ComponentInstance objects, and `window.mercuryComponents.accordion.elements` is an array of all the component container elements.
