# REVEAL DESIGN — architecture

Technical overview and design record for **REVEAL DESIGN** in dig-dug-portal. For UI conventions and product/session rules as they are decided, see [`DESIGN.md`](./DESIGN.md).

The root shell is **`../cfdeScope2Design.vue`** (registered as `cfde-scope2-design`, portal `"component": "cfdeScope2Design"`). Sub-components and utility modules for this project live in this directory (`cfdeScope2Design/`), following the same pattern as `revealScope/` (REVEAL SCOPE) and `revealKgWorkspace/` (REVEAL KG Canvas).

**Status:** early build. The shell renders a header (brand mark + `DesignMenuBar`) and a stage with three input fields (Hypothesis, Genes, Experiment Constraints, hydrated from a SCOPE handoff URL), an Advanced Experiment Parameters section (Assay Types/Cell Types/Assay Readouts, Throughput/Species/Timeline — copied from `cfdeDesign.vue`), and a "Review & Generate Experiment Plan" button. Clicking it flips a folder-tab bar ("Experiment Configuration" / "Experiment protocol", mirroring `revealScope.vue`'s own tab pattern) to a still-placeholder protocol panel — no protocol generation (LLM call, real results rendering) exists yet. This document records the scope decisions made so far so a coding agent picking this up has full context before that lands.

**LLM provider (locked decision, 2026-09-08):** any LLM call this component makes must use `createLLMClient({ llm: "bedrock", ... })` — matching SCOPE's own default, not `cfdeDesign.vue`'s `sectionConfigs.llm || 'gemini'` default. No LLM call exists yet; this is recorded now so the first one that's added doesn't silently default to gemini.

---

## Why this component exists (as decided so far, 2026-09-08)

There is an existing, much larger, single-file component, **`../cfdeDesign.vue`** (~5,560 lines, registered in the portal under both `cfdeDesign` and a legacy alias `cfdeValidationPlanner`). It already does LLM-based generation of wet-lab validation-experiment protocols given a hypothesis and a list of candidate genes, plus its own gene prioritization/tiering step (delegated to a separate child component, `research-gene-set-utility.vue`).

Read and reported on in full before this component was created (see the research pass earlier this session) — key findings that motivated a **new, separate, narrower component** rather than extending `cfdeDesign.vue` in place:

- `cfdeDesign.vue` is a flat "form → single LLM call → formatted output" tool with no hub/session model, a large amount of dead code left over from an earlier gene-evidence-table UI, at least one real bug (an error-path branch sets a nonexistent `showSearchDraft` data property instead of the real `showExperimentSummary` flag — a silent no-op), and per-gene/per-group generation that runs strictly sequentially with no batching.
- Its gene-prioritization/tiering step (rank, filter, group candidate genes via `research-gene-set-utility.vue`, which itself calls Pharos GraphQL plus 4 separate LLM clients) exists to solve a problem **REVEAL SCOPE has already solved** by the time it would hand off to DESIGN: SCOPE resolves one specific target gene (HGNC-confirmed via `resolved_id`) as part of hypothesis evaluation, not an unranked candidate list. Re-running gene prioritization on a single already-resolved gene is pure overhead.
- Product decision (this session): **REVEAL DESIGN's scope is narrowed to experiment-protocol building only.** No gene prioritization/tiering, no candidate-gene ranking UI, no dependency on `research-gene-set-utility.vue`. Input is a single resolved hypothesis (target/perturbation/outcome/modifiers), not a gene list to be triaged.

This maps to Module D ("Dataset & Workspace Provisioner") from SCOPE's own architecture spec (`../revealScope/ARCHITECTURE.md` §4, §6, §9) — specifically **Path B** ("no data exists anywhere indexed → protocol/pipeline template for generating new data"), which the spec explicitly calls "the more differentiating capability of this module." **Path A** (direct handles to existing GEO/SRA/etc. accessions for gaps that already have unlinked data) is explicitly **not** in scope for this component yet — see Open Decisions below.

## Relationship to `cfdeDesign.vue`

This is a **new, separate component**, not a fork or in-place rewrite of `cfdeDesign.vue`. `cfdeDesign.vue` is left untouched and continues to serve its existing entry points (`cfdeDesign`, `cfdeValidationPlanner`) in the portal.

Candidates for reuse from `cfdeDesign.vue`, to evaluate once real implementation starts (not decided yet — reuse the *idea*, not necessarily the code as-is, given the bugs/dead code noted above):
- The experiment-protocol JSON schema and its LLM system prompt (`experiment_system_prompt`, `cfdeDesign.vue:1112-1191`) — the shape of a generated protocol (`biological_assertion`, `suggested_experiment`, `Why_validate`, `protocol_sketch`, `feasibility_details`, `design_critique`, `provenance`) is a reasonable starting point.
- ~~The assay-type / cell-type / assay-readout reference data (`cfdeDesign.vue:789-1110`)~~ — **done, 2026-09-08:** copied verbatim into `cfdeScope2Design/designExperimentParams.js`, and the Advanced Experiment Parameters UI that reads it (Assay Types/Cell Types/Assay Readouts dropdowns + Throughput/Species/Timeline selects) copied into `cfdeScope2Design.vue` per explicit user instruction, same "deliberate exception" to the `rd-` class-prefix convention as the three main fields (see DESIGN.md).
- The experiment-card results rendering and `.txt` download pattern (`downloadExperiment`/`formatExperimentForDownload`, `cfdeDesign.vue:2642-2859`) — not yet reused; no results panel exists here yet.

Not carried over: gene chip picker, `research-gene-set-utility` integration, per-gene/per-group generation-strategy branching (individual/combined/per-group), the dead gene-evidence-table code, the two known bugs.

## SCOPE → DESIGN handoff (implemented, 2026-09-08)

SCOPE's "Design experiment protocol" action (`revealScope/scopeDesignHandoff.js`, gated on an evaluation existing) opens `kcURL("/r/cfde_scope2design?...")` in a new tab with three URL params — `kcURL()` (from `@/utils/cfdeUtils`, the same helper `cfdeDesign.vue` itself uses for its own outbound links) resolves that to `/research.html?pageid=cfde_scope2design&...` on localhost and passes the `/r/cfde_scope2design?...` path through unchanged on a deployed server. Params are read here via the same `utilsBox.keyParams` mechanism `cfdeDesign.vue` already uses (see `initializeFromKeyParams()` in this component):

| URL param | Source in SCOPE's evaluation | Lands in |
|---|---|---|
| `hypothesis` | `activeHypothesisText` (raw hypothesis text, unparsed) | Hypothesis field |
| `genes` | `slots.target.resolvedId` (falls back to `.value`) — a single resolved gene symbol, not a list | Genes field |
| `constraints` | Every other evaluated slot (`perturbation`, `outcome`, all 5 `modifiers`), one explicitly labeled non-empty line each (e.g. `"Outcome: increased mitochondrial oxygen consumption rate (OCR)"`) — **not** an unlabeled blob | Experiment Constraints field |

Deliberately **not** sent yet: `researchContext` (this component only has three fields, no fourth Research Context field — see "Explicitly out of scope" below was already the case even before this), the evaluation's `rubric` (precision/falsifiability scores), and any KG/BiomarkerKB evidence-gap summary. An earlier sketch of this contract (superseded by the above) considered sending a structured `evidence_gaps` object so DESIGN could frame *why* a validation experiment is worth running (an `UNEXPLORED` KG route or a `same_domain_mismatched_context` BiomarkerKB result being exactly the kind of gap Module D's Path B addresses) — not implemented in this pass; the free-text Experiment Constraints field is the only channel evidence context could ride in on for now, and nothing currently puts it there.

