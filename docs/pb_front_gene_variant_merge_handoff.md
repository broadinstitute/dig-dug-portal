# PB Front, Gene, and Variant Merge Handoff

- Date: 2026-08-01
- Source branch: `kyuryung/bch-prototype`
- Implementation commit: `d105d5db27ff394b9b15750ecc41aa9e2c916a3d`
- Implementation base: `0f75ad8b3f905b8596a30d70cfbfdfc5c820abf1`

This is the engineer-facing merge guide for the linked BCH Browser frontend.
It covers three existing Vue page entries and their shared clinical-context
state. It does not authorize or require backend, BioIndex, `master`, or
`origin/bch-aggregator` changes outside the team's normal review process.

## Merge Scope

| Page | Route | Responsibility |
|---|---|---|
| PB Front | `/pb_Front.html` | Search workflow, optional HPO context, and navigation to result pages |
| PB Gene | `/pb_Gene.html` | Gene-level live carrier and observed-variant evidence |
| PB Variant | `/pb_variant.html` | Exact-variant live carriers, gene-scoped statistics, and evidence |

PB Gene remains in place. PB Variant remains a separate page. PB Front is the
shared entry page; all three pages link to one another.

## Implementation Summary

- Adds the `pbFront` Vue entry without replacing the existing `pbGene` or
  `pbVariant` entries.
- Adds `src/views/KrFront/` and the shared `src/views/KrClinicalFocus/`
  components and generated reference data.
- Persists optional HPO context in session storage under
  `krClinicalFocus.v1` so it follows navigation among the three PB pages.
- Does not run the Context API automatically. Match Score remains an explicit
  user action.
- Resets the Front search subject when the search type changes.
- Provides `Reset all` in the Confirm panel. It resets the Front search mode,
  input, confirmation/review state, and session HPO context.
- Changes the Search panel and Set button to the confirmed-state color after a
  successful Set action; editing or resetting the subject removes that state.
- Keeps Review disabled until the current subject is explicitly Set.
- Routes PB Gene variant links with both `query` and `gene`.
- For a direct variant that maps to multiple genes, PB Variant displays an
  explicit gene chooser. It never reuses a prior gene silently. Selecting a
  gene reloads live evidence and writes `gene` into the URL.

## Data and Service Boundaries

- PB Gene and PB Variant continue to use the existing private BioIndex helper,
  private query flag, proxy, and continuation handling.
- Carrier counts consume all continuation pages and deduplicate `sample_id`.
- Fixture data is design-only and is not a fallback for live PB pages.
- Unsupported values stay `Unavailable` or `Not calculated`.
- Different-gene co-carriers remain `Not calculated` without an approved
  source contract.
- No backend service, BioIndex index, shared BioIndex module, or Context API
  implementation is changed by `d105d5db`.

For page-specific contracts, also read:

- `docs/pb_gene_production_integration_handoff.md`
- `docs/pb_gene_context_api_guide.md`
- `docs/pb_gene_context_api_review_checklist.md`
- `docs/bch_pb_variant_tier1_acceptance_note_20260801.md`
- `docs/pb_variant_engineering_integration_handoff.md`

## Primary Files

| Path | Merge responsibility |
|---|---|
| `vue.config.js` | Registers `pbFront`; preserves existing BCH configuration and private proxies |
| `src/views/KrFront/` | PB Front page, workflow state, and styles |
| `src/views/KrClinicalFocus/` | Shared HPO context editor, session store, comparison helpers, and generated references |
| `src/views/PbGene/` | Home/Variant navigation and shared-context presentation deltas |
| `src/views/PbVariant/` | Home/Gene navigation, shared context, and multi-gene selection |
| `scripts/test_pb_front_search_state.js` | Front reset and confirmation-state regression check |
| `scripts/test_pb_clinical_context_integration.js` | Cross-page integration and UI contract check |
| `scripts/test_pb_front_clinical_context_reference.js` | Generated clinical reference integrity check |

Do not replace `vue.config.js`, the PB Gene adapter, or shared private BioIndex
helpers with files from another checkout. Review the branch diff and retain the
target environment's authentication and deployment configuration.

## Required Verification

Run from the repository root:

```bash
node scripts/test_pb_front_search_state.js
node scripts/test_pb_clinical_context_integration.js
node scripts/test_pb_front_clinical_context_reference.js
node scripts/test_pb_variant_carrier_statistics.js
node scripts/test_pb_variant_identifiers.js
git diff --check
npm run build
```

The build is expected to pass with the repository's pre-existing
`locuszoom`/`tabix-reader` warning.

For local live-data verification:

```bash
BIOINDEX_HOST_PRIVATE=http://100.80.30.199:5000 \
NODE_OPTIONS=--openssl-legacy-provider \
./node_modules/.bin/vue-cli-service serve --port 8095 --host 127.0.0.1
```

Do not infer a shared-server deployment from this local command. Configure
private service hosts through the target deployment environment.

## Browser Acceptance

1. Open `/pb_Front.html` and confirm `Reset all` is in the right side of the
   Confirm header.
2. Set a Gene or Variant subject. Confirm the Search panel and Set button show
   the completed state and Review becomes enabled.
3. Change the search type. Confirm the prior subject, confirmation, and status
   are cleared.
4. Add `HP:0001250`, navigate to PB Gene or PB Variant, and confirm the term
   remains visible as session context without automatically running a score.
5. Return Home and select `Reset all`. Confirm both the search workflow and
   session HPO context are cleared.
6. Search `chr1:167822129:C:CT` directly from PB Front. Confirm PB Variant asks
   for `ADCY10` or `RP1-313L4` instead of showing a multiple-gene error.
7. Select `ADCY10`. Confirm the URL contains `gene=ADCY10` and live variant
   evidence loads.
8. Open a variant from PB Gene. Confirm the PB Variant URL already contains
   the selected gene context.

## Merge Checklist

- [ ] Fetch `kyuryung/bch-prototype` and verify that `d105d5db` is present.
- [ ] Review the complete branch diff through the team's pull-request process.
- [ ] Confirm the three page entries and filenames retain their exact casing.
- [ ] Run every required verification command above.
- [ ] Complete the browser acceptance flow against the intended test
      environment.
- [ ] Confirm no fixture fallback, partial Context mean, or synthetic metadata
      was introduced.
- [ ] Confirm no unreviewed backend, BioIndex, `master`, or shared branch
      changes are included.
- [ ] Merge only after the target environment owner approves routing,
      authentication, and private-service configuration.

## Delivery State

Immediately before this documentation commit, `d105d5db` existed locally on
`kyuryung/bch-prototype` and the branch was one commit ahead of
`origin/kyuryung/bch-prototype`. Committing this handoff adds a second local
commit. Verify the live branch state; it must be pushed before another engineer
can fetch or merge these commits.
