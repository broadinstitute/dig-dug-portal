# LIGER v2 — Cell State Browser

> The public name is **Cell State Browser**. The component, the folder and this file keep the
> internal working name *Cell Evolution Browser*; renaming them is import churn with no user-visible
> effect, so the two are deliberately allowed to differ. `pageTitle` is what a reader sees.

A fresh interface over the same LIGER endpoints as `v1`. **This is the version mounted on the LIGER
page** (`src/views/LIGER/main.js` → `src/views/LIGER/Template.vue`).

## Shape

Page header, then **one card**: a scope band across the top and a canvas body below it.

```
┌─ header ── title / subtitle / AI note ──── figure + docs link ─┐
└────────────────────────────────────────────────────────────────┘
┌─ card ─────────────────────────────────────────────────────────┐
│  Gene [search ▾]  │  Tissue [▾]  │  Cell type [▾]              │  <- scope band
├────────────────────────────────────────────────────────────────┤
│  PPARG in adipose adipocytes                       [legend]    │  <- fixed heading
│  24 gene programs · 9 cell states                              │
│         ┌─ Gene programs  24 ┐      ┌─ Cell states      9 ┐    │
│         │ what a program is  │      │ what a state is     │    │
│         │            EXP SPEC│      └─────────────────────┘    │
│  ┌────┐ │ ▲ Program label    │══════│▌Mature identity     │    │
│  │GENE│─│   ====---- 1.54 .90│╲╱────│▌ beta cells with…   │    │  <- infinite canvas
│  └────┘ │ ▼ Another program  │──────│▌Stressed            │    │
│         │   ==------ 0.21 -.3│      │▌ UPR-high, ER str…  │    │
│         └────────────────────┘      └─────────────────────┘    │
└────────────────────────────────────────────────────────────────┘
```

The band is the whole of the interface's chrome, which is what frees the body to be spatial instead of
a stack of sections.

### The band carries no status line

There used to be one under each of the three selectors: `Showing PPARG`, the option count, and the
selected cell type's expression reading. All three are gone, and it is worth knowing why, because each
was a different mistake.

- `Showing PPARG` **restated the value already in the control above it**, and again in the canvas
  heading beside it.
- `N available` was a count of a list the reader is about to open.
- The cell type's expression reading was the only real information there — so it moved to
  *Source data*, where it sits next to the other fourteen readings it is worth comparing against
  (see below). A number inside a dropdown you have to hold open cannot be compared with anything.

What is left renders **only when it has something to say**, so nothing reserves band height to hold a
blank row: an error in any of the three, and the example genes before a gene is chosen. Errors stay
because they are the one thing nothing else on the page will mention. The example genes stay because
they are a control rather than a status, and `exampleGenes` has no other rendering point. The canvas is the infographic's left-to-right chain: **Gene → Programs → Cell
states**.

## The gene → program links

One line per program, width from **the searched gene's loading in that program**. Neutral color: the
quantity is the width, and the target is identified by the row the line lands on.

A loading is not a p-value, so there is no −log₁₀ here. Loadings run 0 to ~58 with most values near
zero, scaled to the strongest on screen with a floor (`GENE_LINK_CEILING_FLOOR`), and the legend
states the ceiling. A program with **no reported loading** for the gene gets no line and is counted
instead — a hairline would assert "barely loads here" where the fact is "not reported". A loading of
**exactly 0 does get a line**, at minimum width: that is a measurement, and the one case where the
thinnest line is honest.

### The cost, and why it is shaped this way

**There is no gene-keyed loading index.** `gene-program-gene-factor` is keyed
`dataset,cell_type,model,factor`, so the only route to the gene's loading in every program is to ask
every program — **one request per program**, each returning that program's full gene list (~4,900 rows
for one islet beta program). Twenty-five programs is ~120,000 rows downloaded to extract 25 numbers.

This is the expensive thing in the component. Four things keep it acceptable:

1. **Concurrency is capped** at `GENE_LOADING_CONCURRENCY` (4), bounding sockets and bandwidth rather
   than latency.
2. **Only the one gene's value is kept.** Rows are discarded as each response lands. Full rows are
   cached only for a program the reader actually opens, by `loadProgramDetail()`.
3. **It is not awaited.** `selectCellType` fires it and moves on; the canvas is usable without it and
   the lines appear progressively as values arrive. The legend reports how many programs are still
   outstanding, so a half-filled fan does not look like a finished picture with lines missing.
4. **`geneLoadingRun` invalidates it.** Changing cell type bumps the counter, and in-flight responses
   for the old scope check it before writing — otherwise a slow fan-out would draw the previous cell
   type's lines onto the new one.

Until anything resolves, the single unweighted structural curve is drawn instead, and it stays as the
fallback if nothing resolves at all — the gene still has to look connected to its programs. That curve
is safe to draw unweighted precisely because it carries no measurement.

**If a gene-keyed loading index ever appears, `loadGeneLoadings()` collapses into one request.**

### The fan-out reports absent and failed separately

`absent` is the API saying the gene is not in that program's loading index. `failed` is the request
not coming back. **They must not be collapsed into one "missing" count.**

The reason is a bug that shipped: `geneLoadingFromRows()` called `numericField()` without importing
it, so every program threw a `ReferenceError`, the worker's `catch` swallowed it, and the legend read
`10 with no loading reported for this gene` — which is exactly what real missing data looks like. The
detail panel found the same gene in the same rows from the same URL, because `ProgramInfo` does import
`numericField`. A silent catch over a whole fan-out turns any error into plausible-looking absence.

Failures now increment their own counter, render in red, and log to the console with the program id.

### Line colors are literals, on purpose

`GENE_LINK_COLOR` / `STRUCTURAL_LINK_COLOR` / `MUTED_LINK_COLOR` are hex constants bound through
computeds, **not** `var(--ce-ink)` in the attribute. A `var()` reference inside an SVG *presentation
attribute* (`stroke="var(--ce-ink)"`) is not dependable — the gene links shipped invisible that way
while the program/state edges, which bind concrete hex values, drew correctly, and that stroke was the
only material difference between them. The two legend thickness swatches had the same bug.

If these ever need to follow a theme, bind them through a computed that returns a real color. Do not
put `var()` back into an SVG attribute.

## The program → state edges

Every line between the two lists is one `gene-program-heatmap` row. **Both channels encode data:**

| Channel | Meaning |
|---|---|
| Thickness | −log₁₀ of the selected GSEA metric, scaled to the strongest association on screen |
| Color | The **target cell state**, matching the swatch at the head of its row — the list is the legend |
| Dashed | The value is above the width ceiling, so the thickness is clamped |

`gene-program-heatmap` returns exactly eight fields, and **GSEA P and q are the only metrics in them**
— no correlation, no NES, no combined match score, no cell/donor Spearman. v1 once drew a column for
every one of those and each read a field no row carries. Do not widen the metric choice past these two.

### What is deliberately not drawn

- **Associations with no p-value.** `gsea_p` / `gsea_q` are null on a large fraction of rows (190 of
  450 for islet beta). A hairline would assert "no association" where the fact is "not reported", so
  those rows are dropped and **counted in the legend** instead.