## Explicitly out of scope (for now)

| Item | Status | Note |
|---|---|---|
| Gene prioritization / tiering / ranking | Excluded by product decision (this session) | SCOPE already resolves a single target gene; re-ranking it is redundant. `research-gene-set-utility.vue` is not a dependency of this component. |
| Path A (existing dataset/GEO/SRA handle lookup) | Deferred, not decided | The harder-to-build half of SCOPE's Module D. Not ruled out permanently — just not started. Confirm scope before building Module D "fully" per SCOPE's own recommendation not to build Path A as an afterthought once Path B ships. |
| Multi-gene / multi-hypothesis batch generation | Not needed | Input is one resolved hypothesis at a time, matching SCOPE's own single-hypothesis-per-session model. |

## Open decisions — flagged for resolution before/during build

1. ~~**Handoff transport mechanism.**~~ **Resolved 2026-09-08:** URL params via `utilsBox.keyParams`, same mechanism `cfdeDesign.vue` already uses (`hypothesis`, `genes`, `constraints` — `researchContext` deliberately not sent, since this component only has three fields). SCOPE opens `kcURL("/r/cfde_scope2design?...")` in a new tab — environment-aware (see "SCOPE → DESIGN handoff (implemented)" below for exactly what `kcURL()` does on localhost vs. a deployed server).
2. **Path A scope.** Confirmed out of scope for the first build, but not permanently ruled out. Needs an explicit decision before this is considered a complete implementation of SCOPE's Module D.
3. **Relationship to `cfdeDesign.vue` long-term.** Does this component eventually replace `cfdeDesign.vue`'s protocol-generation entry points, or do the two coexist indefinitely (one for the general/manual gene-list flow, one for the SCOPE-fed single-hypothesis flow)? Not decided.

