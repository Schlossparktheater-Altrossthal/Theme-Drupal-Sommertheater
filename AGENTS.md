# AGENTS.md

> Entry point for AI agents and developers in the **Mercury** project.
> Summary of rules (WHAT applies and WHY). Human entry point: [README.md](README.md).
> Theme-specific coding rules are detailed in [docs/theme-coding-rules.md](docs/theme-coding-rules.md).

---

## Project Overview

- **Mercury** is a component-based Drupal theme, providing a modern and flexible starting point for site owners to build scalable and efficient websites using Drupal Canvas.
- Target audience / access: Drupal site builders and developers; theme is publicly available from drupal.org.
- Key features / pipeline stages:
  - Single-directory components (SDC) with a `component.yml` schema per component
  - Tailwind CSS 4 build pipeline (`src/main.css` → `build/main.min.css`)
  - shadcn/ui-compatible design tokens in `src/theme.css` (light/dark via `.dark` class)
  - Drupal behaviors encapsulated via `lib/component.js` helpers
- Repo layout: `components/` (SDC components), `templates/` (Drupal template overrides), `src/` (CSS/JS sources), `lib/` (JS helpers), `build/` (compiled assets)

---

## Tech Stack

- **Runtime / Language:** Node.js 24 (see `.nvmrc`), PHP (Drupal modules/tests), JavaScript (ES modules)
- **Framework:** Drupal 11 theme (`core_version_requirement: ^11.3`)
- **UI / Styling:** Tailwind CSS 4, CVA (Class Variant Authority), shadcn/ui-compatible CSS variables
- **Component system:** Drupal single-directory components (SDC); `drupal/cva` module provides the CVA Twig integration
- **Package manager:** npm (frontend assets), Composer (Drupal dependencies). Use both as appropriate — do not mix: npm for JS/CSS tooling, Composer for PHP/Drupal deps.
- **Entry points:**
  - `src/main.css` — Tailwind entry point, imports component-specific CSS and registers theme tokens
  - `src/theme.css` — shadcn/ui-compatible theme variables (light/dark), customizable without rebuild
  - `src/motion.js` — animation entry point, bundled via esbuild into `build/motion.js`
  - `lib/component.js` — Drupal behavior helper classes (`ComponentInstance`, `ComponentType`)
  - `mercury.info.yml` — theme metadata, regions, library declarations
- **Explicitly excluded:** None deliberately excluded beyond what the Drupal ecosystem implies; do not introduce frameworks such as Next.js, React, Vue, or Redux.

---

## Architecture & Code Guidelines

- Follow Drupal theme conventions; use single-directory components in `components/` with a `component.yml` schema per component.
- Component-specific CSS lives next to the component (e.g. `components/navbar/navbar.tailwind.css`) and must be imported in `src/main.css`.
- Component-specific JS lives next to the component (e.g. `components/accordion/accordion.js`) and uses the helpers from `lib/component.js` (`ComponentType` / `ComponentInstance`) instead of handwritten `Drupal.behaviors` boilerplate.
- Keep binary files (images, fonts) out of the repository where possible; prefer inline SVGs or external assets. Existing component demo assets in `components/*/assets/` are acceptable.
- Acceptable approaches:
  - `src/theme.css` is customizable at runtime by copying it to the web root — do not hard-code colors in components; use the semantic CSS variables.
  - `src/fonts.css` defines the font faces; customize by copying to the web root.
- Do not subtheme Mercury. For deeper customizations, copy the theme to `web/themes/custom/mercury` and remove the contrib dependency (see [CUSTOMIZING.md](CUSTOMIZING.md)).
- Before deleting a module or export, verify all usages. A module is only dead when no import path references it.
- Never leave empty catch blocks — log the error or rethrow it.
- No runtime or logic code may depend on loose types; JS should use clean, predictable structures and avoid implicit type coercions where avoidable.
- Search for an existing helper before adding a new one — never create duplicates (check `lib/` and existing components first).

---

## Design System & Theming

- Use semantic design tokens from `src/theme.css` (`--background`, `--foreground`, `--primary`, `--muted`, `--border`, …) instead of hard-coded colors. All components must work in light and dark mode.
- Colors are mapped into Tailwind in `src/main.css` via `@theme inline` (e.g. `bg-background`, `text-foreground`, `border-border`).
- Surface hierarchy and status semantics follow the shadcn/ui token model:
  - base background → `--background`
  - surface/card → `--card` / `--card-foreground`
  - muted/nested surface → `--muted` / `--muted-foreground`
  - destructive/errors → `--destructive` / `--destructive-foreground`
- Customizing fonts, colors, and tokens is documented in [CUSTOMIZING.md](CUSTOMIZING.md). Theme token reference lives in `src/theme.css`.

---

## Routing

- Routing is handled entirely by Drupal; Mercury provides template overrides in `templates/` (layout, navigation, block, views, misc).
- The theme's regions are defined in `mercury.info.yml`: `content`, `header`, `footer`.
- Known gaps: none that require route creation in this theme. Do not introduce routing logic; this is a theme, not a module.

---

## UI Components & UX

- Base the UI on the SDC components in `components/` (accordion, button, card, heading, navbar, etc.) and extend them consistently.
- Every component has a `*.component.yml` schema. Keep schemas in sync with the corresponding `*.twig` template.
- Accessibility is a priority: semantic HTML, `aria` attributes where needed, visible focus states (see navbar and anchor components for existing patterns).
- Component JS must encapsulate behavior in a `Drupal.behaviors`-compatible way via `lib/component.js`.
- Use CVA for conditional classes in components — never conditionals in markup (see detailed coding rules in [docs/theme-coding-rules.md](docs/theme-coding-rules.md)).
- Layouts stack vertically on mobile and switch to horizontal only at defined breakpoints. No fixed pixel widths — use Tailwind responsive utilities.