- **QC signatures.** `state_name` mixes curated states with `qc_*` signatures and no field on the row
  separates them — 36 against 6 real states for vat/adipocyte. `isQcStateRow()` tries three tests in
  order of trustworthiness:
  1. `state_type === "qc_state"`, for if the index ever sends it. **It does not today** — filtering on
     it is the bug that shipped once, because no row carries the field, so the filter passed
     everything and QC signatures were presented as curated matches.
  2. The **QC signature dictionary** from `gene-program-qc-metadata-extended`, whose
     `qc_signature_id` values are exactly these `state_name`s. This is the authoritative test and the
     reason the dictionary is now fetched alongside the heatmap rather than on program selection.
  3. The `qc_` name prefix. Kept as a **fallback, not replaced** — the heatmap can resolve before the
     dictionary does, and a filter that silently stops filtering is worse than a crude one. A QC
     signature not named `qc_*` would slip past this, which is what test 2 is for.
- **Edges to rows that are not on the canvas.** The heatmap is scoped to the cell type, not to the
  gene, so it reports programs and states this gene's expression rows do not include. An edge is kept
  only when both endpoints are drawn.
- **Below-threshold associations**, while `GSEA P < 0.05 only` is checked — the default. This is the
  same rule v1 uses for its linked filtering, so the two versions cannot disagree about what a match
  is. Unchecking it shows everything reported.

Every one of those exclusions is reported in the legend. A reader should never have to wonder whether
a missing line means "no association" or "not measured".

### When the fan comes out empty, the canvas says why

`edgeEmptyNotice` puts the reason in the canvas heading, not only in the legend — **the legend opens
collapsed**, so an empty fan with its explanation behind a click reads as a broken view rather than as
a filter doing its job.

**Switching the metric to `GSEA q` is the case that found this.** The same `< 0.05` threshold is
applied to whichever metric is selected, and far fewer associations survive FDR correction than
survive a raw p-value, so selecting q can legitimately empty the picture. Nothing said so.

The notice keeps the two reasons apart for the same reason the legend does: *above the threshold* is a
filter the reader can undo, and it says so; *not reported* is not, and points at the other metric
instead. If the empty q view turns out to be `No GSEA q is reported…` rather than
`N reported above the threshold`, the cause is a different one — `gseaQValue()` reading a field the
heatmap does not carry — and the fix is in `../ligerApi.js`, not here.

### The legend

One box, **`Association scores`**, holding both width scales. **Collapsible, and collapsed on load** —
it is a key rather than a control, and it sits over the top of the cell-state list, so the first thing
a reader gets is the picture. The heading is what survives collapsing, so the scales are where the box
was rather than somewhere to be discovered.

Its header is tinted `--ce-sunken`, the same band as the list panels' own headers, so the two read as
the same kind of thing. The whole header row is the hit target, not the chevron: a reader aiming at a
small glyph on a pannable canvas misses and pans. The chevron is **one drawn path, rotated** — the
`▾`/`▴` glyph pair is not the same size in every font, so the arrow changed weight as it flipped.

Each half is *name → unit → scale → what is not drawn*:

```
PPARG → program (24)          Program → state (37)
Gene loading                  Enrichment (−log₁₀)  [GSEA P ▾]
0 ◅──────────────▸ 12.4       1.3 ◅──────────────▸ 8.2
24 with no loading reported   ☑ GSEA P < 0.05 only
                              190 with no GSEA P reported
```

Three things there are deliberate:

- **Both ends of each scale are numbers, not the words `weak`/`strong`.** The gene scale starts at a
  true 0, but the edge scale starts at −log₁₀(0.05) = 1.3, so the thinnest line on screen is a real
  score rather than nothing — `EDGE_MIN_SCORE` is exported from `relationships.js` for exactly this.
  Both tops move with the data, which is the property that makes relative scaling honest.
- **The metric selector sits on the unit line.** It *is* the unit, so naming the encoding and choosing
  it are one thought rather than two rows.
- **The swatch is a wedge from `MIN_WIDTH` to `MAX_WIDTH`**, stretched with
  `preserveAspectRatio="none"` — the width ramp itself rather than two sample strokes, and widening
  the legend widens the ramp. Note percentages are not legal in an SVG path `d`; this is a `polygon`
  in a `viewBox` for that reason.

### Readability

A bipartite fan is a hairball by default: ~25 programs × ~9 states is up to a couple of hundred lines.
Three things carry the load, and removing any of them makes the picture unreadable rather than merely
plainer:

1. **Significant-only by default**, so the resting state is the subset worth looking at.
2. **Three opacity levels.** At rest every edge is faint (0.3) so a few hundred read as texture rather
   than a wall. Hovering a row lifts its edges to 0.95 and pushes the rest to 0.05.
3. **Reciprocal row dimming.** Hovering a program dims every state it does not match, and vice versa.
   That answers "what does this row connect to" without tracing a line.

### The lines are hoverable

Each line gets a second, invisible path in a `.hit-layer` group over the drawn ones, reusing the same
`d` — so it costs one element per line and **no extra geometry**. A drawn edge is 2–11 *world* pixels,
which is 1–8 on screen at a fitted zoom; `EDGE_HIT_WIDTH` (16 world px) is the floor on the hit
stroke. The floor is not scaled up for strong edges — those are already easy to hit.

Three details are load-bearing:

- **`pointer-events: stroke`, and no `data-canvas-interactive`.** Pointerdown still reaches the
  viewport, so a drag that begins on a line pans normally. Hover and pan are different gestures on the
  same pixel and both have to work. The drawn paths stay `pointer-events: none` — a bezier's *fill*
  region would swallow a large part of the canvas.
- **Hit paths are drawn in the same thin-to-thick order as the edges**, so where the fan converges the
  strongest association is on top and is the one that answers the hover.
- **The tooltip is not repositioned on `mousemove`.** It anchors where the pointer crossed the line.
  The render function holds a few hundred paths, and a reactive write at pointer-move rate re-diffs
  all of them ~60×/s to move a box that is already under the cursor.

### The canvas tooltip

**One tooltip serves everything on the canvas that explains itself on hover** — the association lines
and the two column heads. One style, not two, because a reader crossing between a line and a column
heading should not meet two different kinds of popover.

It lives in `.browser-body`, **outside `CanvasStage`**, and that is what makes it work for both. It is
positioned in screen coordinates from the pointer, so it neither scales with the zoom nor lags a pan —
and the column heads *are* inside the world and therefore scaled, so a popover built in the world
would render their 10px text at 6–9px at a fitted zoom. The trigger scales; the tooltip does not.

Two head forms, because the two things have different shapes: a line **joins** two things, so its head
is the pair with the state's color swatch against the endpoint it identifies; a column **heads** one
thing, so its head is a title. Below that, `stats` for label/value readouts and `paragraphs` for
prose. The prose form is wider (330 vs 260) and flips sooner — `TOOLTIP_PROSE_MARGIN_*` exists because
one shared margin would let the tooltip run off the right edge exactly where it is longest.

