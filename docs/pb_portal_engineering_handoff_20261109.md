# PB portal engineering handoff — 2026-11-09

This handoff covers the Gene, Phenotype, Sample and Variant page changes on
`kyuryung/bch-prototype`. It describes the implemented local behavior and the
remaining production integration work. Pushing this branch does not deploy
the Python services or publish any private datasets.

## Routes and page changes

| Page | Route | Implemented changes |
|---|---|---|
| Gene | `/pb_gene2.html?query=GJB2` | Larger content fonts with compact table headers; visible demographics accordion and adjacent record count; selected-variant link beside its heading; working help tooltips; local phenotype-result links; scored-carrier coverage and individual carrier Z-scores; removal of Proband/GenDx carrier columns. |
| Phenotype | `/pb_phenotype.html?query=HP%3A0012714` | Larger typography; metadata loader repair restores ages and sex in ranked samples. |
| Sample | `/pb_sample.html?query={sample_id}` | Live metadata, HPO profile, similar samples, project summaries and processed variant calls; three separate profile tabs; compact identity card; actual project names; header filters and pagination. |
| Variant | `/pb_variant.html?query={variant_id}&gene={gene}` | Larger typography and wider carrier-table tracks so score/Affected headers do not overlap. |

The original `/pb_Gene.html` entry is retained. A lowercase `/pb_front.html`
alias is also registered for route compatibility. Sample IDs accept canonical
IDs and `_E38`/`_G38` VCF suffixes; canonical links strip either suffix.

## Gene context and carrier scores

`src/views/PbGene2/carrierScores.js` requests individual scores from the
existing private `POST /phenotype-analyzer-api/analyze` endpoint, including
`gene`, exact `variant_id`, entered HPO terms, score aggregation and affected
selection. The response must supply `variant_carrier_residuals.sample_rphers_z`
and matching `rphers_standardization` references. Gene, variant, HPO context
and reference identity are checked before displaying a score. A stale request
cannot replace results for a newer selection.

Display states are distinct: `no context`, loading, request error with retry,
numeric score, and `none*` after a successful response with no score for that
carrier. Missing score coverage must not be described as proof that the
patient lacks the queried phenotype. A variant mean uses scored analysis
carriers; its denominator need not equal the total BioIndex carrier count.
The Custom HPO table distinguishes total carriers from scored carriers.

Gene context result links open the local phenotype route using that result's
own HPO terms. They must not return to the old external `phenotypeResult.html`.
Question-mark help is a separate hover/focus button rather than part of the
sortable header button.

CRDC's current lowercase `af`, `ac`, and `an` fields are connected as **allele
frequency**, not carrier frequency. Zero AF is valid when AN is positive;
AN <= 0 is unavailable. If AF is absent, valid AC/AN can supply the value.
The variant evidence p-value remains raw; a new variant-wide FDR calculation
is not part of this change.

## Phenotype metadata repair

`scripts/pb_profile_metadata.py` requires `sample_id`, `age`, `sex` and
`affected` columns. If a TSV has the wrong schema, it can read the same-stem
XLSX only when exactly one worksheet has the required metadata headers.
Sparse cell positions are preserved. Empty datasets, duplicate sample IDs,
ambiguous workbooks and metadata with no matrix overlap fail explicitly.
The original TSV/XLSX files are not rewritten.

The local `HP:0012714` response was checked with 246 ranked samples: age and
known sex were present for all 246. The previously captured top five retained
their order, scores and standardization reference after the loader repair.

## Sample data contracts

### Metadata and observed HPO

`pbSampleBioIndexAdapter.js` queries the private `samples-info` index keyed
by `SampleInVCF`. An explicit suffixed key is matched exactly. A canonical
sample ID tries `_E38`, then `_G38`; both VCF key and canonical row ID must
match. It does not use the unbuilt `patient` index or substitute fixture data.

Observed HPO terms require `is_observed === true`; expanded ancestors are
not counted as direct observations. The frozen ontology already used by
PB Variant supplies grouping and primary-parent paths. Group lists show
five categories per page. Within an expanded group, recorded terms have
orange highlighting; additional ancestors provide hierarchy context only.
Those context nodes do not increase the sample's recorded term count.

