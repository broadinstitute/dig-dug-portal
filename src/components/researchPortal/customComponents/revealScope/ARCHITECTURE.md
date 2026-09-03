# REVEAL SCOPE — architecture

Technical overview and source specification for **REVEAL SCOPE** in dig-dug-portal. For UI conventions and product/session rules as they are decided, see [`DESIGN.md`](./DESIGN.md).

The root shell is **`../revealScope.vue`** (registered as `reveal-scope`, portal `"component": "revealScope"`). Sub-components and utility modules for this project live in this directory (`revealScope/`), following the same pattern as `revealKgWorkspace/` (REVEAL KG Canvas).

**Status:** scaffold only. The shell currently renders a header and an empty stage. Hub + Modules A–D below are not yet implemented — this document is the design contract for that build.

---

## Source specification (v1.0, approved for development)

> The section below is the architecture spec as approved, preserved verbatim as the source of truth. Do not silently edit it in place — record any change as a new dated entry in the Changelog at the bottom of this file, and update the spec text itself only when the change is confirmed with the product/architecture owner (see §8 for the two items still open).

**Status:** Approved for development, with 2 flagged open decisions (see §8).
**Product:** SCOPE (hypothesis evaluation workbench) — one product within the **REVEAL fleet**, alongside DESIGN (downstream analytical workspace system). DESIGN has its own spec and is referenced here only at the handoff boundary.

**A naming note for readers of this doc:** "SCOPE" (the product name) and "scope" (the ordinary English word describing coverage boundaries — e.g. *scope-bounded gap metadata*, *out of scope*) both appear frequently below and mean different things. Product name is always capitalized as SCOPE; the coverage concept is lowercase.

### 1. Purpose

SCOPE takes a free-text biological hypothesis and helps a researcher determine two independent things:

1. **Is the hypothesis well-formed?** (structural/logical quality — testability, precision)
2. **What do we actually know about it?** (evidential grounding — what curated knowledge graphs support, contradict, or are silent on)

SCOPE does **not** attempt to resolve every hypothesis. Its core product principle is:

> **Bounded honesty:** the system answers only as much as it knows, states its coverage explicitly, and never lets a fast or confident-looking result imply more certainty than was actually established.

This principle is not a feature of one module — it is a cross-cutting constraint every module must satisfy (see §7).

### 2. Architectural Model: Hub-and-Spoke Workbench

SCOPE is **not** a linear pipeline. It is a shared-state hub with four independent, on-demand modules. A user may invoke any subset of modules, in any order, without waiting on the others.

```
                  [ Free-Text Input ]
                           │
                           ▼
           ┌───────────────────────────────┐
           │ CENTRAL HYPOTHESIS STATE HUB  │
           │ (Parsed Slot JSON Schema)     │
           └───────────────┬───────────────┘
                           │
    ┌──────────────────────┼──────────────────────┬──────────────────────┐
    ▼                      ▼                      ▼                      ▼
┌──────────────┐    ┌──────────────┐    ┌──────────────┐    ┌──────────────┐
│  MODULE A:   │    │  MODULE B:   │    │  MODULE C:   │    │  MODULE D:   │
│  Quality &   │    │  Literature  │    │  KG Evidence │    │  Dataset &   │
│  Syntax      │    │  Handoff     │    │  Path Finder │    │  Workspace   │
└──────────────┘    └──────────────┘    └──────────────┘    └──────────────┘
 (Real-time)         (Instant UI)        (Async Graph)       (On-demand)
```

**Design rule:** the hub is parsed exactly once per session. All four modules read from the same hub state and never re-parse independently. This prevents drift between modules interpreting the same hypothesis differently.

### 3. Core Data Model: Central Hypothesis State

The hub converts free text into a structured, versioned JSON object. This is the single source of truth for all modules.

