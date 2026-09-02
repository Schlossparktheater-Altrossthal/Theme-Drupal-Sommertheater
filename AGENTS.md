# Mercury Theme - Agent Rules

This document contains coding rules and conventions for the Mercury theme that AI agents should follow when making changes.

## CVA (Class Variant Authority) Usage

### Conditionals Must Use CVA

**Rule**: Never use inline conditionals within HTML tag attributes. Always use CVA (Class Variant Authority) to handle conditional classes.

**❌ Bad:**

```twig
<h3 class="font-semibold{% if badges is empty %} relative{% endif %}">
  <a href="{{ url }}"{% if badges is empty %} class="after:absolute after:inset-0 after:content-['']"{% endif %}>
```

**✅ Good:**

```twig
{% set heading_variants =
  html_cva(
    base: 'font-semibold',
    variants: {
      hasBadges: {
        yes: '',
        no: 'relative'
      }
    }
  )
%}

<h3
  class="{{
  heading_variants.apply({
    hasBadges: has_badges ? 'yes' : 'no'
  })
  }}"
>
  <a
    href="{{ url }}"
    class="{{
    link_variants.apply({
      hasBadges: has_badges ? 'yes' : 'no'
    })
    }}"
  >

  </a>
</h3>
```

### CVA Variant Keys Use Yes/No Strings

**Rule**: CVA variant keys should use `yes`/`no` string values, not boolean values (`true`/`false`) or quoted strings (`'true'`/`'false'`).

**❌ Bad:**

```twig
clickable: { true: 'group cursor-pointer', false: '' } clickable: { 'true': 'group cursor-pointer', 'false': '' }
```

**✅ Good:**

```twig
clickable: { yes: 'group cursor-pointer', no: '' }
```

**Note**: When setting variables for CVA, convert boolean conditions to `'yes'`/`'no'` strings:

```twig
{% set is_clickable = url is not empty and url != 'No URL' ? 'yes' : 'no' %}
{% set has_badges = badges is not empty %}
{% set badge_variant = has_badges ? 'yes' : 'no' %}
```

### CVA Formatting

**Rule**: CVA definitions should use multi-line format for better readability.

**✅ Good:**

```twig
{% set card =
  html_cva(
    base: 'card flex flex-col',
    variants: {
      orientation: {
        stacked: '',
        landscape: 'md:flex-row'
      }
    }
  )
%}
```

**Rule**: CVA `.apply()` calls should use multi-line format when they contain multiple parameters or are long.

**✅ Good:**

```twig
<div
  class="{{
  card.apply(
    {
      orientation: card_orientation,
      style: card_style,
      clickable: is_clickable
    },
    card_classes|default('')
  )
  }}"
></div>
```

### Use Arrays for Long Class Strings

**Rule**: When class strings become too long (typically over 80-100 characters), use arrays instead to improve readability. Each class should be on its own line in the array.

**❌ Bad:**

```twig
variant: {
  primary: 'border-[var(--hgc-btn-border)] bg-[var(--hgc-btn-bg)] text-[var(--hgc-btn-label)] hover:border-[var(--hgc-btn-border-hover)] hover:bg-[var(--hgc-btn-bg-hover)] hover:text-[var(--hgc-btn-label-hover)] focus:border-[var(--hgc-btn-border-hover)] focus:bg-[var(--hgc-btn-bg-hover)] focus:text-[var(--hgc-btn-label-hover)] disabled:cursor-default disabled:border-[var(--hgc-btn-border-disabled)] disabled:bg-[var(--hgc-btn-bg-disabled)] disabled:text-[var(--hgc-btn-label-disabled)]'
}
```

**✅ Good:**

```twig
variant: {
  primary: [
    'border-[var(--hgc-btn-border)]',
    'bg-[var(--hgc-btn-bg)]',
    'text-[var(--hgc-btn-label)]',
    'hover:border-[var(--hgc-btn-border-hover)]',
    'hover:bg-[var(--hgc-btn-bg-hover)]',
    'hover:text-[var(--hgc-btn-label-hover)]',
    'focus:border-[var(--hgc-btn-border-hover)]',
    'focus:bg-[var(--hgc-btn-bg-hover)]',
    'focus:text-[var(--hgc-btn-label-hover)]',
    'disabled:cursor-default',
    'disabled:border-[var(--hgc-btn-border-disabled)]',
    'disabled:bg-[var(--hgc-btn-bg-disabled)]',
    'disabled:text-[var(--hgc-btn-label-disabled)]'
  ]
}
```

