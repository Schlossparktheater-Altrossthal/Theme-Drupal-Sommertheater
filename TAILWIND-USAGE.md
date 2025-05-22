# Tailwind Styling Guidelines

This design system and component library is built with [Tailwind CSS v4](https://tailwindcss.com), offering a modern, well-documented foundation for building flexible, brandable Drupal themes. This README outlines the design system’s architecture, key decisions, and recommended practices for customizing it within a Drupal CMS environment.

This system is built with low- to no-code users in mind. Most site builders will be focused on adjusting visual elements—such as colors, typography, and spacing—to align with their organization’s brand. While the core structure is designed to minimize the need for custom code, the system is also developer-friendly. Front-end and Drupal developers can easily extend or override components as needed.

## How to customize
Customizing the design system is straightforward and follows a specific order to help keep things maintainable and avoid introducing bugs—especially for site builders who may not be comfortable writing a lot of code… this aligns with the [Drupal CMS](https://new.drupal.org/drupal-cms) mission.

**Recommended Order of Customization**
- **Global Styles** - `src/main.css`
Start here. This file contains CSS custom properties (variables) that define your brand’s visual identity—colors, font stacks, spacing units, etc. These changes will cascade across all components.
- **Component CSS** – Granular Tweaks
Each component has its own CSS file. Use these files to make more specific style adjustments without affecting the global design system. The CSS is still primarily Tailwind based, using Tailwind’s @apply directive. (see more below)
- **Component TWIG Templates** – Structural or Logical Changes
Modify the Tailwind utility classes in TWIG templates only if you need to change layout structure or introduce conditional logic. This step is more technical and can affect functionality, so proceed with caution.

## Why We Use `@apply`

We use Tailwind's `@apply` directive selectively—primarily for styles linked to the design system’s core visual language. These are often tied to brand identity, and include:

* Font families and font sizes
* Text colors and emphasis
* Letter spacing and casing
* Link and button treatments

 It's easier to discover and edit these styles in a CSS file, and reduces the chance of breaking a twig template where there is more complex logic present. The intention is to create custom classes and define the base styles using the `@apply` directive and avoid having to repeat a bunch of utility classes in twig. 
 
> For example:
> Rather than repeating `text-sm uppercase tracking-wide text-gray-500` in every Twig template, we define `.eyebrow` once and reuse it.

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

  .badge-label {
    @apply font-sans font-normal text-md leading-none text-inherit select-none;
  }
}
```

## What We Avoid (this may change)

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

Tailwind excels when used intentionally. By applying utility classes directly for layout and interaction, and using `@apply` for design tokens, we build a design system that’s:

> ✨ Clear. ✨ Scalable. ✨ Easy to refactor.