---

## Backend, Data & Migrations

- This theme does not define schema or migrations. Drupal core and contributed modules handle persistence.
- Do not add database-dependent code to the theme. Any server-side logic (hooks, render callbacks) belongs in `src/Hook/` and must be Drupal API–compliant.
- Environment variables specific to this theme: none. Drupal-wide env handling applies.

---

## Tooling & Local Development

| Task | Command |
|---|---|
| Install dependencies | `npm install` |
| Development watch | `npm run dev` |
| Production build | `npm run build` |
| Format | `npm run format` |
| Format check | `npm run format:check` |
| Tests | Drupal test runner (e.g. `phpunit` via Drupal core) for `tests/src/` |

- One formatter is the single source of truth: Prettier (`npm run format`). Run it across the whole repo; no manual style adjustments against the formatter.
- `npm run format:check` must pass and `npm run build` must be run before every commit affecting CSS/Twig/JS.
- Some files are excluded from formatting via `.prettierignore` (e.g. `templates/layout/html.html.twig`); do not remove these exclusions without reason.
- The build regenerates `build/main.min.css` (Tailwind) and `build/motion.js` (esbuild). Commit updated build artifacts atomically with source changes.

---

## Naming Conventions

| Kind | Convention | Example |
|---|---|---|
| SDC components / folders | `kebab-case` | `hero-side-by-side/`, `card-pricing/` |
| SDC schema files | `<name>.component.yml` | `button.component.yml` |
| SDC templates | `<name>.twig` | `button.twig` |
| JS components | `PascalCase` classes | `Accordion`, `ComponentType` |
| JS files | `camelCase` or component `kebab-case` | `component.js`, `accordion.js` |
| Component instance IDs | `camelCase` unique behavior ID | `accordion`, `anchor` |
| CSS custom properties | `--kebab-case`, shadcn/ui naming | `--background`, `--muted-foreground` |

---

## Commits

- Commit after every completed, atomic task — not only on explicit request.
- One commit = exactly one completed change. Do not mix topics.
- **Prefix style:** `add:`, `mod:`, `fix:`, `delete:`, `docs:`, `refactor:`,
  `perf:`, `test:`, `build:`, `ci:`, `chore:`, `revert:`.
- Message: lowercase, imperative mood, describes what changed and why.
  Never just `update`, `changes`, or `wip`.
- Optional scope in parentheses: `fix(navbar): handle mobile menu edge case`.
- Mark breaking changes with `!`.
- No secrets, tokens, or API keys in commit messages.
- Push only on explicit request — commit locally first.

---

## Tests & Quality Assurance

- Tests live in `tests/src/` (Functional, Kernel, Traits).
- When refactoring a component or module, keep its tests and mocks up to date.
- Before every commit: `npm run format:check` → `npm run build`. These must pass.
- The Drupal test suite (Functional/Kernel tests) should be run before merging significant changes.
- Exceptions (e.g. checks cannot run): document the blocker and attach manual test evidence in the PR description.

---

## Documentation & Communication

- Human-readable documentation lives in [README.md](README.md), [CUSTOMIZING.md](CUSTOMIZING.md), and [RELEASE-PROCESS.md](RELEASE-PROCESS.md). Keep them in sync with changes.
- Component-specific behavior and props are documented in each `*.component.yml`; update them when schemas change.
- Keep this file up to date when new standards are introduced; justify changes.

---

## General Agent Behavior

- Work autonomously until the task is fully complete, then commit immediately.
- If anything about a task is unclear or ambiguous, **ask before making changes** rather than guessing.
- After frontend/theme changes, run `npm run format` and `npm run build` before committing.
- Keep this file and [docs/theme-coding-rules.md](docs/theme-coding-rules.md) current whenever conventions change.
- Never introduce a technology listed under **Explicitly excluded**.
- Never add secrets or credentials to any tracked file.

---

## Detail Files

| File | Contents |
|---|---|
| [docs/theme-coding-rules.md](docs/theme-coding-rules.md) | CVA usage, HTML tag structure, component includes, formatting rules |
| [README.md](README.md) | Project overview, customization, known issues, roadmap |
| [CUSTOMIZING.md](CUSTOMIZING.md) | Fonts/colors, advanced customization, building CSS, code formatting, component JS |
| [RELEASE-PROCESS.md](RELEASE-PROCESS.md) | Release steps and versioning |

---

## Theme Coding Rules

The detailed, Mercury-specific coding rules are maintained in
[docs/theme-coding-rules.md](docs/theme-coding-rules.md).

Summary:

1. **Always use CVA for conditional classes** — never inline conditionals in HTML attributes.
2. **Use `yes`/`no` strings for CVA variant keys** — not `true`/`false`.
3. **Format CVA definitions and `.apply()` calls** — multi-line format for readability.
4. **Use arrays for long class strings** — when they exceed 80–100 characters.
5. **Normalize array/string inputs for `Cva::apply()`** — handle both formats before passing.
6. **Compute values before HTML** — all conditionals resolved before tag attributes.
7. **Attributes need a leading space** — `<div {{ attributes }}>`, not `<div{{ attributes }}>`.
8. **No inline control structures in attributes** — assign values to variables first.
9. **No split tags across conditionals** — keep opening and closing tags together.
10. **No dynamic tag names** — use explicit HTML tags.
11. **Use `with only` / `with_context: false`** on component includes.
12. **Only pass configurable props** — props must exist in the component schema.
13. **Run `npm run format` and `npm run build`** after changes.