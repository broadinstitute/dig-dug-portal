# REVEAL SCOPE — design rules

This document captures UI and product conventions for **REVEAL SCOPE** in dig-dug-portal. Use it when adding or changing files under `revealScope/` and `revealScope.vue`.

For system structure, data model, module specs, and cross-cutting behavior requirements, see [`ARCHITECTURE.md`](./ARCHITECTURE.md) in this folder — most of the "hard rules" for this product (bounded honesty, staleness flags, `PENDING` vs `COMPLETE_NO_RESULTS`, confidence propagation, grounding discipline) live there in §7 and are binding on any UI built here, not just on the data layer.

For cross-project baseline rules (borders, minimum font size), also follow the workspace-root document at `Documents/GitHub/DESIGN.md`.

Reference implementation for hub/session-style architecture docs: `../revealKgWorkspace/ARCHITECTURE.md` and `DESIGN.md` (REVEAL KG Canvas) — not a UI pattern to copy, since SCOPE is a workbench (four independent on-demand panels), not a canvas.

---

## Product model

- **Hub-and-spoke workbench, not a linear stepper or pipeline.** Modules A–D are independent and user-invoked in any order; do not build UI that implies a required sequence beyond "hub must parse first."
- **No forced completeness.** A user may run only Module A and stop; the UI must not nag toward running B/C/D as if they were required steps.
- Module A/B must never visually block on or wait for Module C/D (they are sync/instant; C/D are async/on-demand).

## Open items to resolve before the affected UI is built

Do not silently default these in code — they are tracked in `ARCHITECTURE.md` §8 and should be raised to the product/architecture owner when the relevant module is reached:

1. Whether Module C's `CONFLICT` state ships in v1 at all (recommendation: no, ship `VERIFIED`/`REFUTED`/`UNEXPLORED` only until a concrete trigger exists).
2. Whether Module C's multi-hop traversal needs cross-KG entity linkage (determines whether entity-resolution UI/plumbing is in scope for the first Module C build).

## Cross-cutting UI rules (binding, from ARCHITECTURE.md §7)

- **Staleness:** any module panel whose output was computed against an older `hub_version` than the hub's current one must show a visible "stale, re-run?" flag rather than silently continuing to display outdated output.
- **Loading vs. empty state:** async panels (Module C) must render `PENDING`, `COMPLETE_NO_RESULTS`, and `COMPLETE_WITH_RESULTS` as visually distinct states. Never let a skeleton/spinner and a confirmed-empty state look similar enough to be confused.
- **No editorializing on absence:** `COMPLETE_NO_RESULTS` copy is a flat, scoped factual statement (e.g. "not found in KG-Oncology v3, queried 2026-09-03"). Never rephrase absence as a conclusion (e.g. "novel", "unexplored territory") in UI copy or LLM-generated summaries.
- **Confidence flag:** any module output built from a `confidence: low` slot must visibly mark itself as based on low-confidence extraction, not present as equally authoritative as a high-confidence run.
- **Grounding:** every evidentiary claim rendered by Module C must carry a clickable source (KG edge ID, PMID, GEO accession, canonical entity ID). Never show LLM-summarized evidence without the underlying edges alongside it.

## Visual design

SCOPE borrows its general look from **REVEAL KG Canvas** (`revealKgWorkspace/DESIGN.md`) rather than inventing a new visual language. Same tokens, same restraint on borders, same modal/callout/pagination patterns — applied to a workbench of panels instead of a canvas.

### Borders

**Do not use borders for grouping content.** Borders are visual noise in most cases.

- Prefer spacing, typography (section titles, weight), and background tints only when hierarchy truly needs it.
- Use borders only when required for affordance or structure (e.g. modal shell vs backdrop, input fields, clickable cards that must read as discrete controls).
- Do **not** add borders to layout wrappers or panel containers (Module A/B/C/D containers, the hub header) unless explicitly required.

### Typography

- **Minimum font size for readable UI copy: `13px`.** Do not go below 13px for labels, body text, meta lines, or button labels.
- Prefer explicit `13px` or `rem` values that compute to ≥ 13px at the root font size (typically 16px).
- Headings and brand text (e.g. the `REVEAL` / `SCOPE` header mark) may be larger; decorative glyphs may be larger.
- Font stack: `"Inter", "Segoe UI", system-ui, -apple-system, sans-serif` (same as KG Canvas).

### Color (CFDE Knowledge Center palette)

Define and consume the same tokens on `.reveal-scope` so child components inherit them, matching KG Canvas's `.reveal-kg-workspace` tokens:

| Token | Value | Use |
|-------|-------|-----|
| `--cfde-orange` | `#e07b39` | Brand accent, primary actions |
| `--cfde-orange-dark` | `#c2662b` | Hover / emphasis |
| `--cfde-orange-soft` | `#fbeee3` | Soft highlights |
| `--cfde-blue` | `#2c5c97` | Titles, secondary actions |
| `--cfde-border` | `#e6e1d6` | Structural borders only (see above) |
| `--cfde-bg` | `#f6f5f2` | Panel / subtle fills |
| `--cfde-ink` | `#33363d` | Body text |
| `--cfde-muted` | `#6b6b6b` | Secondary text |

