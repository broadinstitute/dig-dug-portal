# Cell State Browser check-in — punchlist

From the 2026-10-02 call (Alex, Julie, Noel, + a fourth participant). **Note on attribution:** the
transcript's speaker labels are unreliable — Julie addresses "Jason" twice on lines labelled
`Noel Burtt`, and one line has Noel telling himself to pick a name. Items below are therefore mostly
unattributed; check the transcript before quoting anyone.

Context: MSKKP release was planned for Monday, now proposed **Wednesday** (Julie confirming). ASBMR is
next week. Overall direction was endorsed — "I love the vision… it lands better in terms of the
structure."

> **Update 2026-10-05 — see `BACKEND_UPDATES_2026-10-05.md`.** A new endpoint,
> `gene-program-nmf-liger-report`, supplies the QC rule this list was blocked on: **1.4 and 1.5 are
> unblocked**, and questions 3.3 and 3.5 are answered. Two other answers landed too:
> `gene-program-gene-set-factor` does have data (my earlier "it's empty" finding was a testing error),
> and `gene-program-cell-state-metadata-extended` does **not** cover all 12 tissues, which is a new
> constraint on the cell state row design.

---

## 1. Front end

### 1.1 Rename the browser
"Cell Evolution Browser" is the internal name. Needs a public-facing name from Noel/Julie.
**Blocked on them.**

### 1.2 Remove expression + specificity from the gene program rows
Either both lists show them or neither does — currently only programs do. The decision was to
**remove them from programs too**, because that data is far less validated than the structure:
"the expression's basically the same across all gene programs… we have not looked at that carefully
enough. I'd [not] want that to be the first thing people see."

- The canvas should foreground **which programs the gene is in, and which cell states those lead to**.
- Expression/specificity move **below**, annotated as *experimental*.
- ⚠️ This reverses recent work: the program rows just gained `EXP` / `SPEC` column headings with
  explanatory tooltips, and state rows just had their bar/expression/specificity replaced by the lede.
  Worth confirming before I pull them, since the tooltips are also where the axis ceiling is stated.

### 1.3 Gene loading stays the gene → program measure
Confirmed as the right association for the left-hand links. (Units are an open question — see 3.4.)

### 1.4 Stop graying rows by p-value; gray/flag by QC instead — **PARTLY, THEN SUPERSEDED**
Currently grayed rows are non-significant p-values, and nobody on the call could say what that p-value
tests. The graying *effect* was praised — "the graying out is very effective, and both of the ones you
grayed out were clearly contamination" — but the **input should be a QC rule**, not a p-value.

**UNBLOCKED 2026-10-05.** `gene-program-nmf-liger-report` supplies `overall_verdict`
(`high_confidence` / flagged) per factor. Filter on that, **not** on any individual status — two of
its six checks are explicitly informational-only. Details and traps in
`BACKEND_UPDATES_2026-10-05.md` §1.

**Where it landed:** the p-value no longer grays anything — that half holds. But the QC verdict does
not gray anything either. Dimming now means one thing across both lists, *"this is what the filter
would remove"*: no gene loading for a program, no significant association for a state. The QC verdict
is reported as a pill on the program row and in full in the Factor QC tab, and acts on nothing, since
3.11–3.13 are open. Revisit after Kyle answers.

### 1.5 Hide QC-failing programs by default, with a "show all" checkbox — **IMPLEMENTED**
Rather than graying them in place. Default = hidden; a checkbox restores them. Same pattern as the
existing significance filter.

Built as `showFlaggedPrograms` with a `Show QC-flagged programs` checkbox in the canvas legend, beside
the edge significance filter. Filtering happens at the `programItems` computed, not in the template,
so the edges, canvas height, row anchors and counts all stay consistent — and `buildEdges()` already
drops any edge whose endpoint is off-canvas, so a hidden program's edges disappear with it.

Decisions worth knowing before changing this:

- **A program with no report row is shown, never dimmed.** `qcFlagged` is three-state
  (`true`/`false`/`null`); 7 of 169 scopes return no report at all, and only `=== true` hides.
- **The report fetch is the one of the three that is allowed to fail silently.** It hides rows, so
  losing it must degrade to "no filtering", not to an empty canvas.
- Selecting a flagged program by deep link turns the filter off rather than opening a card for a row
  that is not on the canvas (`revealFlaggedProgram()`).
- If *every* program in a scope is flagged, the body shows an `all-flagged` placeholder with its own
  "Show flagged programs" button — the legend that normally carries that control lives on the canvas,
  and in that state there is no canvas.

**UNBLOCKED 2026-10-05, and now sized against the full data** rather than a 12-factor sample:
**355 of 2296 factor rows are flagged, 15.5%**, ranging from 8% (muscle) to 35% (bonemarrow). Default
-hidden is viable. `n_flags` never exceeds 2, so the reason display never shows more than two codes.
Surface the *reason* too — `flags` plus the per-check evidence is far more useful than a hidden row.

