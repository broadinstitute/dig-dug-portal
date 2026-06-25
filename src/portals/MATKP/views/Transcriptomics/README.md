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

- Loads a default gene on first visit from the MATKP forest API.
- Accepts any gene symbol supported by the live index (e.g. `LEP`, `DBI`).
- Keeps a small **Examples** list in the search UI for quick demo access.
- Accepts `gene` and `outcome` query params and syncs them back into the URL.
- Renders one section per supported outcome for the active gene.
- Draws compact forest-plot rows from the live `single-cell-forest` BioIndex query.
- Shows full study details, dataset IDs, and labeled effect/CI values in tooltips.
- Keeps evidence rows collapsed by default and lets the user expand them per outcome.
- Highlights the current outcome in the sidebar as the user scrolls.

## What Is Still Left To Do

- Replace the QA API host with environment-specific BioIndex configuration when promoted beyond QA.
- Confirm the final interpretation copy and tooltip content with domain stakeholders.
- Refine responsive behavior if this page needs to work below the current desktop-first assumption.
- Decide whether the forest plot should gain richer legends, filtering, sorting, or download/export behavior.
- Add tests if this page is going to move beyond prototype status.

## Main Files

- `main.js`: API fetch, ortholog resolution, URL params, scroll tracking, and plot preparation
- `../../utils/forestGeneApi.js`: BioIndex forest query client
- `../../utils/buildForestGenePayload.js`: API row → page payload adapter
- `Template.vue`: page layout, controls, forest plot UI, tooltips, and evidence table presentation
