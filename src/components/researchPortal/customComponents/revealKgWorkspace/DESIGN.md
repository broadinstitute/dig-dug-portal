# REVEAL KG Workspace — design rules

This document captures UI and product conventions for **REVEAL KG Workspace** in dig-dug-portal. Use it when adding or changing files under `revealKgWorkspace/` and `revealKgWorkspace.vue`.

For cross-project baseline rules (including border usage and minimum font size), also follow the workspace-root document at `Documents/GitHub/DESIGN.md`.

Reference implementations: Playground (`cfde-graph-portal-frontend`), API notes in repo-root `KgWorkspaceApis.rtf`, client in `src/utils/revealKgApi.js`, persistence in `src/utils/userUtils.js` (saved graphs).

---

## Product model

- **Canvas-first workspace**, not a linear stepper. The graph canvas is home.
- **No forced end state** — exploration stays open-ended; save when you reach a useful checkpoint.
- **Single persistence concept for graphs:** saved graphs in the browser Library (localStorage). A graph with only seed nodes and no edges is still a valid saved graph.
- **Anchors** (genes, traits, mechanisms) define where search starts; graph build follows anchor commit (see Playground Step 1 for behavior reference).

### Top bar (left → right)

| Area | Role |
|------|------|
| **Change** | Mutate graph structure and scope: Expand KG, Filter KG, Add nodes |
| **Analyze** | Interpret: Explain KG, Build hypotheses, Data provenance |
| **Save** | Persist: New graph, Save KG, Download snapshot |
| **Library** | Browse saved graphs (Load, Duplicate, Delete, Import, Export) |
| **Documentation** | In-app guide modal |

**Order on the right:** Library, then Documentation.

### Inspector

- Right-edge drawer; **evidence only** (node/edge provenance).
- CFDE dataset discovery lives under **Analyze → Data provenance**, not in the Inspector.

---

## Visual design

### Borders

**Do not use borders for grouping content.** Borders are visual noise in most cases.

- Prefer spacing, typography (section titles, weight), and background tints only when hierarchy truly needs it.
- Use borders only when required for affordance or structure (e.g. modal shell vs backdrop, input fields, clickable cards that must read as discrete controls).
- Do **not** wrap documentation sections, feature lists, or What/Why/How-style groupings in bordered boxes.

### Typography

- **Minimum font size for readable UI copy: `13px`.** Do not go below 13px for labels, body text, meta lines, or button labels — especially on high-DPI laptops.
- Prefer explicit `13px` or `rem` values that compute to ≥ 13px at the workspace root font size (typically 16px).
- Headings and brand text may be larger; decorative glyphs (e.g. close `×`) may be larger.

### Color (CFDE Knowledge Center palette)

Define and consume tokens on `.reveal-kg-workspace` so child components inherit:

| Token | Value | Use |
|-------|-------|-----|
| `--cfde-orange` | `#e07b39` | Brand accent, primary actions |
| `--cfde-orange-dark` | `#c2662b` | Hover / emphasis |
| `--cfde-orange-soft` | `#fbeee3` | Soft highlights |
| `--cfde-blue` | `#2c5c97` | Titles, secondary actions |
| `--cfde-border` | `#e6e1d6` | Structural borders only (see above) |
| `--cfde-bg` | `#f6f5f2` | Canvas / subtle fills |
| `--cfde-ink` | `#33363d` | Body text |
| `--cfde-muted` | `#6b6b6b` | Secondary text |

Font stack: `"Inter", "Segoe UI", system-ui, -apple-system, sans-serif`.

### Modals

- Backdrop + elevation (shadow); avoid heavy bordered “cards inside cards.”
- Section separation via vertical rhythm (`gap`), not boxes with outlines.

---

## Documentation copy (Documentation modal)

Write help text in the **spirit of Why → What → How**, woven into natural prose:

1. **Why** — when or why someone would use this
2. **What** — what the feature includes
3. **How** — how it fits into a typical session

**Do not** use literal prefixes or headings such as `What:`, `Why:`, `How:` or orange “What / Why / How” column headers in the UI.

Keep paragraphs short; one feature block per menu or surface (Change, Analyze, Save, Library, Inspector).

---

## Code layout

| Path | Purpose |
|------|---------|
| `revealKgWorkspace.vue` | Shell: header, stage, modals, session state |
| `revealKgWorkspace/WorkspaceMenuBar.vue` | Menus + Library / Documentation buttons |
| `revealKgWorkspace/WorkspaceCanvas.vue` | Graph canvas (viz TBD) |
| `revealKgWorkspace/WorkspaceInspector.vue` | Evidence drawer |
| `revealKgWorkspace/WorkspaceLibraryModal.vue` | Saved graphs + import/export |
| `revealKgWorkspace/WorkspaceDocumentationModal.vue` | User guide |
| `src/utils/revealKgApi.js` | Interactive API client |
| `src/utils/userUtils.js` | Saved graph CRUD + library I/O |

Import API via `revealKgApi` (same-origin `/api/interactive/*`; dig-dug-server proxies to EC2). Do not set `VUE_APP_REVEAL_KG_API_BASE_URL` to EC2 in local dev — that causes CORS.

---

## API conventions (anchors & search)

- Workspace graph operations use **`/api/interactive/*`** only (not legacy RAG `/query/*`).
- **Search & select columns (order):** Genes, Gene sets, Mechanisms, Traits.
- **Catalog typeahead:** `searchInteractiveCatalog(entityType, query)` — `gene`, `trait`, `factor` (UI: mechanisms).
- **Gene set search:** `POST /api/interactive/gene-set/search` with `{ query, limit }` via `searchInteractiveGeneSets` (catalog `gene_set` fallback on 404/405).
- **Free-text anchors:** `parseInteractiveAnchor({ query, context })`.
- **Graph bootstrap from anchors:** `getInteractiveAnchorLinks`, then expansion/connection APIs as needed.

---

## Implementation checklist (new UI)

- [ ] No sub-13px text
- [ ] No decorative borders on content groups
- [ ] Uses CFDE CSS variables from `.reveal-kg-workspace`
- [ ] Menu actions map to Change / Analyze / Save taxonomy
- [ ] Help copy follows prose Why/What/How (no literal labels)
- [ ] API calls go through `revealKgApi`, not ad-hoc fetch paths

---

## Changelog

| Date | Note |
|------|------|
| 2026-06-02 | Initial rules: borders, 13px minimum, documentation tone, palette, product model |
