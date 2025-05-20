# Tailwind Styling Guidelines

While utility classes are powerful, overusing them can lead to verbose and cluttered HTML. Strive for balance by using Tailwind’s `@apply` directive in your CSS to avoid repetitive code and keep templates readable.

## Why We Use `@apply`

We use Tailwind's `@apply` directive selectively—primarily for styles linked to the design system’s core visual language. These are often tied to brand identity, and include:

* Font families and font sizes
* Text colors and emphasis
* Letter spacing and casing
* Link and button treatments

Keeping in mind that the end-user for this design system and theme is low to non coders. With this in mind, we anticapte that more often, the styles that users will want to edit are related to their brand - colors, fonts, etc. It's easier to discover and edit these styles in a CSS file, and reduces the chance of breaking a twig template where there is more complex logic present. The idea is to create custom classes and define the base styles using the `@apply` directive and avoid having to repeat a bunch of utility classes in twig. These custom classes have the styles most likely for a low-code user to want to edit. We leave more of the layout and logic related utility classes in twig because those rarely change and we don't want less technical users having to risk breaking templates for more visual styles like color, font-size, etc. that are related to the component and Where possible, these styles are grouped into reusable, semantic utility classes (e.g., `.heading`, `.button`, `.badge`, etc.), defined using `@apply` in CSS—typically within the `@layer components` block:

```scss
@layer components {
  .heading {
    @apply font-sans tracking-normal text-inherit leading-[1.2];
  }

  .button {
    @apply w-fit border pt-[8px] pb-[9px] no-underline hover:no-underline;
  }

  .badge {
    @apply border inline-flex items-center;
  }

  .badge .badge-label {
    @apply font-sans font-normal text-md leading-none text-inherit select-none;
  }
}
```

### What Are Primitives?

**Primitives** are small, composable design decisions—font sizes, weights, colors, and spacing units—that serve as building blocks for larger UI components. By abstracting them using `@apply`, we create maintainable, predictable tokens that reinforce consistency across the system.

> For example:
> Rather than repeating `text-sm uppercase tracking-wide text-gray-500` in every Twig template, we define `.eyebrow` once and reuse it.

## What We Avoid

We avoid using `@apply` for layout or structural utilities that depend on the document context:

* Spacing (`mb-8`, `gap-4`)
* Grid/flex layout (`grid-cols-3`, `flex`, `justify-between`)
* State or behavior-driven styles (`hover:`, `focus:`)

These are left as raw utility classes in markup where they are most readable and flexible.

## Performance Considerations

Even with PurgeCSS (or Tailwind’s built-in `content` scanning), Tailwind can generate large CSS bundles or verbose markup. While this isn’t typically a performance blocker, it’s still good practice to:

* Create reusable component classes for common patterns
* Use `@apply` to reduce redundancy
* Avoid stacking too many utilities in markup, especially when repeated

> This approach leads to better **maintainability**, easier **theming**, and leaner, more focused HTML templates.

## Use of `@layer` in Tailwind v4

In Tailwind v4, the `@layer` directive continues to be the recommended way to define custom styles in the proper cascade order. Tailwind uses three main layers:

* `@layer base`: For global resets and HTML element styles
* `@layer components`: For reusable component classes
* `@layer utilities`: For custom utility classes

Example:

```scss
@layer base {
  h1 {
    @apply text-3xl font-bold;
  }
}

@layer components {
  .card {
    @apply bg-white shadow-md p-6 rounded;
  }
}

@layer utilities {
  .text-shadow {
    text-shadow: 1px 1px 2px rgba(0,0,0,0.1);
  }
}
```

Using `@layer` ensures that Tailwind correctly merges styles and allows tools like PurgeCSS to safely remove unused ones.

## Summary

Tailwind excels when used intentionally. By applying utility classes directly for layout and interaction, and using `@apply` for primitives and tokens, we build a design system that’s:

> ✨ Clear. ✨ Scalable. ✨ Easy to refactor.