---

## Current implementation

| Path | Purpose | Status |
|------|---------|--------|
| `../cfdeScope2Design.vue` | Shell: header (REVEAL/DESIGN brand + `DesignMenuBar`), a folder-tab bar ("Experiment Configuration" / "Experiment protocol", shown only once a protocol exists — mirrors `revealScope.vue`'s `.scp-module-tabs` pattern) over the config panel (Hypothesis/Genes/Experiment Constraints, hydrated from SCOPE's handoff URL, plus Advanced Experiment Parameters and the "Review & Generate Experiment Plan" button) and an "Experiment protocol" panel | Tabs + config panel built; `reviewAndGenerate()` only logs and flips to the (placeholder) protocol tab for now, no LLM call/real results yet |
| `cfdeScope2Design/DesignMenuBar.vue` | Session (Reset/Import/Export session) / Actions (plain button) / Help (Learn DESIGN/Documentation) top menus | Built — mirrors `revealScope/ScopeMenuBar.vue` exactly (`rd-` prefixed classes); `onMenuAction` in the shell currently only logs to console, no Session/Actions/Help behavior wired yet |
| `cfdeScope2Design/designExperimentParams.js` | `ASSAY_TYPES`/`CELL_TYPES`/`ASSAY_READOUTS` reference data | Built — copied verbatim from `cfdeDesign.vue`'s own `data()` |

---

## Registration in the portal

`cfdeScope2Design.vue` is registered in `ResearchSectionComponents.vue` as `cfde-scope2-design`. Portal section JSON uses `"component": "cfdeScope2Design"`.

---

## Related documents

| Document | Audience |
|----------|----------|
| [`DESIGN.md`](./DESIGN.md) | Contributors — UI rules, product/session conventions |
| `Documents/GitHub/DESIGN.md` | Cross-project baseline UI rules (borders, minimum font size) |
| `../revealScope/ARCHITECTURE.md` | Sibling REVEAL product (SCOPE) — source of the handoff-contract sketch above, and of Module D's Path A/B framing |
| `../cfdeDesign.vue` | Legacy, larger component this one is deliberately narrower than — see "Relationship to `cfdeDesign.vue`" above |

---

## Changelog

Record every architecture-affecting decision here — new module behavior, schema changes, resolved open decisions, or sequencing changes — so a coding agent picking up this project has full context without needing prior chat history.