```json
{
  "hypothesis_id": "uuid",
  "schema_version": "1.0",
  "raw_text": "string, original user input, never mutated",
  "parsed_at": "ISO-8601 timestamp",
  "slots": {
    "target": { "value": "string", "confidence": "high|medium|low", "resolved_id": "canonical ID or null" },
    "perturbation": { "value": "string", "confidence": "high|medium|low", "resolved_id": "canonical ID or null" },
    "outcome": { "value": "string", "confidence": "high|medium|low", "resolved_id": "canonical ID or null" },
    "modifiers": {
      "cell_line": { "value": "string|null", "confidence": "high|medium|low" },
      "genetic_background": { "value": "string|null", "confidence": "high|medium|low" },
      "dose_timepoint": { "value": "string|null", "confidence": "high|medium|low" },
      "tissue": { "value": "string|null", "confidence": "high|medium|low" },
      "comparator": { "value": "string|null", "confidence": "high|medium|low" }
    }
  },
  "parse_confidence_overall": "high|medium|low",
  "missing_required_slots": ["array of slot names, empty if none"],
  "hub_version": "integer, incremented on any user edit"
}
```

**Notes for implementation:**
- `modifiers` is an **open, extensible map** — new modifier types can be added without a schema migration breaking existing hypotheses. Do not hardcode a fixed triple; treat `target`/`perturbation`/`outcome` as required, everything else as optional and expandable.
- `resolved_id` fields are populated by entity linkage (Ensembl, MONDO, ChEMBL, etc.) and may be `null` if resolution failed — this is a valid, expected state, not an error.
- `hub_version` is the mechanism that powers staleness detection (§7.1). Every module output must record which `hub_version` it was computed against.

### 4. Module Specifications

#### Module A — Quality & Syntax Panel
**Execution:** synchronous, real-time, runs on every hub update.

| | |
|---|---|
| **Input** | Hub state |
| **Output** | Multi-axis rubric (Precision, Falsifiability — no scalar/composite score), completeness warnings, slot inspector view |
| **Key behaviors** | 1. **Slot Inspector toggle**: user can view and manually correct any parsed slot before it propagates downstream. 2. Any axis the system cannot confidently evaluate must render as **"unscored — insufficient basis"**, never a forced/default rating. 3. Runs instantly; never blocks on Modules B/C/D. |

#### Module B — Literature Launcher
**Execution:** synchronous, instant.