It is **`aria-hidden`, not `role="tooltip"`** — the triggers are an SVG path and a span, neither
focusable, so there is no element for the role to associate with and nothing would announce it. Every
number in it is also in the detail card, which is reachable by keyboard.

A program → state line reports both GSEA metrics, the −log₁₀ of whichever is driving the width (named,
so two lines can be compared in the right unit), and the clamp note when the line is dashed — the dash
is the one thing a reader cannot look up elsewhere. A gene → program line reports the loading. The
structural fallback curve has no tooltip: it carries no measurement.

Hovering an edge lifts that one line and pushes the rest to 0.05, overriding a hovered row. Hovering a
gene link instead sets the hovered **program**, which lifts the link, dims the other links, *and* dims
the states that program does not match — that is the question being asked by pointing at it.

`edgeGeometry` is deliberately independent of the hover state — hovering changes only opacity, and
rebuilding a few hundred bezier path strings per `mouseenter` is real work for nothing. The opacity is
applied in the template through `edgeOpacity()`.

Row order is **not** optimized to reduce edge crossings. Both lists are sorted by expression, which is
meaningful; a barycenter reorder would cut crossings but would cost that ordering.

### What is and is not encoded

Two things were removed for claiming to mean something they did not:

- **Per-program colors.** They were `PROGRAM_COLORS[index % 4]`, cycled by sort position, so a
  program's color changed when the sort order changed. No grouping behind them. Color on a program row
  now means exactly one thing: the **sign of its specificity** — blue up, red down, neutral grey when
  the API reports none.
- **One connector per program.** Every curve was the same shape from the same origin; the only varying
  channel was opacity, which encoded `muted` (p-value significance), already shown by the row's own
  dimming. A single hub-to-list connector replaced the fan. That one is structural — it asserts the
  list belongs to the gene in the hub — and it is the link the infographic draws between its Gene and
  Programs panels. Nothing breaks if it goes too.

If a future channel here is decorative, leave it off. On a data view a color reads as an encoding
whether or not one was intended.

## Files

- `CellEvolutionBrowser.vue`
  - Entry component and the only thing outside this folder should import. Owns all fetching and state,
    the canvas layout constants, and the hub / list placement math.
- `GeneSearch.vue`
  - The gene autocomplete. Presentational plus keyboard navigation; the parent owns the debounce and
    the `/api/bio/match/gene` call, so this never touches the network.
- `ScopeSelect.vue`
  - The tissue and cell-type dropdowns — one component for both. Still not a native `<select>`, but
    **the original reason for that is gone**: options used to carry a secondary line (each cell type's
    expression reading) that a native select cannot render, and that line now lives in the Source data
    tab. What keeps it custom is the band's label/control/error layout, the disabled reason standing in
    for the placeholder, and the keyboard handling. If this is revisited, a native select is a
    legitimate option again.
- `CanvasStage.vue`
  - The infinite canvas: viewport plus a single CSS-transformed world. See below.
- `ProgramRow.vue`
  - One gene program, as a **two-line row**: label on the first line, expression bar and the two
    numbers on the second. Two lines is a hard constraint — it is why there is no program ID (the
    label identifies it) and no second bar for specificity (the gutter arrow carries its sign, the
    number carries its magnitude). Its gutter width, gaps and two column widths come from the panel
    as `--ce-*` custom properties, because the list header draws `EXP` / `SPEC` over those columns —
    see *The two lists are not symmetric*.
- `StateRow.vue`
  - One cell state: name on the first line, its **lede** on the second. Deliberately *not* the same
    shape as `ProgramRow` — see below.
- `programAxis.js`
  - Axis and bar math. `buildExpressionItems()` serves both lists.
- `relationships.js`
  - The edge model: QC and null filtering, the −log₁₀ width scale, the state color palette, and the
    adjacency maps the hover highlight runs on.
- `MetadataCard.vue`
  - The card below the canvas. Three tabs on the same three-column grid as the scope band above, so
    the two cards read as one stack. Owns only the active tab.
- `DatasetInfo.vue`
  - The **Source data** tab: metadata for the single-cell dataset the programs were generated from.
- `EntityList.vue`
  - The pick-one body both entity tabs show when nothing is selected.
- `ProgramInfo.vue` / `StateInfo.vue`
  - The two detail bodies, each an always-visible header plus **inner tabs**. Presentational; the
    parent assembles the match tables from the same edge set the canvas draws.
- `InfoTabs.vue`
  - The inner tab strip. Pills rather than a band, so two levels of tabs do not read as one confused
    row. A tab with a count of 0 renders **disabled rather than hidden** — "the API reported nothing
    here" is information, and hiding the tab makes it indistinguishable from "not loaded".
- `TraitTable.vue` / `traits.js`
  - Trait associations, grouped by phenotype group. One table for both panels, since both trait
    endpoints return the same three fields.
- `entityInfo.css`
  - Shared styling for both detail bodies, pulled in with `<style scoped src>` so each gets its own
    `data-v` hash and nothing leaks page-wide, while there is one copy to drift. The two panels
    describe different things but must read as the same object — a reader crosses between them
    constantly through the match tables.

Shared, from the root: `../ligerApi.js` (all endpoint access), `../ligerFormat.js`, and
`../CellStateInfographic.vue` for the header figure. The infographic is shared with v1, so **changing
it changes v1's page too**.

## The canvas

`CanvasStage.vue` is HTML, not `<canvas>`. Two nested elements do the work:

- `.stage-viewport` clips and captures input.
- `.stage-world` carries one `translate(...) scale(...)`.

Slot content is positioned in **world coordinates** with ordinary CSS. The transform is the only thing
that ever moves, so nodes stay real DOM — focusable, hoverable, selectable text — and the browser
composites the pan on the GPU. `transform-origin: 0 0` is load-bearing: the zoom math assumes the
world's origin is its top-left corner.

Two slots are fixed to the **viewport**, not the world, so they stay put and stay legible at every
zoom: `heading` at the top-left and `overlay` (the edge legend) at the top-right. Neither can live in
the world — a heading that names the whole view would scale away at low zoom and pan off screen. The
heading is `pointer-events: none`, so a drag starting on it still pans. Both are cleared by
`HEADING_CLEARANCE` on `contentBounds`.

The heading is the canvas's own summary — `PPARG in adipose adipocytes`, then
`10 associated gene programs · 6 cell states`. The scope band above shows the same three values as
*fields*; this states them as the result they produced, which is what a reader who arrived on a shared
link is looking at. The counts cover only lists that are actually drawn: an empty list is not on the
canvas, so `0 cell states` would describe a panel that is not there.

Zoom-about-pointer is the one bit of real math. Convert the anchor to world coordinates at the old
scale, then solve for the translation that puts that world point back under the same pixel at the new
scale.

**Input is deliberately narrow:**

