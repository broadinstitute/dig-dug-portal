# BCH PB Variant Tier 1 Acceptance Note

Date: 2026-08-01
Branch: `kyuryung/bch-prototype`
Base HEAD: `7ccbd62a`
Pages: `/pb_variant.html`, `/pb_Gene.html`
Audience: reviewer validating the approved PB Variant mockup migration and its live-data boundaries

Engineer integration guide: `docs/pb_variant_engineering_integration_handoff.md`

## Executive Summary

PB Variant Tier 1 is accepted in the BCH prototype worktree.

The approved `pb_variant` frontend was added as a new page. It does not replace the existing `pb_Gene` implementation. The later approved PB Gene UI changes were merged incrementally while preserving the BCH branch's `vue.config.js`, shared BioIndex helper, private-query fourth argument, and existing Context API proxy.

The page uses live private BioIndex data without a fixture fallback. Large `gene-samples` and `gene-variants2` results consume every continuation page, and carrier counts use distinct sample IDs rather than response-row counts. Fields that are not supplied by the connected source remain `Unavailable` or `Not calculated`; these labels do not assert that the underlying source data is absent.

## What Was Added Or Updated

| Surface | Decision |
|---|---|
| `src/views/PbVariant/` | Added the approved PB Variant UI, interactions, page model, identifier mapping, carrier filters, carrier statistics, and same-gene co-variant calculations. |
| `vue.config.js` | Added the `pbVariant` page entry and private BioIndex browser proxy/cache-key support without replacing the BCH configuration. |
| Existing `src/views/PbGene/` | Preserved and incrementally updated with the approved collapsed HPO Context, RefSeq identity, visible-window units, 5-row evidence pagination, and PB Variant links. |
| `src/utils/bioIndexUtils.js` and `src/modules/bioIndex.js` | Preserved unchanged. Existing continuation and authentication behavior is reused. |
| Identifier references and tests | Added the minimal PB Variant rsID reference/build script and focused carrier-statistics and identifier checks. PB Gene RefSeq/MANE generated identifiers were refreshed from the approved mockup artifact. |

## Connected Live Fields

| Display or calculation | Connected source and rule | Status |
|---|---|---|
| Exact variant identity | `transcript-consequences` queried privately by canonical GRCh38 variant ID. | Connected |
| Gene context | `gene`, `gene-samples`, and `gene-variants2` through the existing PB Gene adapter. | Connected |
| Exact-variant carriers | All `gene-samples` continuations; exact normalized variant match; distinct `sample_id`. | Connected |
| Genotype | Matching live `gene-samples` carrier row. | Connected when present |
| CRDC AF | Live variant/carrier annotation field exposed through the PB Gene adapter. | Connected when present |
| Consequence and HGVS | Live `gene-samples` / `gene-variants2` plus matching `transcript-consequences`. | Connected when present |
| gnomAD AF | Existing live annotation field; external gnomAD link is derived from the canonical variant ID. | Connected when present |
| LoFTEE, AlphaMissense, REVEL | Existing live BioIndex annotation fields. | Connected when present |
| Same-gene co-variants | Intersection of distinct carrier sets across the complete gene-level carrier result. | Connected and frontend-derived |
| Mean carrier GRS | Per-carrier sum of distinct same-gene Burden Pathogenic Scores; LoFTEE HC then AlphaMissense, with REVEL-only rows excluded. A mean is shown only with complete selected-carrier coverage. | Connected and frontend-derived |
| PB Gene reference annotation | Existing generated HGNC/NCBI IDs, DDG2P, PanelApp, Reactome/WikiPathways, and exon references. | Connected reference DB |
| rsID lookup | Small generated GRCh38 reference currently includes the validated ADCY10 mapping. Transcript rows may also supply dbSNP identifiers. | Partially connected |

## Fields Not Yet Connected

These are source-contract gaps, not zero values and not proof of missing underlying data.