The Phenotype composition/similarity panels use a 4:6 split. Multiple tied
dominant groups display on separate lines. The sample ID is capped at 32px;
metadata is larger, and the `BCH SAMPLE` eyebrow is removed. Project names
use `clean_name`/project aliases, matching the Gene page convention. The
current sample project label in the project summary is red.

### Private local analysis service

The Vue development proxy maps `/__pb_phenotype_profile__/...` to
`http://127.0.0.1:${PB_PHENOTYPE_PROFILE_PORT:-8093}/phenotype-analyzer-api/...`.
The two added endpoints below are served by `ProfileEngine` in profile-only
mode. Production must expose equivalent routes through the authenticated
private service; the local development bridge is not production authorization.

| Browser request | JSON request | Response contract |
|---|---|---|
| `POST /__pb_phenotype_profile__/sample-matches` | `{"sample_id":"<canonical ID>"}` | `sample_id`, `reference_hpo_count`, `reference_hpo_ids`, `eligible_sample_count`, `excluded_self_family_count`, `phenotypeMatches[]`, `projectPhenotypeSummary[]`, scoring/reference metadata. |
| `POST /__pb_phenotype_profile__/sample-variants` | `{"sample_id":"<canonical ID>"}` | `sample_id`, `rows[]`, `data_version`, `scope`, `genome_build`, `complete_genome:false`. |

Match rows provide rank, sample ID, matched term count, residual PheRS,
individual Z-score, project, age and sex. Project summary rows provide rank,
project name, median residual, Q1, Q3, IQR, n and `currentGroup`.

Similarity uses the reference sample's complete `hpo_terms_raw` set with the
existing `rphers_fast.score_samples` implementation. It does not truncate the
reference to ten terms. Candidates are HPO-annotated matrix samples excluding
self and BCH family-ID prefix matches. The metadata `family` field is a
relationship such as `index`/`mother`, not a family ID. Non-BCH IDs receive
self exclusion only unless a future explicit family mapping is added.
Results are ranked by residual PheRS; the top 50 are returned. Project
median/IQR/n use all eligible candidates, not just the returned top 50.
Project names use the primary cohort mapping. Missing projects remain
`Unavailable`; they are not replaced by investigator usernames.

### Processed variants and provenance

The local source is the existing private processed release:

```text
Server directory:
/lab-share/RC-Data-Science-e2/Groups/gnomad/kyuryung/ref/dig-dug-portal/bioindex_handoff_20260907/

File: sample_variant_gene.jsonl.gz
Data version: 2025_crdc_16366_dp20_af001_20260907
SHA-256: e602b847ccdba8961f788701b43004514346490f55164dd3023be23aa7c6bbc7
Build: GRCh38
Scope: processed nonsynonymous variants, DP >= 20, cohort AF < 0.01
```

This file and all sample metadata stay outside the repository. It is not a
complete genome-wide call set or a newly deployed sample-keyed BioIndex.
The local bridge streams the gzip and caches eight sample responses. For
production, materialize a private sample-keyed index rather than repeatedly
scanning the source. A sample with no source rows is shown as unavailable
coverage, not as a confirmed zero-variant genome.

`sampleEvidence.js` normalizes rows by gene + exact variant, rejects
conflicting GTs, preserves AF=0 and respects `score_source`. LoFTEE HC and
AlphaMissense scores render normally; REVEL-only is shown as `—*`, and
`No_score` with numeric zero remains missing annotation rather than score 0.
Unavailable transcript/family calls are not invented.

`SampleVariants.vue` displays a flat, paginated table rather than one accordion
per gene. Gene, Consequence, LoFTEE/AM, ClinVar and GT headers open searchable
multi-select menus with all/none and sorting controls. Variant search is in
the Variant header. Filters within one column use OR; different columns use
AND. Filters reset pagination to page 1. There is no separate upper Find
variant/Gene toolbar or `All classifications` button. ClinVar is orange text
with a transparent background. Popovers are attached to the body to avoid
clipping inside the horizontally scrollable table.