**Pointer capture is taken on the first drag move, never on pointerdown.** This is load-bearing, not a
micro-optimization: capturing on pointerdown retargets the subsequent `pointerup` to the viewport, and
the browser derives `click` from that pair — so a plain click on a row inside the world was delivered
to the viewport and the row's own `@click` never fired. Rows were unselectable from the canvas for
exactly that reason. Capture is only needed to keep receiving moves after the pointer leaves the
viewport, which only matters once a real drag is underway.

| Gesture | Effect |
|---|---|
| Drag anywhere | Pan |
| Ctrl / Cmd + wheel, trackpad pinch | Zoom about the pointer |
| Plain wheel | **Nothing — scrolls the page** |
| Buttons, `Fit` | Zoom / frame the content |

Plain wheel is left alone on purpose. The card sits partway down a long portal page, and a canvas that
swallows plain wheel traps the reader — it is the one interaction people cannot discover their way out
of. Anything that needs the wheel should take a modifier.

Two consequences worth knowing:

- `touch-action: none` on the viewport means a touch that lands on the canvas pans it and does **not**
  scroll the page. That is how every canvas tool behaves, but on a phone or tablet the card is a
  620px-tall region the page cannot be scrolled through. Revisit if touch traffic matters.
- `Fit` frames `contentBounds`, not the world. The world is mostly empty, so fitting to it would leave
  the content unreadably small. Anything added to the canvas has to be included in `contentBounds` or
  it gets cropped exactly when the user asks to see everything — that is why `HEADING_CLEARANCE` is in
  there.

### Fit weights the two axes differently

**The width is fitted; the height only pulls the scale down to a floor.** The content is a
left-to-right chain and seeing it end to end is the point, so the width is honored properly and merely
capped at `FIT_MAX_SCALE` (0.9) — past that, filling a wide viewport just makes a small graph large.

The height is not honored the same way, because the lists grow without bound: 25 programs is well over
a thousand world pixels. Fitting that into a 620px card put `Fit` around 0.4 — every label sacrificed
to show rows the reader has to pan past anyway. Below `FIT_MIN_SCALE` (0.6) the height stops pulling
and the canvas pans instead, which is what a canvas is for.

Both bounds apply to `Fit` only. Manual zoom still reaches `MIN_SCALE` / `MAX_SCALE`.

**When the box overflows vertically its top is pinned, not centered.** Centering an overflowing box
crops both ends and drops the reader into the middle of two lists, past the headings that say what
they are. This is also why `HEADING_CLEARANCE` lands differently in the two cases — in full when the
top is pinned, halved when the content fits and the box is centered.

## The two lists are not symmetric

They were, and it was wrong. Both expression endpoints return the same
expression / specificity / p-value shape, so both rows were built and rendered identically — but the
two lists answer different questions.

**A program's label is already descriptive** (`Oxidative phosphorylation`), so the space beside it is
best spent on its numbers. **A cell state's name is a claim about biology** (`Stressed`,
`Mature identity`) that means very little on its own, and its one-line lede is what makes it legible.

So a state row is **name + lede**, and the bar, the expression reading, the specificity arrow and the
specificity reading are gone from it. None of that data is lost: `StateInfo` shows all four with room
to label them, and `EntityList` — the card's pick-one table — still lists the two numbers. The lede
comes from the metadata row the canvas already fetched for its labels, via the same two paths
`StateInfo` reads, so it costs no request. It is single-line and ellipsized, because the row height is
shared with the edge math.

### Program rows carry structure, not expression

**Expression is not on a program row.** The 2026-10-02 call asked for it to come off (punchlist 1.2):
the expression data is far less validated than the structure beside it, and it barely varies between
programs — *"the expression's basically the same across all gene programs… I'd [not] want that to be
the first thing people see."* The bar, the value and the `EXP` / `SPEC` column heads are all gone.

What a row carries now:

| Position | Content |
|---|---|
| Gutter | Specificity: direction as the arrow, value under it, one `title` over both |
| Line 1 | The program label |
| Line 2 | The factor QC verdict, where the expression bar used to be |

The verdict is **display only** — it filters nothing and dims nothing. Several questions about what
its inputs mean are open with the pipeline owner (`../API.md`, *Open questions* 1–3), so
it is reported, not acted on.

**Dimming means one thing everywhere: "this is what the filter would remove."** A dimmed program has
no loading for the searched gene; a dimmed cell state has no significant association. Not the p-value
(3.1 is still open) and not the QC verdict. On the canvas a dimmed row only appears with the
corresponding checkbox off; in the card's lists, which never filter, it is how the two groups are told
apart. A program whose loading request *failed* is never dimmed — missing is not absent.

The explanations that used to be column-head tooltips now live in `ProgramInfo`'s head metrics, on the
values they describe, since the card is the only place those values still appear. Three things they
must keep getting right:

- **The expression field is named, not interpreted.** `log10_cpk` behaves like a log of a log and its
  exact definition is an open question (`../README.md`), so the text reports the backend's own naming
  and does not assert CPK.
- **Specificity's text stays its own string.** The denominator differs by card — cell types measure
  against other cell types, programs and states against the parent cell-type background. v1's README
  says the same thing: do not collapse these into one shared sentence.
- **The p-value text says that what it tests is unknown.** Asked twice on the call and unanswered
  (3.1). That is why it no longer grays anything.

### Which programs are shown

Default: **only programs that report a loading for the searched gene** (punchlist 1.6). This was the
single biggest point of confusion on the call, hit independently by two reviewers — searching a gene
listed every program for the cell type, so *"why is it showing that only 4 of these programs are
connected to the gene?"* The `Show programs with no <gene> loading` checkbox sits in the legend's
**gene → program** block, with the scale it qualifies.

Three rules this filter must keep:

- **Filtering happens at the `programItems` computed**, over `allProgramItems` — not in the template.
  `buildEdges()` drops any edge whose endpoint is off-canvas, so a hidden program's edges go with it,
  and the canvas height, row anchors and counts all stay consistent for free.
- **The filter stays inert until the gene-loading fan-out settles** (`geneLoadingsSettled`). That
  fan-out is one request per program and is not awaited, so filtering early would collapse the list
  from every program to a handful a second after the canvas appeared, under the reader's cursor.
- **Three states, not two: present, absent, failed.** A program the API answered for and said *no*
  (`geneLoadingAbsentByProgram`) is hidden; a program whose request *failed* stays visible. The two
  are indistinguishable from `geneLoadingByProgram` alone, which is the same distinction the legend's
  `absent` / `failed` counts exist to preserve.
- **`belowLoading`, not `geneLoadingAbsent`, is the predicate.** The checkbox says `Loading > 0 only`,
  and a loading of exactly 0 or below is a *reported* value — not absent, but it does not clear the
  bar either, and the label would be lying if such a row stayed visible. Zero loadings are real here:
  45 of 4940 genes on Factor1 alone.

`loadGeneLoadings()` therefore fans out over `allProgramItems`, **not** `programItems` — asking only
about visible programs would ask only about programs already known to have a loading, and nothing
would ever be discovered to hide.

Both legend checkboxes are phrased as **positive** filters — `Loading > 0 only` and
`GSEA P < 0.05 only` — and both default on. One saying "keep" while the other said "hide" made the two
read as opposites when they do the same kind of thing.