⚠️ **Caveat before this ships:** 36% of all flag codes come from technical covariates `X` and `Y`,
whose meaning is unknown and whose two plausible readings (sex chromosomes, or embedding coordinates)
both make the flag inappropriate. See `BACKEND_UPDATES_2026-10-05.md` §1.4. Parse `flags` into
structured codes rather than treating `overall_verdict` as opaque, so excluding a code class later is
a filter change and not a rewrite.

### 1.6 Hide programs the gene has no loading for, by default
This was the main point of confusion, hit independently by two reviewers: searching a gene still lists
every program for the cell type, so "why is it showing that only 4 of these programs are connected to
the gene?"

- Default to **only programs with a gene loading**, plus a `show all programs` checkbox.
- An alternative was floated — subheaders splitting "programs PNPLA3 is active in" from "not active
  in" — but the checkbox was preferred.
- Either way, **label the list explicitly** (e.g. "gene programs in hepatocyte — includes all") so the
  full-set default is never a surprise.
- Also worth noting from the call: it was not obvious that the program list is *every* program Liger
  produced for that cell type. That needs stating in the UI.

### 1.7 Carry the filtering through to cell states — **IMPLEMENTED**
With programs hidden, hide **states that are not connected to any shown program**. Otherwise states
dangle off invisible programs. Confirmed as desirable ("it would simplify the UI… you're just looking
at the things that are relevant to your query") and cheap to implement.

### 1.8 Bring back a trait heat map
Biologists read heat maps fluently, and the genetics link is "the cool sauce" while trait associations
are currently "a little buried" inside the per-entity tabs. The specific view wanted is the
**human-phenotype × gene-program** matrix from the first version.

Placement — this was worked out in some detail:

- **Merge it into the top (canvas) card as an alternate view**, not a new card below it.
- Toggling swaps the gene program and cell state panels for **side-by-side heat maps**.
- Rationale: the top card is the global view and already owns the QC + gene filtering, so a separate
  card would have to duplicate that logic and it would be unclear whether it was gene-scoped.
- Selecting a program or state in *either* view still drives the detail card below.

⚠️ **Explicitly caveated on data quality.** The trait matrices "may not be high enough [quality] at
this point [that] you want to highlight" — generated at 2am before a grant deadline and never
validated. The call landed on **holding off on the trait heat map for now**, with the distinction
drawn between "what you put up and what you highlight." Treat as post-release unless Kyle validates.

### 1.9 Move "Source data" out of the metadata card
It is provenance, not part of the inspect-a-program/state workflow — "it just detracts from the
workflow." But it must stay surfaced, since wanting to know where the data came from was one of the
biggest complaints previously.

Options discussed:
- a fourth standalone card at the bottom, or
- a compact source dropdown next to the tissue selector.

Freeing that tab slot also leaves room for three tabs: **programs / states / trait heat map**.

### 1.10 Flow: tissue → cell type → gene (deferred)
Reviewers expected to pick tissue and cell type *first*. Blocked: there is no API giving tissues and
cell types independent of a gene (see 2.1). Interim decision: **keep gene-first for this release** —
"it's an easy update once we do have it."

Caveat raised: not every gene has data for every tissue/cell type, so a tissue-first flow can
legitimately return nothing. That needs to be acceptable before switching.

---

## 2. Backend / data requests

### 2.1 An API listing all tissues and cell types, gene-independent
Required for the tissue-first flow in 1.10. Currently the tissue list is derived from the gene-level
expression responses, so nothing exists before a gene is chosen.

### 2.2 Interim: a gene present in every cell type
Suggested as a hack for the release — have Patrick find a gene that appears in every cell type and
hard-code it as the seed query to populate the dropdowns.

### 2.3 A QC flag or rule the front end can apply — **DELIVERED 2026-10-05**
"There would need to be a rule that we would define that should become an urgent order of business to
work through with Kyle to come up with a flag or rule that you apply on the front end, and that's what
you should use to either gray out or to have, like, a warn/fail." Blocks 1.4 and 1.5.

### 2.4 Confirm the QC signature data in the API is Kyle's current set — **likely superseded**

The factor report is dated 2026-09-27 and is the rule to use, so the older question of whether the
blacklist signatures are Kyle-approved matters less: `blacklist_status` is informational-only and must
not drive filtering either way. Still worth a one-line confirmation.

Unclear whether what's being served is Kyle's improved version or the older set he disliked: "I don't
know if this is the old stuff that Kyle didn't like, or whether it's the new stuff that Kyle likes. We
need to make sure that it's what Kyle likes."

### 2.5 Clarify Patrick's additional API
Patrick mentioned another API with further data from Kyle, landing Monday. Scope unknown.

### 2.6 Gene loadings in read-count units
Current loadings are "like in the unit of read counts, but there's a free parameter that scales them,"
and how Kyle ran it isn't known. Eventually these should be in read-count units so they align with the
UMAP plot in the Single Cell Browser.

### 2.7 Verify MSKKP serves the same data/bioindex as CMDKP
Believed yes — MSKKP runs on the main portal stack, not a CFDE portal, and the same content appears in
the A2F KP — but "we'd have to verify that." Bone tissue is already present in the browser, which is
consistent. If it holds, the MSKKP work is just pulling latest from master and adding a link.

---

## 3. Open questions — need answers before acting

| # | Question | Who |
|---|---|---|
| 3.1 | **What does the p-value on program/state rows actually test?** Asked twice on the call, unanswered. **Still open** — the factor report removes the *need* for it in the graying logic, but not the question of what it means wherever it is still displayed. | Patrick / Kyle |
| 3.2 | **What is the public-facing name?** Blocks 1.1. | Noel / Julie |
| 3.3 | ~~Which QC signature or metric drives filtering, and what is the rule?~~ **ANSWERED** — `overall_verdict` from `gene-program-nmf-liger-report`. One follow-up remains: the exact enum strings for the flagged side have not been observed. | — |
| 3.4 | **What exactly are the gene loadings, and what is the scaling parameter?** Blocks any attempt to label the units honestly. | Kyle |
| 3.5 | ~~Is the QC data currently served Kyle-approved?~~ **Largely moot** — see 2.4. | — |
| 3.6 | **Should the trait heat map cover cell states as well as programs?** Left unresolved — the side-by-side layout implies both, but it was also framed as phenotypes × programs. | Noel / Julie |
| 3.7 | **Are the trait matrices validated enough to show at all?** Currently self-flagged as unvalidated. Decides whether 1.8 is in this release or later. | Kyle / Noel |
| 3.8 | **Is an empty result acceptable for a tissue-first flow?** Since not every gene has data in every tissue/cell type. Blocks 1.10. | Noel / Julie |
| 3.9 | **Which tissues lack `cell-state-metadata-extended`?** The answer was "not all 12" without a list. Decides how many cell state rows lose their lede and how bad the fallback looks. | Patrick |
| 3.10 | **How does `factor_quality` relate to `overall_verdict`?** Two quality signals on the same object from different endpoints. Orthogonal or redundant? | Patrick / Kyle |
| 3.14 | **`gene-program-gene-set-factor` is liver-only — is that intended, and is the rest coming?** Measured across all 161 scopes: 10 with gene sets, all liver; 151 without, covering the other eleven tissues entirely. The Gene sets tab is therefore empty for 94% of scopes. | Patrick |
| 3.11 | **What are technical covariates `X` and `Y`?** They cause 36% of all flags. Sex chromosomes and embedding coordinates are both plausible, and under either reading the flag is wrong. Decides whether the 1.5 default hides 15.5% or ~9%. **Monday agenda.** | Kyle |
| 3.12 | **Should `Trait_*` and `age`/`BMI` covariates flag at all?** 51 flags come from biological covariates — a program flagged for correlating with diabetes duration may be the signal, not an artifact. | Kyle |
| 3.13 | **Why does the contamination check not run on 222 rows?** `contamination_status`/`blacklist_status` are `unknown` there, yet 200 of them are reported `high_confidence`. | Patrick / Kyle |

---

## 4. Logistics

- MSKKP push moved from Monday to **Wednesday** (Julie confirming); the schedule was set early
  deliberately, so there is slack.
- Patrick has backend updates landing **Monday**; Kyle's feedback also hoped for Monday. That leaves
  Tuesday for front-end changes.
- **ASBMR** is next week — the MSKKP browser is the dependency.
- **ASHG** is not achievable for properly vetted data: "it's definitely not doable for ASHG."
- Kyle did not attend; the QC questions (3.3, 3.4, 3.5) are the agenda for Monday.

---

## 5. Suggested sequencing

**Revised 2026-10-05**, now that the QC rule has landed.

**Do first** — one API call gates the two highest-value items: fetch a scope whose factors are
*flagged* and record the real enum values (`BACKEND_UPDATES_2026-10-05.md` §1.4). `liver,schwann_cell`
is all-clean, so it cannot tell us what a flagged row looks like, and the filter must not be written
against guessed strings.

**Done 2026-10-05:** the enum sweep, then 1.4, 1.2, 1.6 and 1.7.

Note that **1.5 was reversed by decision.** The QC verdict hides nothing: it is shown on the program
row and in the Factor QC tab and that is all, because what `X` / `Y` and the trait covariates mean is
still open (3.11, 3.12). Hiding is done by gene loading (1.6) instead. It still drives the row
graying, which is 1.4.

**Remaining, all unblocked:**
1.9 (move source data out of the metadata card), graceful degradation for tissues without
`cell-state-metadata-extended`, the "experimental" annotation 1.2 asked for on expression/specificity
where they survive, and 1.1 (rename, once a name exists).

**Also now needed:** graceful degradation for cell states in tissues without
`cell-state-metadata-extended` (see 2.1 of the backend-updates doc). Not on the original punchlist,
but it affects the state rows that were just redesigned around the lede.

**Still post-release:** 1.8 (trait heat map — data validation), 1.10 (tissue-first flow — needs the
gene-independent API), 2.6 (loading units).