| Field or feature | Current display | Required source contract |
|---|---|---|
| CRDC cohort denominator | `Unavailable` | Approved cohort/sample table or aggregate endpoint returning the cohort version and distinct eligible sample count. |
| Age, sex, affected, proband, investigator/cohort | `Unavailable`; filters disabled | Authorized sample metadata table/index joined by `sample_id`, with field definitions and data version. |
| Carrier HPO categories and terms | `Unavailable`; phenotype filter disabled | Authorized sample-HPO endpoint/table with OBO version and category hierarchy. |
| GenDx detail | `Unavailable` | Authorized diagnosis/GenDx sample join with controlled display fields. |
| Mean residual PheRS / Match Score | `Unavailable` until the user runs a connected Context API | Same-origin `POST /phenotype-analyzer-api/analyze`; exact-variant aggregate must include all unique carriers and reject partial scored coverage. `PHENOTYPE_ANALYZER_HOST_PRIVATE` was not set during this acceptance run. |
| Different-gene co-carriers | `Not calculated` until an approved source is connected | Preferred first request: optional `co_carrier_genes: string[]` on existing private `gene-samples` rows. Use aggregate-only `POST /api/carrier-set/co-carrier-genes` only for filtered recalculation or when sample-level cross-gene delivery is not approved. |
| General rsID-to-GRCh38 resolution | Clear validation error outside the small local reference | Expanded approved reference DB or a Direct API that returns canonical variant ID, gene, assembly, and provenance. |
| Reference fields not in the existing generated assets | `Unavailable` | Versioned reference DB or narrowly scoped Direct API. Do not substitute web lookups or fixture values at runtime. |

The preferred BioIndex field extension and the conditional aggregate fallback are maintained in Obsidian at `Projects/dig-dug-portal/PB Variant Small API Request Cards 2026-07-31.md`. An empty array means the approved source was evaluated and found no other gene; a missing or null field means the source is not connected and must remain `Not calculated`.

## Continuation And Count Contract

The page must be checked against full continuation output, never a first response page or `/api/bio/count`.

| Live check | Accepted result |
|---|---|
| `chr5:150205284:A:T`, `SLC6A7` | 200 exact-variant carriers; 2,522 distinct gene carriers; 122 observed variants; three carrier rows initially; same-gene co-variants rendered. |
| `chr1:167845562:CT:C`, `ADCY10` | 3 exact-variant carriers; all three carrier rows rendered; Mean carrier GRS `1.000`; rsID and transcript identifiers rendered. |
| `chr1:167809958:C:A`, `ADCY10` | 125 exact-variant carriers; three initial carrier rows; `+3 more (122 remaining)`; same-gene co-variants rendered. |

## PB Gene Incremental Acceptance

The pre-existing PB Gene page remains the same implementation lineage and now includes the later approved changes:

- `Variant search` opens `/pb_variant.html`.
- HPO Context is collapsed by default.
- gene carriers are explicitly distinct people; locus positions, variants, and distinct people are separate units.
- annotation coverage is labeled `scored / observed`, not pathogenic variant count.
- variant evidence shows five rows initially and expands by five.
- clicking a variant row expands evidence in place; the explicit `Variant ↗` link opens PB Variant.
- RefSeq/MANE identity is shown when present.

## Verification

| Check | Result |
|---|---|
| `node scripts/test_pb_variant_carrier_statistics.js` | `PB_VARIANT_CARRIER_STATISTICS_PASS` |
| `node scripts/test_pb_variant_identifiers.js` | `PB_VARIANT_IDENTIFIERS_PASS` |
| `git diff --check` | Passed |
| `npm run build` | Passed; only the pre-existing `locuszoom` / `tabix-reader` warning remained. |
| Browser: SLC6A7 PB Variant | Passed live counts, three-row carrier table, unavailable fields, same-gene calculation, and different-gene `Not calculated`. |
| Browser: ADCY10 PB Variant | Passed 3-carrier and 125-carrier cases, GRS, pagination, transcript identity, and unavailable-field handling. |
| Browser: PB Gene | Passed collapsed HPO Context, RefSeq, count labels, five-row evidence, in-place expansion, and `Variant ↗`. |
| Browser console | 0 errors and 0 warnings after the verified PB Gene interaction. |

## Final Decision

PB Variant Tier 1 and the related PB Gene incremental UI update are accepted for this worktree. The fixture remains design-only and is not part of the live page path. No shared `bch-aggregator` branch, backend service, shared BioIndex module, or deployment state was modified.

Future source work should be added only when an approved reference DB, sample/cohort table, Direct API, Context API, or aggregate endpoint satisfies the contracts above.