### Which cell states are shown (the cascade)

Punchlist 1.7: a state with no surviving association to a visible program is hidden. Otherwise states
dangle off programs the gene-loading filter removed, or sit there with every association below the
significance threshold and nothing drawn to them.

It has **no checkbox of its own** — it follows `GSEA P < 0.05 only`, symmetrically with how the
programs list follows `Loading > 0 only`. With that box on, unconnected states are hidden; with it
off, every state is shown and the unconnected ones are dimmed. `connectedStateKeys` is therefore
always computed at `significantOnly: true` regardless of the checkbox: "does this state have an
association worth drawing" is the same question either way, and only the *response* to it changes.

**It takes two `buildEdges()` passes, and that is not redundancy.** `buildEdges()` takes `stateOrder`,
which it uses both to drop off-canvas edges and to pick each edge's color, so the edges cannot be
derived from a state list that is itself derived from the edges. `connectedStateKeys` runs the first
pass against *all* states purely to learn which are connected; `stateItems` filters on that; and
`relationships` runs again against the final order, which is what gets drawn.

Two consequences worth keeping:

- **State color is assigned in `stateItems`, not `allStateItems`.** It is positional, so assigning it
  before the filter would leave the row's swatch and the edges landing on that row reading from two
  different orderings.
- **An empty relationship index disables the filter** (`connectedStateKeys` returns `null`). Every
  state would otherwise have zero edges and the entire list would vanish — the same
  degrade-to-unfiltered rule the factor QC report follows.

`selectedState` falls back to `allStateItems`, because a state can leave the canvas while selected.

### The card's lists never filter and never narrow

With nothing selected on a tab, that tab shows **every** program or cell state in scope. Two separate
mechanisms used to cut them down, and both are gone:

- **Canvas filtering.** `programItemsWithCounts` and `stateItemsWithCounts` are built from
  `allProgramItems` / `allStateItems`, not the canvas-filtered lists.
- **Cross-selection narrowing.** The lists used to shrink to the matches of whatever was selected on
  the other side. With a program selected, the cell-state list showed a handful of states and there
  was no way to reach the rest from the card at all. `statesForSelectedProgram` /
  `programsForSelectedState` and the `narrowedTo*` flags are deleted, not disabled.

These lists are the "I know what I am looking for" path. Anything that hides a row here leaves a
reader unable to reach it without first working out which control was responsible.

Rows below the thresholds are **dimmed**, and `EntityList` prints how many — the tab header count will
not match the canvas and that otherwise reads as a bug. Programs also carry `geneLoading` /
`geneLoadingText`, shown as `EntityList`'s own column, since the loading is the reason a program is on
the canvas at all.

**Both lists read `unfilteredRelationships`, not `relationships`.** The latter is scoped to what the
canvas is drawing, so match counts taken from it read 0 for anything the checkboxes hid, and a cell
state came out dimmed merely because the program it connects to had been filtered away. A list that
does not filter cannot be described by a filtered edge set. That is a third `buildEdges()` pass, always
at `significantOnly: true`.

Note `stateItemsWithCounts` also re-resolves `color` itself: `allStateItems` carries only a
*provisional* color, assigned before filtering, which is normally settled in `stateItems`.

### The legend, and the two canvas labels

**The scales live in one box in the `overlay` slot** — viewport-fixed, so it stays legible at any
zoom, and so the two encodings sit side by side where they can be read against each other. It is
collapsible; the header survives collapsing, so the way back is where the box was.

**Two labels sit in the world**, one *on* each bundle: `Gene loadings` over the hub → programs gap,
`Enrichment` over the programs → states gap. Each is no wider than its gap (`COLUMN_GAP`) and is
centered on the bundle both ways — horizontally by the flex, vertically by `translateY(-50%)` against
a `top` of `HUB_Y`, which is where both panels are centered and so where every bundle is thickest.
The transform rather than a subtracted half-height, because the label's height is its text's and a
hardcoded number would drift the moment the type scale moves.

A label therefore occludes a few of its own edges. That is accepted: each is a small pill against a
200px gap, and the covered lines stay hoverable on either side of it. The connector SVG is painted
earlier in the slot, so the labels land on top without needing a `z-index`.

They carry **no scales or controls** — that was tried and reverted. A full key sized to its gap is
200px wide and cramped, and splitting the controls across two boxes puts them in two places a reader
has to find separately. A label is small enough that the width constraint costs nothing.

Clicking a label opens the legend and **pulses the matching section**, so the eye lands on the half
that label belongs to rather than on the whole box. Three details that make that work:

- `pulsedSection` is cleared and re-set on `$nextTick`, because re-adding a class an element already
  has does not restart a CSS animation — without it, clicking the same label twice does nothing the
  second time.
- `PULSE_MS` must match the `legend-pulse` animation duration × iterations. If they drift, the class
  is removed mid-flash or lingers after it.
- The timer is cleared in `beforeDestroy`.

`data-canvas-interactive` on each label, or clicking one reads as the start of a pan. They need no
clearance in `contentBounds`: sitting at `HUB_Y` they are already well inside its bounds, unlike the
earlier version that floated above the panels and had to be reserved for.

The enrichment section reports **only** `N cell states hidden with no association shown`. The edge
drop counts that used to sit there — `N below threshold`, `N QC signatures excluded` — were counting
rows of a heatmap nobody is looking at, while the visible effect of the checkbox is states appearing
and disappearing. Those counts still exist in `edgeSummary` and still drive `edgeEmptyNotice`, which
fires only when the canvas is empty — the one moment a reader has to be told whether they are looking
at a filter or a data gap.

### Tooltips: `InfoTip`, never `title`

**No native `title` attribute is used anywhere in this browser**, and reintroducing one is a
regression. `title` cannot be styled, cannot be read at a legible size, waits about a second before
appearing, and never appears at all for keyboard users.

`InfoTip.vue` wraps a trigger and shows its `text` on hover or focus. **It renders the tooltip into
`document.body`**, which is the whole design, for two reasons that both bite:

- The canvas world is CSS-`transform`ed for pan and zoom, and a `position: fixed` descendant of a
  transformed element is positioned against that element rather than the viewport. A tooltip rendered
  in place inside the canvas lands in the wrong spot and scales with the zoom.
- The list panels and the info card both `overflow: hidden`, so an in-place tooltip near a panel edge
  would be clipped.

Vue 2 has no `<teleport>`, so the element is created and positioned by hand and removed on hide and on
destroy. A tooltip that outlives its trigger is a leak that shows up as a box stuck over the page.

Two props exist for cases that are easy to get wrong:

- `:focusable="false"` when the trigger already wraps something focusable — a button, a link. Focus is
  tracked with `focusin`/`focusout`, which bubble, so the tooltip still opens for keyboard users
  without the wrapper becoming a second tab stop in front of the control. Icon buttons keep an
  `aria-label`, since the tooltip text is no longer their accessible name.
- `cursor="inherit"` when the tooltip only reveals text that did not fit. `cursor: help` is right for
  an explanation and wrong on a truncated label or a clickable row.