| Date | Note |
|------|------|
| 2026-09-08 | Initial scaffold: `cfdeScope2Design.vue` created and registered in the portal; no sub-components yet. Scope narrowed to experiment-protocol building only, per explicit user decision — no gene prioritization/tiering, no dependency on `research-gene-set-utility.vue`, input is a single SCOPE-resolved hypothesis rather than a gene list to triage. Reviewed `cfdeDesign.vue` in full beforehand (found dead code, a real bug in its error path, sequential-only generation, an unused second system prompt) to decide what's worth reusing vs. rebuilding — see "Relationship to `cfdeDesign.vue`" above. Handoff contract from SCOPE is sketched but not implemented; three open decisions flagged (transport mechanism, Path A scope, long-term relationship to `cfdeDesign.vue`) |
| 2026-09-08 | Per user request ("set up the header menu and workspace like SCOPE for UI/UX continuity"), built `DesignMenuBar.vue` as a direct port of `revealScope/ScopeMenuBar.vue` — same Session (Reset/Import/Export session) / Actions (plain button) / Help (Learn DESIGN/Documentation) structure, same `b-dropdown`/`b-button` markup, only the CSS class prefix (`rd-` instead of `scp-`) and the "Learn DESIGN" label changed. Wired into `cfdeScope2Design.vue`'s header next to the brand mark, with a stub `onMenuAction` that only logs for now — none of Session/Actions/Help has real behavior yet since there is no session/workspace model to reset/import/export or act on. Also locked in this session: any future LLM call in this component uses Bedrock (`createLLMClient({ llm: "bedrock" })`), matching SCOPE's own default rather than `cfdeDesign.vue`'s gemini default |
| 2026-09-08 | Built the receiving side of the SCOPE handoff and resolved open decision #1 (transport mechanism = URL params via `utilsBox.keyParams`, confirmed with the user rather than guessed — the page's own `pageid` (`cfde_scope2design`) is CMS-managed and was given directly by the user, not something this repo could derive). Added Hypothesis (`textarea`), Genes (plain `<input type="text">`, no chip/edit-mode UI — per explicit user instruction to simplify vs. `cfdeDesign.vue`'s own gene picker), and Experiment Constraints (`textarea`) fields to `cfdeScope2Design.vue`'s stage, with their markup and CSS classes (`hypothesis-container`, `section-wrapper`, `hypothesis-textarea`, `notes-textarea`, etc.) copied directly from `cfdeDesign.vue` per explicit user instruction — kept their original (non-`rd-`-prefixed) names for fidelity to that source rather than renamed to this product's own convention, and scoped in a dedicated `<style scoped>` block so those fairly generic names can't leak elsewhere. Added `initializeFromKeyParams()`, a simplified 3-field port of `cfdeDesign.vue`'s own method of the same name (no `researchContext`, no gene-list parsing/deduping — just three plain string assignments), triggered by the same `utilsBox` immediate watcher pattern. See "SCOPE → DESIGN handoff (implemented)" above for the exact field mapping |
| 2026-09-08 | Per user request: (1) removed `background: #ffffff` from `.hypothesis-container`/`.section-wrapper` so the config panel no longer sits on a white card; (2) added the Advanced Experiment Parameters UI below Experiment Constraints — Assay Types/Cell Types/Assay Readouts (checkbox dropdowns with selected-item chips) and Throughput/Target Species/Project Timeline (selects), collapsed by default behind the same "+/−" toggle `cfdeDesign.vue` uses — copied directly from `cfdeDesign.vue`, reference data extracted to new `designExperimentParams.js` (`ASSAY_TYPES`/`CELL_TYPES`/`ASSAY_READOUTS`); (3) added a "Review & Generate Experiment Plan" button (`reviewAndGenerate()`) below it — currently only logs its full payload to console, since no LLM call or results panel exists yet. Kept `.filter-section`'s own `background: #ffffff` (the individual Assay/Cell/Readout boxes) — only `.hypothesis-container` was asked to lose its white background, not every copied element |
| 2026-09-08 | Two fixes/additions per user feedback on a screenshot: (1) fixed a real overlap bug — `.configuration-header`'s copied `margin-top: -15px` (calibrated for `cfdeDesign.vue`'s own layout, where an `.additional-notes` wrapper absorbed it) pulled the "Advanced Experiment parameters" toggle up into the Experiment Constraints textarea once that wrapper was removed here; changed to `margin-top: 12px`. (2) Restructured "Experiment Configuration" from a plain `<h4>` header into a folder-tab bar matching `revealScope.vue`'s own `.scp-module-tabs`/`.scp-module-tab` pattern exactly (same fused-tab CSS formula), new `rd-module-tabs`/`rd-module-tab` classes (not part of the "deliberate exception" copy — this is DESIGN's own UI, inspired by but not copied from SCOPE, so it gets the `rd-` prefix per DESIGN.md's convention). A second tab, "Experiment protocol," appears only once `hasGeneratedProtocol` is true — set by `reviewAndGenerate()`, which also auto-switches to it, mirroring SCOPE's own auto-switch-on-action-start pattern (e.g. `startKgEvidenceSearch` switching to the CFDE KG tab). Before a protocol exists, no tab bar shows and the plain `<h4>` title renders instead — matching the "no tab bar until there's a second thing to switch to" rule already established in SCOPE's own ARCHITECTURE.md |