**Header brand mark:** `REVEAL` in `--cfde-orange` (bold, letter-spacing), product name (`SCOPE`) in `--cfde-blue` next to it — same treatment as KG Canvas's `REVEAL` / `KG Canvas` header. The current scaffold in `revealScope.vue` uses placeholder gray (`#666`) and should be updated to these tokens when the visual pass happens.

### Sub-header callouts (important warnings)

Use for **action-required or high-salience messages** directly under a panel or modal title — not for routine help text. This is the natural home for staleness flags (ARCHITECTURE.md §7.1) and low-confidence flags (§7.3).

- **Markup:** `<div class="..._subheader-callout" role="status">…</div>` (or `<p>` if no block children).
- **Look:** solid `--cfde-orange` background (same as primary action buttons), white `13px` copy, `line-height: 1.35`, `padding: 8px 14px`, `border-radius: 999px` (pill), left-aligned.
- **When:** hub-version-stale panel, "based on low-confidence extraction" flag, approval gates.
- **When not:** default panel descriptions or neutral intros (use muted body text instead).

### Modals

- Backdrop + elevation (shadow); avoid heavy bordered "cards inside cards."
- Section separation via vertical rhythm (`gap`), not boxes with outlines.

### Pagination (paged tables and lists)

Use one consistent pill-style pagination control everywhere SCOPE shows pageable rows (e.g. Module C's Evidence Matrix, Module D's dataset/accession lists) — same pattern as KG Canvas's `WorkspaceGraphTablePagination.vue` (« ‹ page numbers … › », hides itself when only one page). **Do not** build ad hoc "Previous / Page X of Y / Next" controls per panel; build (or share, if extracted to a common location) one pagination component and wire `current-page` / `total-pages` / `@page-change` consistently, with a specific `aria-label` per surface.

### Documentation / help copy

Write in-panel help and generated summary text in the spirit of **Why → What → How**, woven into natural prose (why someone would use this, what it includes, how it fits a typical session) — not literal `Why:` / `What:` / `How:` labels or headers. Keep paragraphs short; one block per module (A, B, C, D).

## Code layout

See **`ARCHITECTURE.md`** for the full data model, module specs, and build sequencing.

| Path | Purpose |
|------|---------|
| `../revealScope.vue` | Shell: header, stage (module + floating Actions popup), welcome/session state |
| `revealScope/ScopeMenuBar.vue` | Session / Help top menus |
| `revealScope/ScopeWelcomePanel.vue` | Welcome modal: Start SCOPE / Learn SCOPE tabs |
| `revealScope/ScopeEvaluationPanel.vue` + `scopeHypothesisEvaluation.js` | Module A v0 |
| `revealScope/ScopeLiteratureLauncher.vue` + `scopeLiteratureQuery.js` + `scopeLiteratureSources.js` | Module B v0 |
| `revealScope/ScopeActionsPanel.vue` + `scopeActionsCatalog.js` | "Actions" — floating popup, "Next steps" (filtered) / "Actions" (full catalog) tabs |
| `revealScope/scopeSessionFile.js` + `ScopeExportSessionModal.vue` | Session export (filename prompt, Save-As where supported) / import |

See ARCHITECTURE.md's "Current implementation" table for build status and known gaps per file.

---

## Implementation checklist (new UI)

- [ ] No sub-13px text
- [ ] No decorative borders on content groups
- [ ] Uses CFDE CSS variables from `.reveal-scope` (shared with KG Canvas palette)
- [ ] Panel never implies a required order across Modules A–D
- [ ] Async panels implement the 3-state machine (`PENDING` / `COMPLETE_NO_RESULTS` / `COMPLETE_WITH_RESULTS`), visually distinct
- [ ] Stale output (`hub_version` mismatch) is flagged, not silently shown
- [ ] Low-confidence slot inputs are visibly flagged downstream
- [ ] Every Module C claim has a clickable source; edges shown alongside any LLM summary
- [ ] `COMPLETE_NO_RESULTS` copy is flat and scoped, never reworded as a conclusion

---

## Changelog

Record every design/UI-convention decision or change here, with enough context that a coding agent with no prior chat history can act on it.

| Date | Note |
|------|------|
| 2026-09-03 | Initial design doc scaffold: product model, cross-cutting rules restated from ARCHITECTURE.md §7, open decisions carried forward, no SCOPE-specific visual conventions decided yet |
| 2026-09-03 | Visual design borrowed from REVEAL KG Canvas (`revealKgWorkspace/DESIGN.md`): CFDE palette tokens, `Inter` font stack, borders/typography rules, sub-header callout pattern (for staleness/low-confidence flags), modal styling, shared pill pagination, Why/What/How documentation tone. `revealScope.vue` header still uses placeholder gray — not yet updated to tokens |
| 2026-09-03 | "Actions" panel added: a persistent docked panel (right side of the stage, white bg, border-left only — the one place a structural border is warranted per this doc's own border rule) suggesting next steps as plain button chips, no descriptive text per [[feedback_no_guide_text]] — labels only, no two-sentence explanations like the welcome option cards get |
| 2026-09-03 | "Actions" reworked into a floating popup card (CANVAS-assistant-style: title + ✕ + pill tabs "Next steps"/"Actions"), replacing the docked sidebar per direct user feedback. Action buttons now explicitly get a one-sentence description per user request (an exception to [[feedback_no_guide_text]] — asked for directly, not a default): 16px bold label, 13px normal-weight sentence below, solid orange background with white text (the one place solid-orange-fill buttons are used outside the sub-header callout pattern) |