Where a label is clipped, the `overflow`/`ellipsis` rules sit on an **inner** span rather than on the
trigger, so the trigger still measures the full row width as a hover target.

### Type scale in the info panels

Nothing in the info panels is below **11px**. The scale is 11 / 12 / 13 / 14 / 18, raised from
9 / 10 / 11 / 12 / 13 / 16 rather than flattened — the hierarchy is load bearing, so the sizes move
together. This applies to `entityInfo.css` and the info-panel components; the canvas rows keep their
own smaller type, because their height is fixed and shared with the edge math.

### Layout constants

All in `CellEvolutionBrowser.vue`, all world pixels. Only **three** things are positioned absolutely —
the gene hub and the two list panels — and each panel is vertically centered on the hub. The rows
inside a panel are ordinary flow.

`LIST_ROW_HEIGHT` and `LIST_HEADER_HEIGHT` are **exact, not estimates**. The edge anchors are computed
from them rather than measured from the DOM, so an element whose real height differed would point every
line at the wrong place — a header that grew by one line would put every edge a line too high. Each is
published to CSS on its panel (`--ce-row-height`, `--ce-list-header-height`), the elements take their
height from those variables, and both use `box-sizing: border-box` so the height holds regardless of
padding or text metrics. **Change a constant and its CSS together, or not at all.** If a header ever
has to size to its content, measure the DOM and feed the measurement into the layout math — do not
simply drop the fixed height. The header's description is `-webkit-line-clamp: 2` and the state row's
lede is single-line for the same reason: text must not be the thing that decides the height.

**There is one header constant, not two.** The programs and states headers used to differ because the
programs header carried a row of `EXP` / `SPEC` column headings; those columns came off the rows
(punchlist 1.2) and the two headers now hold exactly the same things, so a second constant would only
be something to drift. When the columns were removed the old 84px constant was briefly left in place,
which left a dead band under the programs description — if the header ever looks too tall again, that
is the first thing to check.

**`COLUMN_GAP` is one constant for both gaps** — gene → programs and programs → states. They were 180
and 340; the wider one read as the more important relationship when they are the same kind of step in
the chain. 200 is still enough drawing room for a fan of a few hundred edges to separate. Below
roughly 150 the curves collapse into a band.

`HEADING_CLEARANCE` pads the **top only** of `contentBounds`, so `Fit` does not frame the tops of the
lists underneath the two boxes fixed across the top of the canvas. What it buys on screen is this
times the fitted scale — in full when `fit()` pins the top, halved when it centers.

**It and `FIT_PADDING` are both deliberately small, because both are paid for in starting zoom.** They
inflate the box `fit()` is trying to frame, and `FIT_PADDING` counts twice per axis; at 80 (the
`CanvasStage` default) it was spending ~12% of the fitted scale on empty space in a card this short.
Clearing the two fixed boxes completely is not worth what it costs: the heading is two short lines,
the legend opens collapsed, and the canvas pans.

The list is **not** internally scrollable. It is as tall as it needs to be and the canvas pans to it —
a scrollbar inside a pannable canvas gives two competing ways to move the same content.

## Config

Read via the `config` prop. Small on purpose — it holds what the current UI reads, and grows as
sections land. v1's keys describe v1's controls and are not ported wholesale.

| Key | Default |
|---|---|
| `pageTitle` | `Cell State Browser` |
| `pageSubtitle` | `Explore how genes influence cell states through coordinated programs…` |
| `documentationUrl` | `/research.html?pageid=kp_liger_documentation` |
| `exampleGenes` | `["PPARG", "PCSK9", "INS"]` — `[]` hides the row |
| `singleCellBrowserUrl` | `/r/scb` — base for the source-data link; `""` hides it |
| `tissues` | unset = all; otherwise an allowlist of tissue keys |
| `prodHost` / `devHost` | the hugeamp bioindexes — see `../README.md` |
| `expressionAxis` / `specificityAxis` | unset = derived from the data |

`singleCellBrowserUrl` takes a **relative or absolute** base; the dataset ID is appended as a query
param by `withQueryParam()`, which picks `?` or `&` correctly and keeps a trailing `#hash` after the
param. All of `/r/scb`, `https://hugeamp.org/r/scb`, `/r/scb?tab=umap` and `/r/scb#view` work.

## Data flow

1. Typing → 200ms debounce → `match/gene` → suggestions.
2. Gene selected → gene-level `expression-cell-state` **and** `expression-program` in parallel. These
   derive the tissue list, straight from the rows' `tissue` field.
3. Tissue selected → `expression-cell-type?q=<tissueKey>,<gene>`.
4. Cell type selected → four requests in parallel:
   - `expression-program` and `gene-program-factor`
   - `expression-cell-state` and `cell-state-metadata-extended` for the state labels and ledes
   - `gene-program-heatmap` for the edges
   - `gene-program-qc-metadata-extended`, which is what identifies a QC signature in those edges

**Every one of them takes `<tissueKey>,…` and none takes a model.** This used to be the most
error-prone part of the component: three classes of endpoint — always-dataset-ID, always-tissue-key,
and depends-on-the-portal — with a runtime sniff to tell them apart and HTTP 500 rather than an empty
result when it guessed wrong. See *Tissue identity* below.

The heatmap is **not** lazily loaded behind a click. Its rows are the edges, and the edges are the
point of showing both lists at once.

## Tissue identity

**`selectedTissueKey` holds the key; the label is derived.** It used to be the other way round — the
label was the state and every query re-derived a key from it — which is why four conversion functions
existed. The key is what the API speaks and what the query string has always carried, so it is the
identity; the label is presentation.

**There is no tissue → dataset mapping.** There was a hardcoded 9-tissue table with a `datasetIds[]`
array per tissue, a reverse index, per-portal dataset-ID observation, and `detectCellStateDatasetKeying()`.
All of it is deleted. Two things it got wrong, both observed:

- It **gated the tissue list**. Any tissue absent from the table was dropped, so when the API gained
  `bone`, `bonemarrow` and `tendon` they stayed invisible. The list is now whatever the rows report.
- It **pinned dataset IDs as constants**, and they drift as source data is rebuilt — between two
  observations heart went `v3.2` → `v4.0`, and artery and pancreas both moved to `v3`. Three of the
  four tissues checked had changed. A dataset ID may only ever be read from a response.

What is left is one map of **display labels**, `TISSUE_LABELS` in `../ligerApi.js`, and it is
temporary. It exists only because labels cannot be derived: `bonemarrow` title-cases to "Bonemarrow",
and `sat`/`vat` to "Sat"/"Vat". `tissue_label` has been requested on the two gene-level expression
endpoints; `tissueLabel()` already prefers the row's field, so **when it lands, delete the map**.
Unlike the old table it is not a gate — an unlisted tissue still renders, via `formatDisplayLabel()`.

The config `tissues` allowlist stays. Which tissues a portal chooses to *display* is curation, not
identity.

## The metadata card