**Note**: Arrays can be used directly in CVA variant definitions without needing to join them. CVA will handle the array format automatically. This makes long class strings much more readable and easier to maintain.

### Normalize Array/String Inputs for CVA Apply

**Rule**: When passing additional classes to `Cva::apply()` as the second argument, always normalize the input to handle both array and string formats. `Cva::apply()` expects a string (or null) for the second argument, but components may receive arrays from parent templates.

**❌ Bad:**

```twig
{% set btn_classes = btn_classes|default('') %}
<div
  class="{{
  button.apply(
    {
      size: button_size,
      variant: button_variant
    },
    btn_classes
  )
  }}"
></div>
```

**Note**: This will fail with a runtime error if `btn_classes` is passed as an array (e.g., `btn_classes: ['before:absolute', 'before:inset-0']`).

**✅ Good:**

```twig
{# Normalize btn_classes - handle both array and string formats #}
{% set additional_classes = btn_classes|default('') %}
{% if additional_classes is iterable %}
  {% set additional_classes = additional_classes|join(' ') %}
{% endif %}

<div
  class="{{
  button.apply(
    {
      size: button_size,
      variant: button_variant
    },
    additional_classes
  )
  }}"
></div>
```

**Note**: This pattern ensures the component works whether additional classes are passed as an array or a string. Always normalize external inputs before passing them to `Cva::apply()`.

## HTML Tag Attributes

### No Conditionals in Class Attributes

**Rule**: Never place Twig conditionals directly within HTML `class` attributes. Always compute class values beforehand using variables or CVA.

**❌ Bad:**

```twig
<div class="something{% if condition %} extra-class{% endif %}"></div>
```

**✅ Good:**

```twig
{% set classes = condition ? 'something extra-class' : 'something' %}
<div class="{{ classes }}"></div>
```

Or using CVA (preferred):

```twig
{% set variant_classes =
  html_cva(
    base: 'something',
    variants: {
      condition: {
        yes: 'extra-class',
        no: ''
      }
    }
  )
%}
{% set condition_value = condition ? 'yes' : 'no' %}
<div
  class="{{
  variant_classes.apply({
    condition: condition_value
  })
  }}"
></div>
```

**Note**: This rule applies specifically to `class` attributes. For other attributes (like `data-*`, `aria-*`, etc.), see the "No Inline Control Structures in Attributes" rule below.

## Variable Naming

**Rule**: When converting conditionals to variables for CVA, use descriptive boolean variable names.

**✅ Good:**

```twig
{% set has_badges = badges is not empty %}
{% set is_clickable = url is not empty and url != 'No URL' ? 'yes' : 'no' %}
```

## HTML Attributes and Drupal Attributes

### Attributes Must Have Space Before Them

**Rule**: When appending `{{ attributes }}` to HTML tags, there must be a space before the attributes variable.

**❌ Bad:**

```twig
<div{{ attributes }}></div{{>
```

**✅ Good:**

```twig
<div {{ attributes }}></div>
```

**Note**: Even though Drupal core templates sometimes use `<div{{ attributes }}>`, this pattern is not allowed in Mercury theme components.

### No Inline Control Structures in Attributes

**Rule**: Never use inline Twig control structures (`{% if %}`, `{% for %}`, etc.) directly within HTML tag attributes. Always assign values to variables first.

**❌ Bad:**

```twig
<div class="something"{% if condition %} data-attr="value"{% endif %}>
```

**✅ Good:**

```twig
{% set data_attr = condition ? 'data-attr="value"' : '' %}
<div class="something" {{ data_attr }}></div>
```

Or better yet, use CVA or compute all attributes beforehand:

```twig
{% set additional_attrs = condition ? 'data-attr="value"' : '' %}
<div class="something" {{ additional_attrs }}></div>
```

## HTML Tag Structure

### No Split Opening/Closing Tags Across Conditionals

**Rule**: Never split opening and closing HTML tags across different conditional blocks. This is not static analysis friendly and reduces readability.

**❌ Bad:**

```twig
{% if url is not empty %}
  <a href="{{ url }}">
{% endif %}
  <p>Content</p>
{% if url %}
  </a>
{% endif %}
```

**✅ Good:**

```twig
{% if url is not empty %}
  <a href="{{ url }}">
    <p>
      Content
    </p>
  </a>
{% else %}
  <p>
    Content
  </p>
{% endif %}
```

Or use a wrapper approach:

```twig
{% if url is not empty %}
  <a href="{{ url }}" class="link-wrapper">
{% endif %}
  <p>Content</p>
{% if url is not empty %}
  </a>
{% endif %}
```

