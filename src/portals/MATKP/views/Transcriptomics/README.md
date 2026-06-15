# TranscriptomicPrototype

This folder contains the MATKP bulk transcriptomic prototype page that was built from the local handoff package in `prototype-reference/` and adapted into the `matkp-main` portal shell.

## What We Have Done

- Added a new MATKP page entry that builds to `transcriptomics.html`.
- Moved the prototype payloads into the repo under `src/portals/MATKP/data/transcriptomicPrototype/`.
- Built a native Vue page using the shared MATKP nav, footer, styles, and page structure.
- Designed the page around a gene-first transcriptomic viewer with compact forest-plot sections and collapsible evidence tables.
- Iterated the UX toward MATKP-style dense desktop scanning:
  - reduced vertical space
  - moved exact values and long identifiers into tooltips
  - added a top-level interpretation note
  - added scroll-linked section highlighting in the sidebar
  - changed the gene control from a prototype dropdown to a search-style input with local demo genes

## What It Currently Does

- Loads a default gene on first visit.
- Supports a small local demo set of genes: `LEP`, `ADIPOQ`, `UCP1`, `PPARG`, and `PLIN1`.
- Accepts `gene` and `outcome` query params and syncs them back into the URL.
- Renders one section per supported outcome for the active gene.
- Draws compact forest-plot rows from the local JSON payloads.
- Shows full study details, dataset IDs, and labeled effect/CI values in tooltips.
- Keeps evidence rows collapsed by default and lets the user expand them per outcome.
- Highlights the current outcome in the sidebar as the user scrolls.

## What Is Still Left To Do

- Replace the local demo gene lookup with the real API-backed search flow.
- Define the final data-loading contract once backend payloads are available.
- Confirm the final interpretation copy and tooltip content with domain stakeholders.
- Refine responsive behavior if this page needs to work below the current desktop-first assumption.
- Decide whether the forest plot should gain richer legends, filtering, sorting, or download/export behavior.
- Add tests if this page is going to move beyond prototype status.

## Main Files

- `main.js`: data wiring, URL params, scroll tracking, and plot preparation
- `Template.vue`: page layout, controls, forest plot UI, tooltips, and evidence table presentation