| | |
|---|---|
| **Input** | Hub state |
| **Output** | Editable Boolean query strings / prompts, deep links (PubMed, etc. — non-commercial sources only, see Changelog 2026-09-03) |
| **Key behaviors** | 1. Generated queries are **shown and editable** before the user clicks through — never a black box. 2. This module is an **isolated human-trust lane**. Its results are never written into the Evidence Matrix (Module C's output) and never assert findings on the system's behalf. It hands the user off to external tools and gets out of the way. |

#### Module C — KG Evidence & Path Explorer
**Execution:** asynchronous, background job, renders incrementally as data arrives.

| | |
|---|---|
| **Input** | Hub state (resolved slot IDs) |
| **Output** | Evidence Matrix: per hypothesis-element and per hop, one of `VERIFIED`, `REFUTED`, `CONFLICT`, `UNEXPLORED`; scope-bounded coverage metadata per KG queried |
| **Key behaviors** | 1. **Constrained LLM Query Planner**: LLM is used only to draft graph queries (Cypher/SPARQL), which are validated against canonical KG schemas before execution. LLM never generates evidentiary claims directly. 2. **Path Completeness** is reported as explicit per-hop state, never a collapsed ratio (e.g. not "2/3" — instead "hop 1: VERIFIED, hop 2: UNEXPLORED, hop 3: VERIFIED"). 3. **Coverage metadata is mandatory** on every result: `[KG name, version, scope, last updated]`. Absence must always read as "not found in [named, scoped source]," never as an unqualified "does not exist." 4. **UNEXPLORED vs. no-data-yet-loaded must be visually unambiguous** — see §7.2. 5. Evidence sourced here is the **only** input to what would become a Tier 1 evidence designation (see §6 — tiering itself is deferred, but this module's output is the only category eligible for it later). |

#### Module D — Dataset & Workspace Provisioner
**Execution:** on-demand, triggered explicitly by the user (evaluation → action transition).

| | |
|---|---|
| **Input** | Hub state + user-selected gap(s) from Module C |
| **Output** | MCP payload, one of two paths |
| **Key behaviors** | 1. **Path A (data exists, unlinked):** direct handles to existing GEO/SRA/etc. accessions. 2. **Path B (true absence — no data exists anywhere indexed):** protocol/pipeline template for generating new data. **Path B is not a lesser/deferred case — it is the more differentiating capability of this module and must not be scoped out in favor of only building Path A.** 3. Output is packaged for handoff to the DESIGN system's analytical workspace. |

### 5. Module Interaction Rules

- Modules **A, B, C, D read from the hub independently.** No module calls another module directly.
- Module C and D are the only modules with async/long-running execution. A and B must never be gated behind them.
- The **only mandatory sequencing** is: the hub must have completed its initial parse before any module can run. Beyond that, order is entirely user-driven.

### 6. Explicitly Out of Scope for v1 (deferred, not forgotten)

These were raised during design and intentionally excluded from this build. Do not implement speculatively; do not let them silently expand v1 scope.

| Item | Status | Note |
|---|---|---|
| Novelty / redundancy check (has this hypothesis been tested before?) | Excluded by product decision | Not a target feature. |
| Corroboration weighting within evidence (independent studies vs. shared root source) | Excluded by product decision | Not a target feature. |
| Tier 1 (curated) vs. Tier 2 (in-house/experimental) evidence separation | Deferred | Only becomes relevant once a bi-directional feedback loop exists. Build the tiering model **before** the first write-back ships if/when this is picked up — do not retrofit onto a matrix users already read as uniform. |
| Bi-directional feedback loop (DESIGN results writing back into SCOPE's evidence matrix) | Deferred | No feedback loop exists in this build. |
| Cross-KG relation-vocabulary conflict resolution (e.g. `inhibits` vs `downregulates` across KGs) | Not applicable per current KG set | The federated KGs in scope have non-overlapping domains, so cross-KG relation conflicts are not expected to occur in practice. See §8 for the related open item on entity linkage across domain boundaries. |
| DESIGN's "one schema for any hypothesis type" / paper-mining-to-hypotheses / semantic embedding matching against all CFDE datasets | Explicitly rejected as v1 premise | Assessed as overreaching given current data and unproven generalization. If pursued later, treat as a separate, narrow, empirically-validated extension — not a foundational assumption baked into SCOPE's schema. |

### 7. Cross-Cutting Requirements (apply to every module)

#### 7.1 Staleness / Session Model
- The hub increments `hub_version` on any user edit to a slot.
- When `hub_version` changes after a module has already rendered output, that module's panel must **raise a visible flag** to the user rather than silently continuing to display now-outdated results.
- **Default recommended behavior** (confirm with product before building): completed module panels are archived as read-only/labeled-stale rather than hard-deleted, and only modules affected by the changed slot are prompted for re-run. Full hard session reset is the simpler fallback if selective recompute proves complex — but this is a real trade-off (see §8, item 2) and should be a deliberate choice, not a default nobody decided.

#### 7.2 Loading vs. Empty-Result Ambiguity
- Every async module (primarily Module C) must expose an explicit state machine, not an implicit one:
  - `PENDING` (query in flight)
  - `COMPLETE_NO_RESULTS` (query finished, genuinely nothing found)
  - `COMPLETE_WITH_RESULTS`
- `PENDING` and `COMPLETE_NO_RESULTS` must be visually distinguishable at a glance (e.g. spinner/skeleton vs. an explicit "nothing found in [scope]" state). A user must never be able to mistake an in-flight query for a confirmed null result.
- `COMPLETE_NO_RESULTS` must render as a flat factual statement of absence, scoped to what was queried. It must **never** be reworded or interpreted (e.g. never rendered as "this appears novel" or similar). This is a hard rule for both UI copy and any LLM-generated summary text.

#### 7.3 Confidence Propagation
- Every module output must carry a reference to the `parse_confidence_overall` and `hub_version` it was computed against.
- If a downstream module (B, C, D) operates on a slot with `confidence: low`, that module's UI must visibly carry a "based on low-confidence extraction" flag rather than presenting its output as equally authoritative to a high-confidence run.

#### 7.4 Grounding Discipline (Module C specifically)
- No evidentiary claim may be presented without a resolvable, clickable source (KG edge ID, PMID, GEO accession, canonical entity ID).
- The LLM is permitted to *summarize* retrieved subgraphs but every sentence of that summary must be traceable back to a specific retrieved edge. Underlying edges should be shown alongside any LLM summary, not hidden behind it.

### 8. Open Decisions — Flagged for Resolution Before/During Build

These two items came up during design and were **not** resolved with a definitive answer. Do not let a default implementation choice silently settle them — raise back to product/architecture owner.

**1. Module C "CONFLICT" state — exact trigger condition.**
Given that the federated KGs in scope have non-overlapping domains (per product decision, §6), cross-KG relation conflicts are not expected. This raises the question: what does `CONFLICT` actually mean now?
- Is it intra-KG (two different source studies within the *same* KG asserting opposite relations for the same edge)?
- Is the state still needed at all in v1, or should it be removed until a concrete triggering scenario exists?
**Recommendation:** do not build a `CONFLICT` state handler speculatively. Confirm a real triggering scenario exists in the current KG set before implementing it; otherwise ship v1 with three states (`VERIFIED`, `REFUTED`, `UNEXPLORED`) and add `CONFLICT` later if a concrete case arises.

**2. Entity linkage across KG domain boundaries for multi-hop path stitching.**
"Non-overlapping domains" resolves the relation-vocabulary conflict problem, but a multi-hop hypothesis may still need to traverse a shared entity that sits at the boundary between two KGs (e.g. a gene node that is a hop-endpoint in KG-Oncology and a hop-start in KG-Pathways). This requires consistent entity ID resolution across KG boundaries even if the KGs never disagree on a relation.
**Needs an explicit answer before Module C's multi-hop traversal logic is built:** does SCOPE's current KG set ever require paths to cross KG boundaries at all? If yes, entity resolution across boundaries is required scope for Module C. If no (each hypothesis is fully answerable within a single KG's domain), this can be deferred.

### 9. Recommended Build Sequencing

1. **Hub + Module A** — parsing, extensible schema, slot inspector, rubric. No external dependencies; fastest path to a usable, testable core.
2. **Module C (core)** — start with a narrow KG scope (2–3 KGs where domain non-overlap is already confirmed), implement `VERIFIED`/`REFUTED`/`UNEXPLORED` first, resolve open decision #2 before building multi-hop traversal, defer `CONFLICT` per open decision #1.
3. **Module B** — low complexity, mostly UI/query-string generation; can be built in parallel with Module C at low risk.
4. **Module D** — build Path A (existing data handles) and Path B (generation protocol templates) as explicitly separate flows from the start; do not let Path B slip to "later" — it is the more differentiating capability.
5. **Cross-cutting staleness and confidence-propagation UI** (§7.1, §7.3) should be implemented alongside Module A/C, not retrofitted after — these are cheap to build in from the start and expensive to bolt on later.

### 10. Explicit Non-Goals (state to avoid scope creep)

- SCOPE does not generate novel scientific claims. It structures, scores, and checks a user-provided claim against existing curated knowledge.
- SCOPE does not judge fair use, novelty, or publishability.
- SCOPE does not perform its own literature text-mining or relation extraction from free text (Module B is deep-link handoff only).
- SCOPE does not attempt to support arbitrary hypothesis types beyond the gene/perturbation/outcome-and-modifiers domain in v1.

---

## Current implementation

| Path | Purpose | Status |
|------|---------|--------|
| `../revealScope.vue` | Shell: header, stage, welcome/session state | Header + welcome flow built; no hub yet |
| `revealScope/ScopeMenuBar.vue` | Session / Help top menus | Built |
| `revealScope/ScopeWelcomePanel.vue` | Welcome modal: Start SCOPE (hypothesis input + option cards) / Learn SCOPE tabs | Built |
| `revealScope/ScopeLiteratureLauncher.vue` | Module B v0 — literature search launcher | Built (see below) — not yet reading from the hub, since the hub doesn't exist |
| `revealScope/scopeLiteratureQuery.js` | LLM call: hypothesis text → concise search query JSON | Built |
| `revealScope/scopeLiteratureSources.js` | Per-source deep-link URL builders (PubMed only — no commercial sources, see Changelog) | Built |
| `revealScope/ScopeEvaluationPanel.vue` | Module A v0 — quality/syntax evaluation | Built (see below) — not yet reading from the hub, no editable Slot Inspector |
| `revealScope/scopeHypothesisEvaluation.js` | LLM call: hypothesis text → slots + rubric JSON | Built |
| `revealScope/ScopeActionsPanel.vue` | "Actions" — floating popup (CANVAS-assistant-style) with "Next steps" / "Actions" tabs | Built (see below) |
| `revealScope/scopeActionsCatalog.js` | Single source of truth for action id/label/description, used by both Actions tabs | Built |
| `revealScope/scopeSessionFile.js` | Session export/import: build, save (File System Access API or download fallback), and parse the session JSON file | Built |
| `revealScope/ScopeExportSessionModal.vue` | Export session filename prompt | Built |

**No Central Hypothesis State Hub exists yet.** Both `ScopeLiteratureLauncher` and `ScopeEvaluationPanel` currently take raw `hypothesisText` as a prop directly from the welcome panel's option cards — neither reads hub slots, carries `hub_version`/`parse_confidence_overall` (§7.3), or is staleness-aware (§7.1). This is a deliberate v0 shortcut, not the spec-conformant Module A/B; revisit both once the hub is built (§3) so they read from hub state like the spec requires.

**Module B v0 behavior:** on mount, calls an LLM (`scopeLiteratureQuery.js`, via `src/utils/llmClient.js`) to extract a concise search-term string from the hypothesis text, prefills one editable text box for PubMed (`scopeLiteratureSources.js`), and opens the built URL in a new browser tab on click. On LLM failure, silently falls back to the raw hypothesis text as the query (logged to console, no user-facing error). No results are captured or written back — once the tab opens, SCOPE's involvement ends, matching the spec's "isolated human-trust lane" rule (§4 Module B, §5).

**Module A v0 behavior:** on mount, calls an LLM (`scopeHypothesisEvaluation.js`) that both parses the hypothesis into slots and scores Precision/Falsifiability in one pass (a v0 shortcut — real Module A only scores, the hub only parses; here they're combined because there's no hub to parse first). Output shape mirrors §3's Central Hypothesis State (`target`/`perturbation`/`outcome`/`modifiers`, each `{value, confidence}`) so it's a drop-in once the hub exists. Any axis the model can't confidently score renders literally as "Unscored — insufficient basis" (never a forced/default rating, per §4 Module A behavior 2) — enforced structurally via a `scored: boolean` field, not left to prose. Missing required slots (`target`/`perturbation`/`outcome`) surface as an orange pill callout (DESIGN.md sub-header callout pattern). **Known gap:** the spec's Slot Inspector (§4 Module A behavior 1 — user can view *and manually correct* any parsed slot) is not implemented; slots currently render read-only. On total LLM failure, renders explicit unscored state with rationale "Evaluation could not be completed" rather than silently faking a result — no fallback-to-raw-text is possible here (unlike Module B) since evaluation *is* the LLM call.

**Actions panel behavior:** rule-based, not LLM-driven — deliberately much narrower than REVEAL KG Canvas's free-text "Canvas assistant" (~9,000 LOC, entirely reactive to typed requests; confirmed via code read before scoping this down). Rendered as a floating popup card (absolute-positioned bottom-right of `.rs-stage`, CANVAS-assistant-style: title + ✕ + pill tabs), not a docked sidebar — that was the first cut, replaced after user feedback. Two tabs share one catalog (`scopeActionsCatalog.js`, `{id, label, description}`): **Next steps** filters the catalog by `ranModules` (array of module ids already run) — whichever of `evaluate`/`literature` hasn't run, plus "Export session" always; **Actions** shows the full unfiltered catalog so any action can be re-run on demand. Modules C/D are not in the catalog since they don't exist. Clicking an action runs it directly — no plan/validate/execute pipeline, since these are shortcuts to actions already exposed elsewhere in the UI. The popup only appears once `hasGeneratedContent` is true, dismisses via ✕ (`actionsPopupDismissed`), and reappears on the next `runModule()` call (new suggestions available). It is also suppressed whenever the most recent Module A run flagged `missingRequiredSlots` (`hasMissingSlots`, read off `cachedEvaluation`) — don't nudge the user toward Search literature/Export session while the hypothesis itself is still flagged incomplete; the "Actions" top menu and `ScopeEvaluationPanel`'s Edit button remain available to fix it. Also reachable directly from the **Actions** top-menu (`ScopeMenuBar.vue`, between Session and Help) — same catalog, same dispatch (`onRunSuggestedAction`), independent of the popup's dismissed/hidden state, so an action is never unreachable just because the popup is closed or suppressed.

**Session export/import (v0):** `scopeSessionFile.js` defines a `scope-session-v0` JSON shape (`hypothesis_text`, `modules_run`, `evaluation`, `literature_query`) hand-assembled from state the shell caches (`cachedEvaluation` from `ScopeEvaluationPanel`'s `@evaluated`, `cachedLiteratureQuery` from `ScopeLiteratureLauncher`'s `@query-change`) — not read from a hub, since none exists. Export opens `ScopeExportSessionModal` for a filename, then `saveSessionFile()`: uses the File System Access API's native "Save As" dialog when available (Chromium — lets the user pick name *and* folder), otherwise falls back to a plain browser download under the given filename (Firefox/Safari have no web API for folder choice). Import restores hypothesis text, `ranModules`, and the cached module outputs, and reopens the last-run module **without re-calling the LLM** (`preloadedEvaluation` / `preloadedQuery` props, cleared via `$nextTick` after one use so a later manual re-run still calls the LLM fresh). If the imported file has no modules run, it reopens the welcome panel on Start with the hypothesis prefilled instead. This schema will very likely need to change shape once the real hub (§3) exists; treat `scope-session-v0` as disposable, not a contract to preserve.

The next implementation step is still the Central Hypothesis State Hub (§3), per the recommended build sequencing (§9) — Modules A and B, and now Actions/session export-import, were pulled forward ahead of sequence at explicit user request.

---

## Registration in the portal

`revealScope.vue` is registered in `ResearchSectionComponents.vue` as `reveal-scope`. Portal section JSON uses `"component": "revealScope"`.

---

## Related documents

| Document | Audience |
|----------|----------|
| [`DESIGN.md`](./DESIGN.md) | Contributors — UI rules, product/session conventions, checklist |
| `Documents/GitHub/DESIGN.md` | Cross-project baseline UI rules (borders, minimum font size) |
| `../revealKgWorkspace/ARCHITECTURE.md` | Sibling REVEAL product (KG Canvas) — reference for hub/session-style architecture docs |

---

## Changelog

Record every architecture-affecting decision here — new module behavior, schema changes, resolved open decisions (§8), or sequencing changes — so a coding agent picking up this project has full context without needing prior chat history.

| Date | Note |
|------|------|
| 2026-09-03 | Initial architecture doc: v1.0 spec approved for development (2 open decisions flagged, §8) recorded verbatim; scaffold shell (`revealScope.vue`) registered in portal; no hub/module code yet |
| 2026-09-03 | Header built: `ScopeMenuBar.vue` (Session: Reset/Import/Export session; Help: Learn SCOPE/Documentation), visual tokens borrowed from REVEAL KG Canvas |
| 2026-09-03 | Welcome flow built: `ScopeWelcomePanel.vue` opens on mount and on Session→Reset / Help→Learn SCOPE; not dismissible by backdrop/Escape/✕ until an option has actually run (`hasGeneratedContent`, tracked in `revealScope.vue`) |
| 2026-09-03 | Module B pulled forward out of build order (§9) at explicit user request: `ScopeLiteratureLauncher.vue` built as a v0 — takes raw hypothesis text directly (no hub), LLM-extracts a search query (`scopeLiteratureQuery.js`), opens PubMed/Scite/Elicit deep links in new tabs (`scopeLiteratureSources.js`). Must be revisited to read from the hub once §3 is built |
| 2026-09-03 | Product decision: SCOPE cannot include commercial products. Removed Scite and Elicit from Module B — `scopeLiteratureSources.js` now lists PubMed only. §4 Module B's output row and this doc's "Current implementation" section updated to reflect non-commercial-only sources; any future literature source must be checked against this constraint before being added |
| 2026-09-03 | Fixed PubMed "processed without automatic term mapping, zero results" failure: `scopeLiteratureQuery.js` was asking the LLM for one free-text phrase, which PubMed's ATM couldn't resolve as a whole. Now asks for 2-5 discrete concept terms and joins them with `AND` so each term maps independently |
| 2026-09-03 | Module A pulled forward out of build order (§9) at explicit user request: `ScopeEvaluationPanel.vue` + `scopeHypothesisEvaluation.js` built as a v0 — one LLM call both parses the hypothesis into §3-shaped slots and scores Precision/Falsifiability (unscored is structural, `scored: boolean`, never a forced rating). Deliberately declined the reviewed multi-entity `value: string[]` proposal — kept `value: string` (comma-join multiple entities) to stay compatible with the approved §3 schema; array support is a separate open decision to raise later, not something to fold in silently. Known gap: editable Slot Inspector (§4 Module A behavior 1) not implemented, slots are read-only |
| 2026-09-03 | `ScopeEvaluationPanel.vue`: added a Hypothesis card (raw text + Edit button) above the rubric so the evaluated text stays visible. Edit re-opens `ScopeWelcomePanel` on the Start tab with the hypothesis prefilled (new `initialHypothesisText` prop, synced on open) so the user edits and re-runs rather than retyping from scratch |
| 2026-09-03 | Tightened `scopeLiteratureQuery.js` system prompt after external review: exclude comparator/control-group terms (e.g. scrambled shRNA, vehicle) and directional/methodology verbs (reduces, knockdown) from extracted terms, normalize to base entity names. Kept the flat terms-array shape rather than moving to per-category (targets/context/outcomes) slot extraction — PubMed is the only destination right now, and full slot extraction is properly the hub's job (§3) once it exists, not something Module B should duplicate ahead of it |
| 2026-09-03 | Built "Actions" (`ScopeActionsPanel.vue`) — deliberately scoped down from REVEAL KG Canvas's free-text assistant pattern after confirming via code read that pattern is ~9,000 LOC and 100% reactive to typed requests, with no "suggest next" concept to reuse. SCOPE's version is rule-based (no LLM), computed from `ranModules`, rendered as a persistent docked panel next to whatever module is active. Also implemented real Session→Export/Import (previously stubbed to console.log): `scopeSessionFile.js` defines a `scope-session-v0` JSON shape; export downloads a file, import restores hypothesis text + cached module outputs and re-shows the last-run module without re-calling the LLM. This schema has no hub backing it yet and should be expected to change once §3 lands |
| 2026-09-03 | Reworked "Actions" from a docked sidebar into a floating popup card matching REVEAL KG Canvas's assistant popup shape (title + ✕ + pill tabs), per direct user feedback that it should look like that, not a full-height panel. Added a second tab, "Actions" (full unfiltered catalog) alongside "Next steps" (filtered), both reading from a new shared `scopeActionsCatalog.js`. Each action button now shows a one-sentence description under its label (16px bold label / 13px normal description), solid orange background with white text. Export session no longer downloads immediately — it opens `ScopeExportSessionModal.vue` for a filename first; `saveSessionFile()` uses the File System Access API's native Save-As dialog where supported (lets the user also choose the folder) and falls back to a plain download elsewhere |
| 2026-09-03 | Fixed Module A over-eager slot filling, found via a user test case ("Mitochondrial dysfunction is involved in liver cell damage under high-sugar conditions" — expected `target`/`perturbation` null, got `target: "mitochondria"`, `perturbation: "high-sugar conditions"`, both "High" confidence, precision "Medium"). Root cause: the target/perturbation definitions were too loose — "pathway" let an organelle qualify as target, "exposure" let an environmental condition qualify as perturbation. Tightened `scopeHypothesisEvaluation.js`'s prompt: target must be a specific named gene/protein/pathway (organelles/tissues/generic processes don't count); perturbation must be a deliberate manipulation (environmental/dietary/dose conditions belong in `modifiers.dose_timepoint` instead, not perturbation); added rules tying a null target/perturbation to a capped precision rating, flagging correlative phrasing ("is involved in") as non-falsifiable, and requiring "high" confidence be reserved for values stated directly in the text rather than inferred/generalized ones |
| 2026-09-03 | Actions popup now suppressed whenever the latest evaluation has `missingRequiredSlots` (`hasMissingSlots` computed off `cachedEvaluation` in `revealScope.vue`) — don't suggest Search literature/Export session while the hypothesis is flagged incomplete. Added an **Actions** top-menu (`ScopeMenuBar.vue`, between Session and Help) built from the same `scopeActionsCatalog.js`, dispatching through the same `onRunSuggestedAction` — so every action stays reachable from the menu even when the popup is dismissed or suppressed |
