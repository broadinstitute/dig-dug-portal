# Liger View

This folder contains the PanKbase Liger exploration page.

At a high level, this page is meant to help a user:

- search for a trait or gene
- see which Liger gene programs are connected to that query
- explore those results either as a hierarchy or as shared programs across contexts
- inspect detail panels for the search root, tissue, cell type, model, and gene program

The page currently uses a Vue 2 parent-coordinator pattern:

- the main page instance owns the shared page state and search flow
- section components render the major UI areas
- same-folder helper modules hold shared config, API logic, state factories, and hierarchy shaping

## File Map

- [main.js](/Users/shilin/Documents/Programming/dig-dug-portal/src/portals/PanKbase/views/Liger/main.js)
  Entry point for the page. Owns page-level state, search orchestration, shared selection flow, and wiring between sections.

- [Template.vue](/Users/shilin/Documents/Programming/dig-dug-portal/src/portals/PanKbase/views/Liger/Template.vue)
  Top-level layout wrapper for the page. Composes the three major sections and carries the shared styles.

- [SearchSection.vue](/Users/shilin/Documents/Programming/dig-dug-portal/src/portals/PanKbase/views/Liger/SearchSection.vue)
  Renders the search controls, search suggestions, loading/error states, and the results toolbar.

- [CanvasSection.vue](/Users/shilin/Documents/Programming/dig-dug-portal/src/portals/PanKbase/views/Liger/CanvasSection.vue)
  Renders the interactive hierarchy/shared-program browser and owns the canvas pan/zoom/pointer behavior.

- [DetailsSection.vue](/Users/shilin/Documents/Programming/dig-dug-portal/src/portals/PanKbase/views/Liger/DetailsSection.vue)
  Renders the detail accordion and owns the gene program detail open/close behavior.

- [ligerConfig.js](/Users/shilin/Documents/Programming/dig-dug-portal/src/portals/PanKbase/views/Liger/ligerConfig.js)
  Static configuration for this view, including defaults, dataset metadata, API endpoint config, and cache shape creation.

- [ligerApi.js](/Users/shilin/Documents/Programming/dig-dug-portal/src/portals/PanKbase/views/Liger/ligerApi.js)
  Shared Liger API helpers, request caching, payload normalization, and search/detail fetch utilities.

- [ligerState.js](/Users/shilin/Documents/Programming/dig-dug-portal/src/portals/PanKbase/views/Liger/ligerState.js)
  Shared state factories and reset helpers used to keep page state initialization and clearing consistent.

- [ligerHierarchy.js](/Users/shilin/Documents/Programming/dig-dug-portal/src/portals/PanKbase/views/Liger/ligerHierarchy.js)
  Shared helpers for shaping search results into a hierarchy, deriving active groups, building shared-program groups, and computing visible detail panels.

## Suggested Editing Guide

- If you are changing API requests or payload shaping, start in `ligerApi.js`.
- If you are changing default state or reset behavior, start in `ligerState.js`.
- If you are changing result-tree/grouping logic, start in `ligerHierarchy.js`.
- If you are changing UI behavior for one section, start in that section component.
- If you are changing cross-section coordination, start in `main.js`.
