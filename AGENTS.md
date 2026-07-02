# AGENTS.md

# Project Philosophy

This project values:

- Maintainability over cleverness.
- Readability over brevity.
- Consistency over personal preference.
- Scalability over quick fixes.

When multiple valid implementations exist, always prefer the solution that best fits the existing architecture.

Do not introduce new patterns when an existing pattern already solves the problem.

Follow the project's conventions rather than generic Vue or Vite best practices.


---

# Core Principles

Before writing code:

- Inspect the existing implementation.
- Reuse existing utilities.
- Reuse existing components.
- Reuse existing composables.
- Reuse existing animation helpers.

Avoid creating duplicate abstractions.

When unsure, follow the existing architecture instead of introducing a different approach.


---

# Architecture

The application follows a feature-oriented architecture with a clear separation of responsibilities.

## Vue components

Responsible for:

- markup
- component logic
- props
- emits
- composables
- lifecycle
- animations
- accessibility

Vue components are NOT responsible for visual styling.

Keep components focused and easy to understand.

Prefer multiple small components over one large component.


## Styling

Styling is treated as its own architectural layer.

All visual styling belongs inside the centralized SCSS architecture.

Do NOT place CSS inside Vue Single File Components unless explicitly requested.

Do NOT use:

- `<style scoped>`
- inline styles (unless required at runtime)
- CSS Modules

The preferred structure is:

src/assets/styles/

    abstracts/
    base/
    layout/
    utilities/

    components/
    sections/
    pages/


Use the following responsibilities:

components/

Reusable UI styling.

Examples:

- button
- input
- modal
- card
- badge
- avatar
- tooltip


sections/

Page section styling.

Examples:

- hero
- photo-stack
- about
- contact
- case-study


pages/

Only responsible for page composition and page-specific layout.

Example:

_home.scss should import section partials and contain page layout rules only.


---

# SCSS Guidelines

Use:

- @use
- variables
- mixins
- utility classes
- nesting only where it improves readability

Avoid:

- @import
- !important
- ID selectors
- deep selector nesting
- generic tag selectors when classes are more appropriate

Prefer semantic class names.

Example:

.btn
.card
.modal
.home-hero
.home-photo-stack


---

# Vue Guidelines

Use:

- Vue 3
- Composition API
- `<script setup lang="ts">`

Prefer:

- computed over duplicated state
- composables over duplicated logic
- refs only when necessary

Keep templates clean and readable.

Avoid unnecessary wrapper elements.


---

# TypeScript

Prefer explicit types when they improve readability.

Avoid `any` whenever possible.

Use existing shared types before creating new ones.


---

# Components

Before creating a new component:

- Check whether an existing component can be reused.
- Check whether the design system already contains the pattern.

Avoid creating components that are only used once unless they significantly improve readability.


---

# Animations

Animations use GSAP.

Always:

- use the existing animation utilities
- use gsap.context()
- clean up animations on unmount
- remove ScrollTriggers when destroyed

Avoid duplicate timelines.

Animation code should remain readable.

Favor clarity over clever timelines.


---

# Naming

Use descriptive names.

Good:

HomeHeroSection
PhotoStackSection
CaseStudyCard

Avoid vague names like:

Section
Component
Thing
Item


---

# Comments

Comments should explain WHY.

Do not comment obvious code.

Good:

// Prevent layout shift while images load.

Bad:

// Increment counter.


---

# Performance

Avoid unnecessary:

- watchers
- computed properties
- DOM queries
- rerenders

Prefer existing utilities over custom implementations.


---

# Accessibility

Always consider:

- semantic HTML
- keyboard accessibility
- aria labels when necessary
- focus states
- sufficient color contrast


---

# Before Finishing

Before considering a task complete:

- remove unused imports
- remove unused variables
- remove dead code
- remove temporary debugging code
- ensure TypeScript passes
- ensure formatting remains consistent
- ensure naming follows project conventions


---

# Refactoring

When refactoring:

Do not change architecture unless explicitly requested.

Do not rename files, folders, classes or components simply because another solution is preferred.

Preserve the existing coding style.

Minimize unrelated changes.


---

# Definition of Done

A task is complete when:

- the requested functionality works
- the implementation follows the existing architecture
- the code is readable
- styling follows the SCSS architecture
- no unnecessary complexity has been introduced
- the codebase is more maintainable than before


---

# Golden Rule

When in doubt:

Follow the existing architecture instead of introducing a new one.

Consistency is more valuable than novelty.