**Note**: The wrapper approach is acceptable when the content is the same, but prefer the first approach when possible.

### No Dynamic Tag Names

**Rule**: Never use dynamic tag names. Always use explicit HTML tags.

**❌ Bad:**

```twig
<h{{ heading_level }}>Title</h{{ heading_level }}>
```

**✅ Good:**

```twig
{% if heading_level == 1 %}
  <h1>Title</h1>
{% elseif heading_level == 2 %}
  <h2>Title</h2>
{% elseif heading_level == 3 %}
  <h3>Title</h3>
{% else %}
  <h2>Title</h2>
{% endif %}
```

**Note**: While the variable approach works, the explicit conditional is preferred for better static analysis and readability.

## Component Includes

### Always Use `with_context: false` or `with only`

**Rule**: When including components, always use `with_context: false` or `with only` to prevent context pollution. This ensures that only the explicitly passed variables are available to the included template, preventing accidental variable leakage from the parent context.

**For `include()` function syntax:**

**❌ Bad:**

```twig
{{
  include(
    '@mercury/components/icon/icon.twig',
    {
      weight: 'bold',
      icon: icon
    }
  )
}}
```

**✅ Good:**

```twig
{{
  include(
    '@mercury/components/icon/icon.twig',
    {
      weight: 'bold',
      icon: icon
    },
    with_context: false
  )
}}
```

**For `{% include %}` tag syntax:**

**❌ Bad:**

```twig
{% include '@mercury/components/icon/icon.twig' with {
  weight: 'bold',
  icon: icon
} %}
```

**✅ Good:**

```twig
{% include '@mercury/components/icon/icon.twig' with {
  weight: 'bold',
  icon: icon
} only %}
```

**Note**: 
- Use `with_context: false` with the `include()` function syntax
- Use `with only` with the `{% include %}` tag syntax
- Both achieve the same result: preventing context pollution by only passing explicitly defined variables

### Only Pass Configurable Props

**Rule**: When including components, only pass props that are actually configurable in the current component. Do not pass props with default values that are not configurable in the component's schema or template context.

**❌ Bad:**

```twig
{{
  include(
    'mercury:heading',
    {
      heading_text: heading_text|default(''),
      level: level|default(2),
      align: align|default('left'),
      font_color: font_color|default('text-inherit'),
      font_size: font_size|default('default'),
      heading_classes: heading_classes|default(''),
      url: url|default('')
    },
    with_context: false
  )
}}
```

**Note**: This passes all possible props even though the component may only have `heading_text`, `level`, and `url` defined in its `component.yml` schema.

**✅ Good:**

```twig
{{
  include(
    'mercury:heading',
    {
      heading_text: heading_text|default(''),
      level: level|default(2),
      url: url|default('')
    },
    with_context: false
  )
}}
```

**Note**: Only pass props that are:
1. Defined in the component's `component.yml` schema as configurable properties
2. Declared or computed in the current component's template

**Example - Card with hardcoded level:**

```twig
{{
  include(
    'mercury:heading',
    {
      heading_text: heading_text|default(''),
      level: 3,
      heading_classes: ['card-title'],
      url: 'No URL'
    },
    with_context: false
  )
}}
```

**Note**: Here, `level: 3` and `url: 'No URL'` are hardcoded values specific to this card component, so they are passed explicitly. However, `align`, `font_color`, and `font_size` are not passed because they are not configurable in this component.

## Workflow

### Run Format and Build After Changes

**Rule**: After completing any changes to the Mercury theme, always run `npm run format` and `npm run build` to ensure code is properly formatted and the build artifacts are up to date.

**Required Steps:**

1. **Format code**: Run `npm run format` to format all code according to the project's formatting rules
2. **Build assets**: Run `npm run build` to compile CSS, JavaScript, and other assets

**Example:**

```bash
npm run format
npm run build
```

**Note**: These commands should be run from the Mercury theme directory (`web/themes/custom/mercury/`). Running these commands ensures that:
- Code follows consistent formatting standards
- Build artifacts (compiled CSS, minified JS, etc.) are regenerated
- The theme is ready for testing and deployment

## Summary