A second card below the canvas, same shape: a band of three tabs where the card above has three
selectors, on the same `1fr 1px 1fr 1px 1fr` grid so the two bands line up. Each tab's subtitle reports
what is behind it before it is opened, the way the selector values do above.

| Tab | Shows |
|---|---|
| Source data | The single-cell dataset the programs came from. |
| Gene program | The selected program's detail, or a pick-one list when none is selected. |
| Cell state | The same, for cell states. |

`activeTab` is **controlled by the orchestrator**, not local to the card. A selection made on the
canvas moves the card to that entity's tab — otherwise selecting a program while the card sat on
Source data changed only a highlight two screens up, which is indistinguishable from nothing
happening. The reverse holds too: a selection made in the card calls `revealWorldPoint()` on the
canvas, which pans the row into view, but only when it is not already on screen — re-centering on a
row the reader just clicked would yank the view out from under the click.

Each entity tab has two bodies. With nothing selected it renders `EntityList` — the same set as the
canvas, as a plain table, which is the faster path when you know what you are looking for. With
something selected it renders the detail and offers a back link to the list.

**The card always sets a selection; the canvas toggles.** Clicking a selected canvas row clears it,
because the canvas has no other affordance for that. The card must not toggle: its entry points are a
list that only renders when nothing is selected, and a cross-link from the *other* entity's match
table — and a cross-link back to something already selected has to land on it rather than switch it
off. Hence `setProgram`/`setState` beside `selectProgram`/`selectState`.

A cross-link also moves to the target's tab. Clicking a cell state inside a program's match table is a
request to read about that state; leaving the reader on the program tab with a silently-changed
selection would be a dead end.

**With one side selected and the other not, the empty side's pick-one list narrows to what matches** —
both directions. The question at that point is "which of these does the selected one connect to", not
"what exists". Each narrowed list says so, reports the count in its tab subtitle as `N matching`
rather than `N available`, and offers the way back to the full set; a silently filtered list is
indistinguishable from a short one. `relationships.byProgram` / `.byState` are the source, so the card
and the canvas cannot disagree about what a match is.

### Source data

`/api/raw/file/single_cell_all_metadata/dataset_metadata.json.gz`, on the resolved LIGER host — a
portal serving LIGER from its own bioindex serves its own single-cell metadata from the same place, so
this does not use `BIO_INDEX_HOST` any more than the rest of the component does.

**The file is JSONL, not JSON.** One complete object per line, no enclosing array, no commas —
`response.json()` throws on it. Read it with `fetchJsonLines()`. The `.gz` is handled by the browser
through Content-Encoding, so `text()` already yields decompressed text; there is nothing to inflate.
A malformed line is dropped rather than losing the whole file.

Fetched **once per session and cached**, lazily, the first time a dataset ID exists to look up. It is
the portal's entire single-cell catalogue, not a per-scope query, so refetching it on every tissue
change would be re-downloading the same file.

The row is matched on `activeDatasetId`, which is **read off the loaded rows' `dataset` field** — the
program rows when there are any, the cell-type rows before a cell type is chosen. It cannot come from
anywhere else: dataset IDs drift as source data is rebuilt, so an ID held in config or in a constant is
a future wrong answer. Exact match first, then normalized, which covers a case or `-`/`_` disagreement
between the two pipelines without collapsing genuinely different datasets (`v2.2` and `v3.2` stay
distinct) — and that distinctness is now load-bearing rather than theoretical.

Below the dataset fields it lists **every cell type the tissue reports, with the searched gene's
expression in each**, strongest first, with the one the canvas is built from marked. This is the
reading that used to sit inside the cell-type dropdown, and it belongs here for two reasons: a list of
fifteen numbers is something to *compare*, which a dropdown you have to hold open is the wrong place
for; and the dataset's cell-type composition is a property of the source data rather than of the
canvas.

It is **rendered outside the metadata-lookup guards**, deliberately. The cell types come from the
LIGER expression index, not from `dataset_metadata.json.gz`, so an unmatched or failed metadata lookup
must not take them down with it — that is the case where knowing what is actually in the dataset
matters most. It is also rendered when the list is *empty*: "this tissue reported no cell types" is a
fact, and hiding the section would make it indistinguishable from a section that was never built.

The rows are not links. The band above is where cell type is chosen, and a second control for it here
would split that.

`cellTypeOptions` stays the single place cell-type rows are resolved to labels and sorted — the tab
and the dropdown read the same computed, so they cannot disagree about the order.

Every dataset field renders only when present. The catalogue covers every single-cell dataset the portal has
and its rows are not uniform, so an empty field is normal — a label with nothing after it would read
as missing data rather than as a field this dataset does not carry. `authors` and `assay` are a string
on some rows and an array on others; both render.

### Cell state detail

Inner tabs: **Overview · Marker genes · Matching programs · Traits · Methods.** The header — identity,
lede, the three expression figures, the provenance line — stays visible across all of them. Overview
is a digest of previews, not a dump; the full tables are behind their own tabs.

Every field except traits comes from the `gene-program-cell-state-metadata-extended` row the canvas
already loaded for its labels, so only the Traits tab costs a request.

`Methods` renders `scoring.primary_score`, `secondary_score`, `state.score_scope`,
`hard_call_policy`, `hard_call_notes`, `summary.portal_methods_details` and
`scoring.activity_weights[]`. All of it is populated on every state and **none of it was rendered
anywhere in v1** — `stateMethodsDetail()` built it and nothing read it.

Those rows are **nested** — the interesting fields live under `summary.`, `state.`, `curation.`,
`quality.` and `marker_set.`. `field()` only reads top-level keys, so this goes through `pathValue()`.

Deliberately not shown, from the measured audit in `../API.md`:

- `summary.biological_description` / `short_description` — the same text as the lede on most states,
  a longer version of it on the rest.
- `state.class`, `interpretation_status`, `release_class`, `portal_visibility`, `qc_sensitivity`,
  `allow_hard_call`, `curation.provenance_warnings[]` — pipeline classifications, not anything a
  portal reader can act on.
- `quality.quality_badges[]` and `summary.portal_primary_badges[]` — constants, and identical to each
  other. The four curation constants collapse into one provenance line instead of six badges.

Marker citations are links on the marker chips rather than a separate reference list.
`state_level_citations` is the same set of papers the markers cite, rolled up — listing it separately
restates the markers with the gene attribution thrown away.

### Gene program detail

Inner tabs: **Overview · Gene loadings · Matching states · Gene sets · Traits · QC signatures.**

Every overview preview names its selection rule — `Top 8 by loading`, `Top 4 by GSEA P`,
`Top 5 by |beta|`. These previews **rank, they do not filter**: no significance threshold is applied,
so the note names the ranking statistic and never a cutoff. Previews carry names only, no statistics
and no click-through; the tab behind them has both.

Four requests per program — gene loadings, gene sets, QC signatures — fired only when a program is
selected and cached by program id, plus `gene-program-qc-metadata-extended` once for the whole QC
dictionary. Fanning these across every program up front is what made v1's bulk trait matrix expensive.

