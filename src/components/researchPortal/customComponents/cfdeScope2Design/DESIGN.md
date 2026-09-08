# REVEAL DESIGN — design rules

This document captures UI and product conventions for **REVEAL DESIGN** in dig-dug-portal. Use it when adding or changing files under `cfdeScope2Design/` and `cfdeScope2Design.vue`.

For system structure, scope decisions, the draft SCOPE handoff contract, and open decisions, see [`ARCHITECTURE.md`](./ARCHITECTURE.md) in this folder.

For cross-project baseline rules (borders, minimum font size), also follow the workspace-root document at `Documents/GitHub/DESIGN.md`.

Reference implementation for visual tokens and most conventions below: **`../revealScope/DESIGN.md`** (REVEAL SCOPE) — DESIGN borrows directly from its nearest sibling in the REVEAL fleet (SCOPE, which itself already adapted these from REVEAL KG Canvas) rather than re-deriving a visual language from scratch. Copy conventions from there as they become relevant; do not invent parallel ones.

---

## Product model

- **Not a hub-and-spoke workbench like SCOPE, and not the flat "config form → one LLM call" shape of legacy `cfdeDesign.vue` either.** The actual shape is still being decided as real features land — start minimal and update this section once the first real flow (single SCOPE-resolved hypothesis → generated protocol) is built, rather than guessing ahead of it.
- Input is **one resolved hypothesis at a time** (target/perturbation/outcome/modifiers), not a candidate-gene list to triage — see `ARCHITECTURE.md`'s scope-narrowing decision. Do not build gene-list/multi-select UI here.
- No user guide text / help copy beyond what's asked for, per this session's established feedback: the best UI doesn't need a user guide. Prefer no explanatory prose under headers unless explicitly requested.

## Open items to resolve before the affected UI is built

Tracked in `ARCHITECTURE.md`'s Open Decisions — do not silently default these in code:

1. ~~Handoff transport mechanism from SCOPE~~ — resolved 2026-09-08: URL params via `utilsBox.keyParams`, already implemented in `cfdeScope2Design.vue`.
2. Whether Path A (existing dataset/GEO/SRA handles) is ever in scope for this component, or stays a SCOPE-only concern.

## Visual design

Same CFDE Knowledge Center palette and typography as REVEAL SCOPE — defined on `.rd-shell` (this product's root wrapper class, parallel to SCOPE's `.reveal-scope`) so child components inherit them.

### Color (CFDE Knowledge Center palette)

| Token | Value | Use |
|-------|-------|-----|
| `--cfde-orange` | `#e07b39` | Brand accent, primary actions |
| `--cfde-orange-dark` | `#c2662b` | Hover / emphasis |
| `--cfde-orange-soft` | `#fbeee3` | Soft highlights |
| `--cfde-blue` | `#2c5c97` | Titles, secondary actions |
| `--cfde-border` | `#e6e1d6` | Structural borders only |
| `--cfde-bg` | `#f6f5f2` | Panel / subtle fills |
| `--cfde-ink` | `#33363d` | Body text |
| `--cfde-muted` | `#6b6b6b` | Secondary text |

**Header brand mark:** `REVEAL` in `--cfde-orange` (bold, letter-spacing), product name (`DESIGN`) in `--cfde-blue` next to it — same treatment as SCOPE's and KG Canvas's header mark. Already applied in the current scaffold.

### Borders

Same rule as SCOPE: **do not use borders for grouping content.** Prefer spacing/typography/background tints; reserve borders for genuine affordance (inputs, modal shell vs. backdrop, discrete clickable cards).

### Typography

- Minimum font size for readable UI copy: `13px`. Same font stack: `"Inter", "Segoe UI", system-ui, -apple-system, sans-serif`.

### Class-name prefix convention

Use `rd-` for this product's own CSS classes (root shell: `rd-shell`, `rd-header`, `rd-brand`, `rd-mark`, `rd-title`, `rd-stage`), distinct from SCOPE's `rs-`/`scp-` prefixes and KG Canvas's `wks-`/similar — so the two products' scoped styles never collide if ever rendered together, matching the isolation discipline already established between SCOPE and KG Canvas.