1. **Always use CVA for conditional classes** - Never use inline conditionals in HTML attributes
2. **Use yes/no strings for CVA variant keys** - `yes`/`no`, not `true`/`false` or `'true'`/`'false'`
3. **Format CVA definitions and calls** - Use multi-line format for readability
4. **Use arrays for long class strings** - When class strings exceed 80-100 characters, use arrays for better readability
5. **Normalize array/string inputs for CVA apply** - Always normalize external class inputs before passing to `Cva::apply()`
6. **Compute values before HTML** - All conditionals should be resolved before being used in HTML attributes
7. **Attributes need space** - Always use `<div {{ attributes }}>` not `<div{{ attributes }}>`
8. **No inline control structures in attributes** - Assign values to variables first
9. **No split tags across conditionals** - Keep opening and closing tags together
10. **No dynamic tag names** - Use explicit HTML tags or proper conditionals
11. **Always use `with only` or `with_context: false`** - When including components, prevent context pollution
12. **Only pass configurable props** - When including components, only pass props that are actually configurable in the current component's schema or template
13. **Run `npm run format` and `npm run build`** - After completing changes, format code and rebuild assets


# AGENTS.md

> Entry point for AI agents and developers in the **[PROJECT_NAME]** project.
> Summary of rules (WHAT applies and WHY) with references to detail files in `docs/**`.
> Human entry point: [README.md](README.md).
>
> **Usage:** Copy this file into the root of a new project, rename it to `AGENTS.md`,
> and replace all placeholders in `[SQUARE BRACKETS]` with project-specific content.
> Delete every section that does not apply.

---

## Project Overview

- **[PROJECT_NAME]** is [short description: purpose, function, context — 1–3 sentences].
- Target audience / access: [e.g. internal users on company network; authenticated or public — state briefly].
- Key features / pipeline stages: [bullet list of the most important workflows or functions].
- Repo layout: `[folder/]` ([purpose]), `[folder/]` ([purpose]) — adjust or delete.

---

## Tech Stack

- **Runtime / Language:** [e.g. Node.js 22 / TypeScript 5, PHP 8.3, Python 3.12]
- **Framework:** [e.g. Next.js 15 App Router, Drupal 11, FastAPI]
- **UI / Styling:** [e.g. Tailwind CSS, shadcn/ui — or "none"]
- **Data layer:** [e.g. Prisma + PostgreSQL, Drupal entities, SQLAlchemy]
- **Package manager:** [npm / pnpm / composer / pip — use exclusively, do not mix]
- **Entry points:** [list main entry files and what they do]
- **Explicitly excluded:** [technologies deliberately not introduced, e.g. Next.js, Prisma, Redux]
- Details: [Architecture & Coding Conventions](docs/architecture.md)

---

## Architecture & Code Guidelines

- Prefer the default render/execution model of the stack; opt into client-side or
  async modes only for genuinely interactive or background scenarios.
- Keep binary files (images, videos, fonts) out of the repository. Use inline SVGs or
  reference external assets instead.
- Centralize data access in one module; encapsulate queries in dedicated helpers.
- Validate with a schema library at system boundaries (input, API responses, env vars).
- Use path aliases instead of deep relative imports.
- Correct types only — casts such as `as any`, `as never`, or `as unknown as …` are
  forbidden. Use proper types and type guards.
- Search for an existing helper before adding a new one — never create duplicates.
- Before deleting a module or export, verify all usages: direct imports, barrel exports,
  and dynamic imports. A module is only "dead" when no import path references it.
- Never export two symbols with the same name. Resolve collisions immediately.
- Never leave empty catch blocks — log the error or rethrow it.
- Use `console.error` for errors and `console.warn` for warnings locally.
  On the server, use the project's structured logger; avoid bare `console.log`.
- API routes always return errors as `{ error: string }` with an appropriate HTTP
  status code.
- Keep per-domain action/command files lean; split by domain, share helpers in a
  dedicated module outside the routing directory.

---

## Design System & Theming

- Use semantic design tokens (`bg-surface`, `text-primary`, `border-default`, …)
  instead of hard-coded colors. All components must work in light and dark mode.
- Keep category/identity colors centralized in one config module — never hard-code
  them in components.
- Surface hierarchy: base background → surface/card → muted/nested surface →
  popover/overlay. Use the matching semantic token for each level.
- Status semantics: success token for positive/active, warning for pending/attention,
  destructive for errors/blocked, muted for neutral/inactive.
- [Document the authoritative token reference in `docs/design-system.md`]

---

## Routing