Program-level metadata is thin by nature: `gene-program-factor` returns six fields and that is the
entire surface. **Do not reintroduce a quality badge.** v1 showed one read from
`suggested_program_quality_class` / `quality_class` / `release_recommendation` / `qc_recommendation`,
none of which any index returns, falling back to a regex over `match_class`, which the heatmap does not
return either — so it printed the constant `Exploratory biological` on every program in every tissue
while looking like an API verdict.

The honest replacement is **counted QC enrichment** — signatures tested, enriched at q < 0.05, at
P < 0.05. Counts, not a verdict. An empty QC result says so rather than asserting a pass the API never
reported.

There was a second one — a `Factorization label` block reporting `gene-program-factor`'s own `label`,
with a flag when that label called the program a QC or artifact program. **Removed**, because the
label turned out to be the same string as the panel's own title, so the block restated the heading;
and the QC flag was derived from that same text, which means a program whose title reads
`Ambient RNA contamination` was already saying it. `programSelfLabelsAsQc()` went with it.

Note what this does *not* remove: `factor_quality` now exists as a real field on several endpoints
(`exploratory_biological`, `unmatched` observed). A badge built on that would be legitimate, unlike
v1's — but not until its value space is enumerated. Two values that are not points on one scale is
exactly how the fabricated badge started.

Gene loadings drop rows with a loading of exactly 0 (45 of 4940 on Factor1) — a zero loading is not a
top gene. When the loading index is empty, the ordered `top_genes` string is the fallback and shows
rank and gene **only**; v1 also printed a score counted down from the list length, which was invented
in the component.

**The searched gene is pinned to the top of the Gene loadings tab**, above the ranking and separated
by a rule. The question a reader brings to that tab is "where does my gene sit in this program", and
it usually is not in the top 30. The pinned row carries its **true rank** (`ranks 412 of 4,940`), so
being first in the table cannot be mistaken for being strongest. Three cases it has to get right:

- Already in the top N → marked in place, **not** pinned as a duplicate.
- Loading of exactly 0 → still pinned, showing 0. Ordinary rows are filtered to positive loadings, but
  for the gene the reader asked about, "measured, and it is zero here" is the answer.
- Not in the program's index at all → says so, rather than showing nothing.

### Traits

Both trait endpoints return `trait`, `beta`, `beta_uncorrected` and nothing else, and the trait value
is a raw internal code — `BSandFG` means nothing on its own. So every display goes through the
`/api/portal/phenotypes` join, fetched once for the session and **pinned to the hugeamp bioindex**: no
other portal serves it (see `../README.md`).

**That call is unscoped, and must stay that way.** It was `?q=md`, which scopes the phenotype list to
the metabolic disease group — so every trait outside that group silently failed to resolve and was
then hidden by the unmatched-trait filter. Measured: 16 of 20 sampled traits matched under `?q=md`,
and the four misses (ADHD, telomere length ×2, brain volume) all resolve unscoped. LIGER now spans 12
tissues including bone, bonemarrow, tendon and hypothalamus, so its traits are not metabolic.

- **Identity stays keyed by the raw API value.** Only the display is the phenotype `description`.
- **Grouped by phenotype `group`**, because the group is what makes a bare code legible. Group order
  follows the strongest trait in each, so the most relevant group is first rather than whichever
  sorts alphabetically. Empty groups are dropped.
- **Traits with no phenotype match are one `Other` bucket, not one bucket each** — that is what makes
  the grouping usable at ~350 rows.
- Ranked by **|beta|**: these are effect sizes, and a strong negative association is as interesting as
  a strong positive one.
- Unmatched traits are filtered out by default, and **the count is always reported** so the filter is
  never silent. If the phenotype fetch fails entirely the table is empty and says how many rows it is
  not showing, rather than printing a wall of raw codes.

A failed phenotype fetch marks itself loaded rather than retrying, so a host that is not answering is
not hammered once per selection.

## Query string

The same five params as v1, so a link is portable between the versions:

`?gene=PCSK9&tissue=artery&cell_type=fibroblast&gene_program=Factor3&cell_state=artery_fibroblast_adipogenic`

- `tissue` is a tissue **key**, not a label. A tissue the config does not list falls back to its
  normalized label, so it still round-trips.
- `cell_type` is the raw cell-type key. Matched exactly first, then normalized, so a link written by
  v1 resolves here.
- **`cell_state` and `gene_program` are not mutually exclusive.** They are in v1, which has a single
  detail panel; v2 has two independent lists, so both can be selected and both can appear in a link.

Restoring walks the load chain in order — gene, then tissue, then cell type — because each step's
options only exist once the previous one has loaded. Two details that matter:

- `isHydratingFromQuery` suppresses the param writes each selection would otherwise make, so
  restoring a link does not rewrite the link it came from mid-restore.
- A row selection is validated against the loaded lists before being applied. A stale link leaves
  nothing selected rather than highlighting a row that is not there. Whatever actually resolved is
  written back at the end, so a link carrying a dead cell type stops advertising it.

### replaceState, not pushState

**This is a deliberate difference from v1.** v1 pushes a history entry per selection and has no
`popstate` handler, so pressing Back rewinds the URL while the page keeps showing the newer state —
the URL and the interface disagree until a reload.

v2 replaces instead. The URL is always current and always shareable, and it cannot desync. The cost is
that Back leaves the page rather than stepping back through selections. Restoring that properly means
a `popstate` handler that re-runs the load chain; pushing without one just reintroduces the bug.

## Not built yet

- **`SPEC` is a guess at the abbreviation.** `EXP`/`SPEC` fit the 38px and 42px columns and the
  tooltips carry the full meaning, but nobody who reads these scores has confirmed that those are the
  conventional short forms.
- **Whether to keep hiding unmatched traits by default.** The match rate is no longer unknown — it was
  the `?q=md` scoping, and unscoped it is 20 of 20 on the sample above. With the remainder a short
  tail rather than a wall of raw codes, the default could reasonably flip to showing them.
- **Is the state `Methods` tab worth keeping?** Everything in it is populated, but whether a portal
  reader needs AUCell/UCell scoring detail is a call for someone who reads these scores. v1's README
  raises the same question. It is cheap to drop — one tab.
- Back does not rewind selections — see *Query string*.
- Edges are hover-only. Clicking a row selects it but does not pin its edges, and a line itself is not
  clickable — so its tooltip and highlight are lost the moment the cursor leaves. Pinning a line's
  readout (click to keep it, click again to release) is the obvious next step there.
- Row order is not crossing-optimized (see *Readability*).

## Rules

- Everything for this version lives in this folder. Do not import from `../v1/`.
- All endpoint access goes through `../ligerApi.js`. Do not build a URL or re-derive a host here.
- Check `../API.md` before putting a field on screen. **Do not render a value the API
  does not supply** — that is how v1 ended up showing a constant quality badge that read as an API
  verdict.
- Build controls in this folder rather than pulling in portal-wide components.
- Every data-backed section needs its own loading and error state.
- The bar rules in `programAxis.js` are not style choices. Read the comment at the top before touching
  them; both encode a bug that shipped once.