**Deliberate exception:** the Hypothesis/Genes/Experiment Constraints fields and the Advanced Experiment Parameters section (Assay Types/Cell Types/Assay Readouts dropdowns, Throughput/Species/Timeline selects) in `cfdeScope2Design.vue` keep `cfdeDesign.vue`'s own original class names (`hypothesis-textarea`, `notes-textarea`, `hypothesis-container`, `filter-section`, `dropdown-content`, `constraint-select`, etc.) rather than `rd-`-prefixed ones — a direct copy per explicit user instruction, not a naming-convention lapse. Kept inside their own `<style scoped>` block so the generic names can't leak elsewhere in the app. Do not "clean up" these names to `rd-*` without checking whether that's still wanted — the point was fidelity to the source.

### Sub-header callouts, modals, pagination

Follow `../revealScope/DESIGN.md`'s existing rules verbatim once the relevant UI exists here (action-required orange pill callouts, backdrop+elevation modals with no bordered "cards inside cards," one shared pill-style pagination pattern for any pageable list). Do not build ad hoc alternatives.

### Folder tabs for real content tabs

Same convention as SCOPE (`../revealScope/DESIGN.md`'s folder-tab-vs-pill-toggle split): a bordered, top-radius-only tab (`rd-module-tab`/`rd-module-tab.is-active` here) for switching between real content sections above a stage panel (Experiment Configuration / Experiment protocol). Only appears once there's a second thing to switch to (no tab bar while there's only Experiment Configuration) — do not show a single-tab bar. Pill-style toggles remain reserved for modal-internal switches, not used yet in this product.

## Code layout

See **`ARCHITECTURE.md`** for scope decisions, the draft handoff contract, and open decisions.

| Path | Purpose |
|------|---------|
| `../cfdeScope2Design.vue` | Shell: header (REVEAL/DESIGN brand + `DesignMenuBar`), folder-tab bar (Experiment Configuration / Experiment protocol), config panel (Hypothesis/Genes/Experiment Constraints, Advanced Experiment Parameters, Review & Generate button), protocol panel (placeholder) |
| `cfdeScope2Design/DesignMenuBar.vue` | Session / Actions / Help top menus — direct port of `revealScope/ScopeMenuBar.vue` |
| `cfdeScope2Design/designExperimentParams.js` | Assay Types / Cell Types / Assay Readouts reference data, copied from `cfdeDesign.vue` |

---

## Changelog

| Date | Note |
|------|------|
| 2026-09-08 | Initial scaffold. Visual tokens and most conventions borrowed directly from `../revealScope/DESIGN.md` rather than re-derived; product-model section deliberately left open pending the first real feature (SCOPE-resolved single hypothesis → generated protocol) |
| 2026-09-08 | Built `DesignMenuBar.vue`, a direct port of `revealScope/ScopeMenuBar.vue` (`rd-` class prefix, "Learn DESIGN" label) — no behavior wired yet, structure only |
| 2026-09-08 | Added the three input fields (Hypothesis, Genes, Experiment Constraints), copying `cfdeDesign.vue`'s own markup/class names directly per explicit user instruction (Genes simplified to a plain text input, no chip/edit-mode UI) — see the "Deliberate exception" note above |
| 2026-09-08 | Removed `background: #ffffff` from `.hypothesis-container`; added the Advanced Experiment Parameters UI and "Review & Generate Experiment Plan" button, copying `cfdeDesign.vue`'s markup/class names directly (same "deliberate exception" as the three main fields) |
| 2026-09-08 | Fixed a copied-CSS overlap bug (`.configuration-header`'s `margin-top: -15px`, calibrated for a wrapper `cfdeDesign.vue` has that this component doesn't). Restructured "Experiment Configuration" into a folder-tab bar with a second "Experiment protocol" tab that appears once `hasGeneratedProtocol` is true — new `rd-module-tabs`/`rd-module-tab` classes, documented as this product's own UI (not a "deliberate exception" copy) |
