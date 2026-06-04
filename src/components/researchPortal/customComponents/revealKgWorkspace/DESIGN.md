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

#### Inspector evidence caching (required)

**All interactive API results shown in the Inspector must be cached on the workspace session** so the user does not re-fetch when switching inspected items, and so **Save KG / Download snapshot / Library load** can restore the same evidence.

| Session field | Contents |
|---------------|----------|
| `nodeConnectionEvidenceCache` | Per node id → per target type → connection candidates |
| `nodeExpressionProfileCache` | Per node id → per reference id → expression payload or error |
| `nodeExpressionReferenceById` | Last expression reference selected per node |
| `edgeProvenanceById` | Per edge id → provenance payload or error |

Rules when adding new Inspector data sources:

1. Write successful (and failed) fetches into the session cache via a handler on `revealKgWorkspace.vue` (mirror `onCacheNodeConnections` / `onCacheNodeExpression`).
2. Pass cached data into Inspector child components as props; skip API calls when cache hits.
3. Include new cache fields in `graphPayloadFromSession`, `sessionFromGraph`, and `normalizeGraphRecord` in `src/utils/userUtils.js` so saved graphs and export bundles carry inspection data.
4. Do **not** clear caches on Library load when the saved graph includes them; only reset on an explicit new graph.

#### Graph cues for cached evidence

When session caches contain Inspector data, the tree graph highlights:

- **Nodes** — orange ring (`#ff6600` / `--cfde-orange`) if the node has connection and/or expression cache entries.
- **Edges** — orange stroke and arrowhead if edge provenance is cached in `edgeProvenanceById`.

Selection uses the same orange styling; selected items do not need a second ring.

### Node action menu (canvas)

Click a node to open a pointer menu (Playground parity). Default actions:

| Label | Behavior |
|-------|----------|
| **Inspect node** | Select node and open Inspector |
| **Remove node** | Remove non–starting nodes from the session graph |
| **Expand graph from node** | Fetch neighbors via connections API seeded on that node |
| **Mark as key node** / **Remove from key nodes** | Mark or unmark any node as a key node (blue fill). Starting nodes use a diamond shape; neighbors use a circle. New graphs start with starting nodes marked as key nodes. Saved with the graph in `highlighted` (key node ids). |

Click the same node again to dismiss the menu. Starting nodes cannot be removed.

### Edge action menu (canvas)

Click an edge to open a pointer menu. Default actions:

| Label | Behavior |
|-------|----------|
| **Inspect edge** | Select edge, open Inspector, load edge provenance when available (gene–trait links) |
| **Expand graph from edge** | Expand from both endpoints via connections API |

Click the same edge again to dismiss the menu.

---

## Visual design

### Borders

**Do not use borders for grouping content.** Borders are visual noise in most cases.

- Prefer spacing, typography (section titles, weight), and background tints only when hierarchy truly needs it.
- Use borders only when required for affordance or structure (e.g. modal shell vs backdrop, input fields, clickable cards that must read as discrete controls).
- Do **not** add borders to layout wrappers or panels (e.g. `.wkb-graph-table-panel`, section containers) unless the user explicitly asks for them.
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

### Sub-header callouts (important warnings)

Use for **action-required or high-salience messages** directly under a modal or section title (sub-header position)—not for routine help text.

- **Class:** `wkb-subheader-callout` (defined in `wkbSharedStyles.css`, imported on `.reveal-kg-workspace`).
- **Markup:** `<div class="wkb-subheader-callout" role="status">…</div>` (or `<p>` if no block children). Optional links inside use white underlined text (styled in the shared sheet).
- **Look:** Solid `--cfde-orange` background (same as primary action buttons), white `13px` copy, `line-height: 1.35`, `padding: 8px 14px`, `border-radius: 999px` (pill, matching Save / primary buttons), left-aligned.
- **When:** Duplication save prompt, approval gates, “you must do X before continuing”.
- **When not:** Default modal descriptions, documentation, or neutral intros (use muted body text instead).

### Modals

- Backdrop + elevation (shadow); avoid heavy bordered “cards inside cards.”
- Section separation via vertical rhythm (`gap`), not boxes with outlines.

### Pagination (paged tables and lists)

Use the **Graph data table pagination** everywhere the workspace shows pageable rows—including the Inspector (top connections, expression, and any future evidence tables).

- **Component:** `WorkspaceGraphTablePagination.vue` (pill control: « ‹ page numbers … › »).
- **Do not** build ad hoc “Previous / Page X of Y / Next” controls in workspace UI.
- Wire `current-page` (1-based), `total-pages`, and `@page-change`; set a specific `aria-label` per surface (e.g. `"Top connections pages"`, `"Expression profile pages"`).
- The component hides itself when `totalPages <= 1`.

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
| `revealKgWorkspace/WorkspaceCanvas.vue` | Main graph canvas (D3 layered tree) |
| `revealKgWorkspace/WorkspaceInspector.vue` | Evidence drawer |
| `revealKgWorkspace/WorkspaceGraphTablePagination.vue` | Standard pill pagination (graph data, inspector tables) |
| `revealKgWorkspace/WorkspaceLibraryModal.vue` | Saved graphs + import/export |
| `revealKgWorkspace/WorkspaceDocumentationModal.vue` | User guide |
| `revealKgWorkspace/WorkspaceGraphDataTableModal.vue` | Tabbed graph data table popup |
| `revealKgWorkspace/revealKgGraphTableData.js` | Table rows, CSV export, edge-derived scores |
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

## Graph visualization

**Use the right library per surface — do not mix approaches on the main canvas.**

| Surface | Library | Reference |
|---------|---------|-----------|
| **Main workspace graph** (`WorkspaceCanvas`) | **D3** (SVG, layered tree) | Playground `HierarchyGraphCanvas.jsx`, `hierarchyGraphData.js`, `graphNodeColors.js` — Genes → Gene sets → Mechanisms → Traits |
| **Smaller / auxiliary networks** (hypothesis maps, sig chains, compact supporting graphs in Analyze flows) | **vis-network** (`vis.js`) | `FactorBaseRevealNetwork2.vue` in dig-dug-portal |

- Main graph: deterministic hierarchy, jumping-edge rules, contextual edges on hover — port/adapt Playground tree view, not force layout.
- **Legend labels (toolbar):** Starting node (anchor diamond); **Active edges** (solid)—links in the saved/working graph; **Contextual edges** (dashed)—API-suggested links not yet in the graph. Do not use the label “Graph edges.”
- Document active vs contextual edges in `WorkspaceDocumentationModal.vue` whenever edge behavior changes.
- Smaller graphs: existing vis-network patterns (physics stabilize then disable; mechanism flow maps with edge labels).
- **Cytoscape** is Playground’s secondary “Canvas view” only; not planned for workspace v1 unless we add an explicit exploratory toggle later.

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
| 2026-06-02 | Graph viz: D3 for main canvas; vis-network for smaller auxiliary networks |
| 2026-06-02 | Initial build: neighboring-nodes checkbox; anchor-links + connections bootstrap; D3 tree canvas |
| 2026-06-03 | Legend: drop Default; rename graph links to Active edges; document edge types in Documentation modal |
| 2026-06-03 | Tree layout: no even-row 25px stagger; rows centered; nodes ordered center-out by edge degree |
| 2026-06-03 | Toolbar table icon opens tabbed graph data modal (Playground ledger columns) |