- Routes live in `[file / folder]`. Full route map: [Routing](docs/architecture.md#routing).
- Known gaps: [e.g. `PageHeader` links to `/about` but no route exists — report, do not silently create].

---

## UI Components & UX

- Base the UI on one component library and extend it consistently.
- Accessibility is a priority: semantic HTML, `aria` attributes, visible focus states.
- Feedback (toasts / notifications) runs through a single shared utility.
- Destructive actions always require a confirmation dialog — `window.confirm` is forbidden.
- Create/edit flows use a shared modal or form pattern.
- Async actions use a shared async-button component — never combine a button manually
  with a spinner inline.
- Touch targets must be at least 44 px tall on mobile.
- Layouts stack vertically on mobile and switch to horizontal only at a defined
  breakpoint. No fixed pixel widths — use responsive utilities.

---

## Backend, Data & Migrations

- Schema changes always come with a migration; regenerate any auto-generated clients
  afterwards.
- Document new environment variables in `[.env.example]` and the README immediately.
- Keep frontend and backend contracts for realtime/event-driven flows in sync.
- [Add project-specific rules for jobs, queues, caching, or external APIs here.]

---

## Tooling & Local Development

| Task | Command |
|---|---|
| Install dependencies | `[install command]` |
| Development server | `[dev command]` |
| Production build | `[build command]` |
| Lint | `[lint command]` |
| Format | `[format command]` |
| Tests | `[test command]` |

- One formatter is the single source of truth. Run it across the whole repo; no manual
  style adjustments against the formatter.
- Lint, format check, tests, and build must all pass cleanly before every commit.
- Fix lint errors — do not suppress them unless documented with a reason.
- Environment variables are documented in `[.env.example]` and the README.

---

## Naming Conventions

| Kind | Convention | Example |
|---|---|---|
| Variables | `camelCase` | `userToken` |
| Constants | `SCREAMING_SNAKE_CASE` | `MAX_RETRY_COUNT` |
| Components / Classes | `PascalCase` | `UserCard` |
| Functions | `camelCase`, starts with a verb | `getUserById` |
| Files (components) | `kebab-case` or `PascalCase` — pick one, stay consistent | `user-card.tsx` |
| Keys / identifiers | Schema: `[SCOPE.PAGE.CONTEXT.ACTION]` — register in a central definitions file | `AUTH.LOGIN.FORM.SUBMIT` |

---

## Commits

- Commit after every completed, atomic task — not only on explicit request.
- One commit = exactly one completed change. Do not mix topics.
- **Prefix style:** `add:`, `mod:`, `fix:`, `delete:`, `docs:`, `refactor:`,
  `perf:`, `test:`, `build:`, `ci:`, `chore:`, `revert:`.
- Message: lowercase, imperative mood, describes what changed and why.
  Never just `update`, `changes`, or `wip`.
- Optional scope in parentheses: `fix(auth): handle expired token edge case`.
- Mark breaking changes with `!`: `mod(api)!: rename user endpoint`.
- No secrets, tokens, or API keys in commit messages.
- Push only on explicit request — commit locally first.

---

## Tests & Quality Assurance

- Tests live close to the source they test.
- When refactoring a component or module, keep its tests and mocks up to date.
  New internal dependencies must also be provided in the mock.
- Before every commit: lint → format check → tests → build. All must pass.
- Exceptions (e.g. checks cannot run): document the blocker and attach manual
  test evidence in the PR description.

---

## Documentation & Communication

- Update the README, `docs/**`, and `[.env.example]` for every relevant change.
- Keep route/permission/component documentation in sync when these change.
- PR descriptions include: context, decision points, and QA steps.
- Keep this file up to date when new standards are introduced; justify changes.

---

## General Agent Behavior

- Work autonomously until the task is fully complete, then commit immediately.
- If anything about a task is unclear or ambiguous, **ask before making changes**
  rather than guessing.
- After frontend changes, verify the build passes before committing.
- Keep this file and `docs/**` current whenever conventions change.
- Never introduce a technology listed under **Explicitly excluded**.
- Never add secrets or credentials to any tracked file.

---

## Detail Files

| File | Contents |
|---|---|
| [docs/architecture.md](docs/architecture.md) | Folder structure, routing map, module boundaries |
| [docs/design-system.md](docs/design-system.md) | Tokens, component library, responsive breakpoints |
| [docs/database.md](docs/database.md) | Schema overview, migration workflow, seeding |
| [docs/dev-workflow.md](docs/dev-workflow.md) | Local setup, CI/CD, deployment steps |
| [docs/i18n.md](docs/i18n.md) | Translation keys, locale files, pluralization rules |
| [docs/decisions.md](docs/decisions.md) | ADRs — architectural decisions and their rationale |

> Delete rows for files that do not exist yet. Create them when the topic becomes relevant.
