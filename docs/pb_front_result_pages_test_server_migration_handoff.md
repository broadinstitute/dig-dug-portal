# PB Front and result pages test-server migration handoff

Date: 2026-08-01

Canonical project handoff:

`/Users/kyuryung/Documents/Obsidian/Projects/dig-dug-portal/PB Front and Result Pages Test Server Migration Handoff 2026-08-01.md`

## Mandatory working directory

Perform the migration **inside the test-server project checkout**:

```bash
cd /Users/kyuryung/Documents/github_dir/dig-dug-portal-bch-prototype
```

Target snapshot at handoff:

- branch: `kyuryung/bch-prototype`
- HEAD: `0f75ad8b3f905b8596a30d70cfbfdfc5c820abf1`
- remote: matches `origin/kyuryung/bch-prototype`
- worktree: initially clean; final session recheck found in-progress changes listed below

Final session recheck found target-side work already in progress:

```text
M  src/views/PbGene/Template.vue
M  src/views/PbVariant/Template.vue
M  vue.config.js
?? src/views/PbFront/
```

Preserve these changes and inspect their provenance before continuing. Do not
reset or overwrite them. They add the PB Front route and preliminary PB home
links, but they are not evidence that the full migration is complete.

The completed mockup is only the read-only source reference:

```text
/Users/kyuryung/Documents/github_dir/dig-dug-portal
branch kyuryung/mockup-branch
HEAD is this handoff commit: feat(pb): complete front and result page mockups
resolve the immutable hash with: git rev-parse HEAD
the migration source is committed; unrelated untracked artifacts remain and must be preserved
```

Do not perform the migration by continuing to edit the mockup checkout. The
source commit is a reference boundary, but the diverged target already contains
an earlier PB Variant integration, so do not blindly cherry-pick it. Do not
reset, restore, delete, push, or merge either checkout without explicit user
approval.

## Migration scope

Migrate the completed `pb_Front.html`, current `pb_Gene.html`, and current
`pb_variant.html` behavior into the test-server checkout while preserving its
production-specific configuration, private BioIndex helper, proxy contract,
and existing PB Gene/PB Variant live-data integration.

Key source areas:

- `src/views/KrFront/`
- `src/views/KrClinicalFocus/`
- `src/views/PbGene/`
- `src/views/PbVariant/`
- `vue.config.js` route/proxy changes, merged selectively
- PB Front and PB Variant build/reference/test scripts under `scripts/`

`KrFront` and `KrClinicalFocus` do not currently exist in the target checkout.
PB Variant already exists there from the earlier migration, so compare and
apply only the newer UI/state changes. Do not replace the target
`vue.config.js` or BioIndex adapter wholesale.

## Required behavior to preserve

- Front workflow: Sample ID / Phenotype / Gene / Variant selection, rectangular
  search field, small `Set` action, and completion-colored connector arrows.
- Variant example: only `chr12:102912793:CA:C`; do not restore the invalid old
  `chr5:150203773:T:A` example.
- Optional clinical context: HPO manual search plus Orphanet/MONDO disease
  profiles; true three-column editor; selected-term checkboxes and All/None.
- Shared context: Front stores selected HPO terms in `krClinicalFocus.v1` in
  `sessionStorage`; PB Gene and PB Variant hydrate the same terms and labels.
- Context scoring remains on-demand. Navigating from Front must not fabricate or
  automatically calculate a Match Score; the user still selects `Go`.
- PB Gene and PB Variant Home controls link to `/pb_Front.html` and use the same
  visual scale as Gene/Variant search.
- PB Variant ClinVar value links to ClinVar. P is red, LP orange, VUS yellow,
  and other/unavailable values gray. LoFTEE HC is red.
- Live pages have no fixture fallback. Continue all BioIndex pages and
  deduplicate carriers by sample ID.
- Unsupported metadata stays `Unavailable`; different-gene co-carriers stay
  `Not calculated`; partial residual PheRS means remain forbidden.

The generated HPO/Orphanet/MONDO reference is about 4.3 MB raw and is already
loaded with dynamic `import()` only when the context editor opens. Preserve
that lazy-load boundary.

## Verification

Run from the target checkout after migration:

```bash
node scripts/test_pb_clinical_context_integration.js
node scripts/test_pb_front_clinical_context_reference.js
node scripts/test_pb_variant_carrier_statistics.js
node scripts/test_pb_variant_identifiers.js
git diff --check
npm run build
```

Known source-checkout caveat: `python3 -m unittest
scripts.test_pb_gene_context_ui -v` had four pre-existing expectation failures
before the latest Front work. Do not conceal or broaden the migration to fix
them unless the migrated behavior actually regresses.

Local target-server command used by the earlier integration:

```bash
BIOINDEX_HOST_PRIVATE=http://100.80.30.199:5000 \
NODE_OPTIONS=--openssl-legacy-provider \
./node_modules/.bin/vue-cli-service serve --port 8095 --host 127.0.0.1
```

Set `PHENOTYPE_ANALYZER_HOST_PRIVATE` only when an approved Context API target
is available. Do not infer backend configuration from a port number.