For the checked `BCH-22-11943-01` example: 53 reference HPO terms; 8,180
eligible candidates after four self/family exclusions; 50 ranked matches;
49 project groups with n summing to 8,180; 418 variant rows across 389 genes,
all with GT. These are release-specific verification counts, not UI constants.

## Local service configuration

Supply these settings to the local Vue process for automatic profile-service
startup. Use actual approved private paths; the examples are placeholders:

```bash
export PB_PHENOTYPE_HPO_MATRIX=/private/data/parent_expanded_binary.tsv.gz
export PB_PHENOTYPE_METADATA=/private/data/confirmed_metadata.tsv
export PB_PHENOTYPE_COHORT_MAPPING=/private/data/cohort_mapping.csv
export PB_SAMPLE_VARIANT_SOURCE=/private/data/sample_variant_gene.jsonl.gz
export PB_PHENOTYPE_PROFILE_PORT=8093
export PB_PHENOTYPE_PYTHON=python3
```

The existing `BIOINDEX_HOST_PRIVATE`/browser proxy configuration must also
point to the approved private BioIndex. Gene context analysis is a separate
existing service and must remain configured for `/phenotype-analyzer-api`.
Do not redirect sample requests to the gene-context analyze payload schema.

The profile service may also be started explicitly from the repository root:

```bash
python3 -m scripts.pb_phenotype_profile_api \
  --hpo-matrix /private/data/parent_expanded_binary.tsv.gz \
  --metadata /private/data/confirmed_metadata.tsv \
  --cohort-mapping /private/data/cohort_mapping.csv \
  --sample-variant-source /private/data/sample_variant_gene.jsonl.gz \
  --host 127.0.0.1 --port 8093
```

## Remaining integration work

- Prioritized Findings has the six-Type selection and list/detail UI, but
  live classifier results are not wired. Type values must come from the
  supplied, versioned classifier output; they must not be inferred in Vue.
- Disease-specific residual/percentile comparisons, inheritance assessments,
  related-sample evidence and complete family genotype columns need their
  corresponding verified sources. Empty values must stay unavailable.
- The server tiering directory is being evaluated separately in the main
  workstream. Its audit script, private artifacts and draft conclusions are
  excluded from this page implementation commit.
- Variant-wide FDR and mean-carrier residual values in the Sample variant
  table are not newly calculated by this release.
- Exact visual parity with the synthetic screenshot and a full mobile
  screenshot audit are not claimed. Tests below validate code and data
  contracts; production authentication and source indexing remain deployment
  responsibilities.

## Validation commands

Pre-commit verification passed: the three Gene2/live-adapter Node checks,
eight Sample Node checks, 38 metadata/sample/UI Python tests, eight existing
API server tests, parsing of all four changed stylesheets and `git diff --check`.
The full multi-entry Vue build and fresh browser screenshot audit were not
rerun for this commit preparation.

Run from the repository root with project Node dependencies and a Python
environment containing NumPy/SciPy:

```bash
node scripts/test_pb_gene2.js
node scripts/test_pb_gene2_carrier_scores.js
node scripts/test_pb_live_metadata.js
node src/views/PbSample/sampleRecord.test.js
node src/views/PbSample/familyModel.test.js
node src/views/PbSample/tableSort.test.js
node src/views/PbSample/variantEvidence.test.js
node src/views/PbSample/prioritizedFindings.test.js
node src/views/PbSample/sampleEvidence.test.js
node src/views/PbSample/samplePhenotypeHierarchy.test.js
node src/views/PbSample/sampleVariants.test.js
python3 -m unittest scripts.test_pb_profile_metadata scripts.test_pb_sample_analysis scripts.test_pb_gene_context_ui scripts.test_pb_gene_context_api_server
git diff --check
```

The API tests bind local ephemeral ports. A restricted sandbox can block the
bind even when the implementation is correct; rerun those tests in an
environment that permits loopback sockets. The full multi-entry Vue build is
not a substitute for testing the private runtime service configuration.
