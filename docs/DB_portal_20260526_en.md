# CRDC Rare Disease Portal DB Guide

Date: 2026-05-26  
Repository: this `dig-dug-portal` repository

This document explains how the CRDC rare disease portal database should be understood and rebuilt. It is written for a new developer or analyst who does not already know the project.

The most important point is that the **test DB is not the main product**. The core reusable asset is the **sample-free reference database**. CRDC sample metadata, sample HPO terms, and variant calls are attached on top of that reference database to create a portal-ready database.

---

## 1. Intended DB Layout

The portal DB has two layers:

```text
Layer 1. Shared reference DB
  HPO ontology
  MONDO ontology
  disease-HPO profiles
  disease-gene links
  gene-HPO annotations
  DDG2P
  PanelApp
  Reactome / WikiPathways

Layer 2. CRDC cohort DB
  sample metadata
  sample HPO profiles
  sample variants derived from VCF/annotation
  same-variant recurrence
  same-gene recurrence
  carrier phenotype summaries
  sample/disease/gene/variant evidence summaries
```

The portal UI should always keep these evidence types conceptually separate:

```text
CRDC internal evidence
  sample HPO profile
  phenotype overlap
  same-variant recurrence
  same-gene recurrence
  carrier phenotype overlap
  cohort/investigator phenotype affinity

Core rare disease reference
  HPO
  Orphanet / Orphapacket
  OMIM / HPOA
  MONDO mapping
  DDG2P

Secondary annotation
  PanelApp
  Reactome
  WikiPathways
```

PanelApp and pathway annotations are supporting annotations. They should not be used as hard filters that hide CRDC recurrent candidates.

---

## 2. Shared Reference DB Location

The shared sample-free reference DB should live inside the portal repository:

```text
data/reference_db/
```

The combined reference RDS is:

```text
data/reference_db/crdc_reference_db_tables.rds
```

This is the path that new users should use when building a CRDC portal DB from sample information and VCF-derived variant information.

### Current Reference DB Files

The repository currently contains table-level RDS/TSV files under:

```text
data/reference_db/
```

Important files include:

```text
crdc_reference_db_tables.rds
hpo_term.rds / hpo_term.tsv
hpo_edge.rds / hpo_edge.tsv
hpo_ancestor.rds / hpo_ancestor.tsv
mondo_term.rds / mondo_term.tsv
mondo_xref.rds / mondo_xref.tsv
disease.rds / disease.tsv
disease_hpo_weight.rds / disease_hpo_weight.tsv
disease_gene_weight.rds / disease_gene_weight.tsv
hpo_gene_annotation.rds / hpo_gene_annotation.tsv
hpo_gene_disease.rds / hpo_gene_disease.tsv
ddg2p_gene_summary.rds / ddg2p_gene_summary.tsv
panelapp_gene_summary.rds / panelapp_gene_summary.tsv
gene_pathway_summary.rds / gene_pathway_summary.tsv
gene_annotation_summary.rds / gene_annotation_summary.tsv
reference_source_manifest.rds / reference_source_manifest.tsv
```

Because this folder is now inside the repository, it can be shared with other users through Git as long as the files remain tracked and are not ignored.

---

## 3. What Is in the Reference DB?

The reference DB contains no CRDC sample IDs and no individual-level phenotype or genotype calls. It is a reusable annotation database.

### 3.1 Source Manifest

Table:

```text
reference_source_manifest
```

Columns:

| Column | Meaning |
|---|---|
| `source` | Reference source name |
| `file_path` | Original local source file used during build |
| `file_exists` | Whether the source file existed at build time |

Current sources include:

```text
HPO ontology
Mondo ontology
HPOA disease phenotype
HPO genes_to_phenotype
HPO genes_to_disease
Orphapacket disease HPO
Orphapacket disease gene
Orphapacket disease name
DDG2P xlsx
DDG2P txt
PanelApp
Reactome
WikiPathways
```

The manifest is useful for provenance. The `file_path` values may point to the original builder's machine and should not be assumed to work on every user's computer.

### 3.2 HPO Ontology Tables

Tables:

```text
hpo_term
hpo_edge
hpo_ancestor
hpo_frequency_score_map
```

| Table | Columns | Purpose |
|---|---|---|
| `hpo_term` | `hpo_id`, `hpo_name`, `is_obsolete` | Convert HPO IDs to readable names |
| `hpo_edge` | `hpo_id`, `parent_hpo_id` | Direct HPO parent-child graph |
| `hpo_ancestor` | `hpo_id`, `ancestor_hpo_id`, `distance` | Ancestor relationships for hierarchy-aware grouping |
| `hpo_frequency_score_map` | `frequency_code`, `frequency_label`, `midpoint_pct`, `alpha`, `beta`, `frequency_score` | Optional frequency-based weighting |

How this is used:

- Convert `HP:0001263` into `Developmental delay`.
- Map sample/query/carrier HPO terms into broad root categories.
- Identify related HPO terms through the hierarchy.
- Separate exact query terms from broader or related terms.

Root category mapping normally uses HPO children of `Phenotypic abnormality [HP:0000118]`.

### 3.3 MONDO and Disease ID Mapping

Tables:

```text
mondo_term
mondo_xref
mondo_edge
disease_id_map
disease
```

| Table | Columns | Purpose |
|---|---|---|
| `mondo_term` | `mondo_id`, `mondo_name`, `mondo_definition`, `is_obsolete` | MONDO disease ontology |
| `mondo_xref` | `mondo_id`, `xref_curie`, `xref_prefix`, `mapping_source` | Cross-reference MONDO with OMIM, Orphanet, etc. |
| `mondo_edge` | `mondo_id`, `parent_mondo_id` | MONDO hierarchy |
| `disease_id_map` | `source`, `source_disease_id`, `mondo_id`, `mapping_type`, `mapping_source` | Normalize source-specific disease IDs |
| `disease` | `disease_id`, `disease_name`, `disease_source` | Portal disease entities |

How this is used:

- Normalize disease names and IDs across Orphanet, OMIM/HPOA, MONDO, and other sources.
- Display disease profile candidates with a source.
- Avoid treating separate source IDs as unrelated if they map to the same disease concept.

### 3.4 Disease-HPO and Disease-Gene Profiles

Tables:

```text
disease_hpo_weight
disease_gene_weight
hpo_disease_phenotype_annotation
hpo_disease_phenotype_positive
```

| Table | Columns | Purpose |
|---|---|---|
| `disease_hpo_weight` | `disease_id`, `hpo_id`, `hpo_weight`, `evidence_source` | Disease-HPO profile used for profile matching |
| `disease_gene_weight` | `disease_id`, `gene_symbol`, `gene_weight`, `evidence_source` | Disease-gene reference links |
| `hpo_disease_phenotype_annotation` | `source_disease_id`, `disease_source`, `disease_name`, `hpo_id`, `qualifier`, `is_negated`, `frequency`, `evidence_source`, etc. | Raw disease phenotype annotations |
| `hpo_disease_phenotype_positive` | Same as above | Positive disease-HPO annotations after excluding negated annotations |

How this is used:

- Compare a sample HPO profile against disease HPO profiles.
- Compare a searched phenotype profile against disease HPO profiles.
- Show matched disease HPO term count and total disease HPO term count.
- Link disease candidates to possible gene candidates.

Important UI rule:

Disease profile matching is **reference evidence**, not a diagnosis.

### 3.5 Gene-HPO and Gene-Disease Annotation

Tables:

```text
hpo_gene_annotation
hpo_gene_disease
gene
gene_annotation_summary
```

| Table | Columns | Purpose |
|---|---|---|
| `hpo_gene_annotation` | `ncbi_gene_id`, `gene_symbol`, `hpo_id`, `hpo_name`, `frequency`, `source_disease_id`, `evidence_source` | Gene-HPO phenotype annotation |
| `hpo_gene_disease` | `ncbi_gene_id`, `gene_symbol`, `association_type`, `source_disease_id`, `source`, `evidence_source` | Gene-disease links |
| `gene` | `gene_symbol` | Gene universe |
| `gene_annotation_summary` | Gene-level annotation counts and flags | Collapsed gene annotation summary |

Important `gene_annotation_summary` fields:

| Column | Meaning |
|---|---|
| `orpha_disease_count`, `orpha_disease_ids` | Orphapacket/Orphanet disease support |
| `hpo_annotation_count`, `hpo_terms` | HPO gene-phenotype support |
| `hpo_gene_disease_count`, `hpo_gene_disease_ids` | HPO gene-disease support |
| `ddg2p_disease_count`, `ddg2p_*` | DDG2P support |
| `has_panelapp_green_support`, `green_panel_count`, `panel_names` | PanelApp support |
| `pathway_count`, `reactome_count`, `wikipathways_count`, `pathway_names` | Reactome/WikiPathways annotation |
| `has_core_rare_disease_reference` | Core rare disease reference support |
| `has_secondary_panelapp_green` | Secondary PanelApp support |
| `has_secondary_pathway_annotation` | Secondary pathway support |

### 3.6 DDG2P, PanelApp, Reactome, WikiPathways

Tables:

```text
ddg2p_gene_disease
ddg2p_gene_disease_hpo
ddg2p_gene_summary
panelapp_gene_summary
panelapp_gene_panel
panelapp_gene_moi
panelapp_gene_phenotype
pathway
pathway_gene
gene_pathway_summary
```

Use:

- DDG2P supports rare disease gene interpretation.
- PanelApp supports panel membership and Green status.
- Reactome/WikiPathways support functional annotation.

UI rule:

These are annotations, not filters. A CRDC recurrent candidate should not be hidden just because it lacks PanelApp or pathway annotation.

---

## 4. Attaching CRDC Sample Information

To build a portal DB from the shared reference DB, the user needs sample-level CRDC inputs.

### 4.1 Required Sample Metadata Input

Expected file:

```text
sample_info.tsv
```

Minimum required columns:

| Column | Meaning |
|---|---|
| `sample_id` | Sample identifier used by portal |
| `gender` | Sex/gender display |
| `role` | Role, such as proband |
| `affected` | Raw affected status |
| `birth_year` | Used to calculate age |
| `investigator` | Used as cohort/investigator group |
| `Diagnosed` | GenDx/diagnosis status flag |
| `Proband` | Proband flag |
| `WES` | Sequencing metadata |
| `Anc` | Ancestry metadata |
| `fam_id` | Family ID |

The build script derives:

| Derived column | How it is created |
|---|---|
| `stable_sample_id` | Currently copied from `sample_id` |
| `cohort_id` | Currently copied from `investigator` |
| `affected_flag` | Boolean from `affected` |
| `diagnosed_flag` | Boolean from `Diagnosed` |
| `proband_flag` | Boolean from `Proband` |
| `birth_year_num` | Integer version of `birth_year` |
| `age_at_analysis` | `ANALYSIS_YEAR - birth_year_num` |
| `age_band` | Age bin derived from `age_at_analysis` |

Current age-band logic in the test build:

```text
0
1-5
6-11
12-17
18+
```

If the UI needs different bins, such as `0-4`, `5-12`, `13-18`, `19-30`, `30+`, the fixture export or backend API should remap the age values.

### 4.2 Required Sample-HPO Input

Expected file:

```text
sample_hpo.tsv
```

Two input shapes are supported.

#### Option A. Binary HPO matrix

```text
sample_id    HP:0000175    HP:0001263    HP:0001250
S001         1             1             0
S002         0             1             1
```

Columns named like `HP:0000000` or `HP.0000000` are detected as HPO columns.

#### Option B. HPO list

```text
sample_id    hpo_terms
S001         HP:0000175;HP:0001263
S002         HP:0001263;HP:0001250
```

Generated tables:

```text
sample_hpo
sample_hpo_propagated
sample_hpo_count
```

`sample_hpo` columns:

| Column | Meaning |
|---|---|
| `sample_id` | Sample key |
| `hpo_id` | HPO term attached to the sample |
| `hpo_source` | Input shape/source |
| `is_leaf` | Leaf flag when available |

`sample_hpo_count`:

| Column | Meaning |
|---|---|
| `sample_id` | Sample key |
| `sample_hpo_count` | Number of unique HPO terms |

### 4.3 HPO Propagation Choice

The current test build has:

```r
MATCH_USE_PROPAGATED_HPO <- FALSE
```

Meaning:

- The current test DB mainly uses the input HPO terms as provided.
- Ancestor propagation is not used as the primary matching layer.

If set to `TRUE`, the script uses `hpo_ancestor` to expand sample HPO terms to ancestors. This can increase broad overlaps, so the UI must clearly distinguish exact query terms from hierarchy-expanded terms.

---

## 5. Attaching VCF / Variant Information

The portal does not use raw VCF directly in the Vue UI. VCF must first be converted to an annotated sample-variant table.

Expected derived input:

```text
sample_variant.tsv
```

Minimum required columns:

| Column | Meaning |
|---|---|
| `sample_id` | Sample carrying the variant |
| `variant_id` | Variant key, usually `chrom:pos:ref:alt` |
| `gene_symbol` | Gene symbol |

Recommended annotation columns:

| Column | Meaning |
|---|---|
| `genotype` | GT from VCF |
| `depth` | DP or equivalent read depth |
| `cohort_AF` | Allele frequency in CRDC cohort, if available |
| `gnomad_exome_af` | gnomAD exome AF |
| `lof_class` | LoFTEE or LoF annotation |
| `alphamissense_score` | AlphaMissense score |
| `clinvar_clnsig` | ClinVar clinical significance |
| `revel_score` | REVEL score |
| `MANE`, `APPRIS`, `PICK` | Transcript selection fields |
| `AR_genotype_group` | Autosomal recessive genotype grouping if available |
| `Consequence`, `IMPACT`, `BIOTYPE` | VEP-style consequence annotation |

Supported aliases in the current build script:

| Standard column | Accepted aliases |
|---|---|
| `sample_id` | `SampleID` |
| `variant_id` | `Variant_ID`, `VARIANT_ID` |
| `ensembl_gene_id` | `gene_id` |
| `gene_symbol` | `GeneSymbol`, `SYMBOL` |
| `genotype` | `GT` |
| `depth` | `DP` |
| `gnomad_exome_af` | `gnomADe_AF` |
| `clinvar_clnsig` | `ClinVar_Sig`, `ClinVar_CLNSIG` |
| `lof_class` | `LoF` |
| `revel_score` | `REVEL` |
| `alphamissense_score` | `Alphamissense`, `am_pathogenicity` |

### 5.1 From VCF to `sample_variant.tsv`

A typical preprocessing flow should be:

```text
multi-sample VCF or per-sample VCF
  -> normalize variant representation
  -> annotate variants with VEP or equivalent
  -> add gene symbol and consequence
  -> add population AF / ClinVar / REVEL / AlphaMissense / LoFTEE if available
  -> filter or flag rare/damaging variants
  -> output sample_variant.tsv
```

The test DB currently uses a rare/damaging-enriched subset. That means `sample_variant` is not the full VCF. In UI wording, avoid implying that the portal is showing every variant unless the production pipeline actually provides every variant.

### 5.2 Generated Variant Tables

From `sample_variant.tsv`, the build creates:

```text
variant
sample_variant
variant_carrier
gene_carrier
same_variant_recurrence
same_gene_recurrence
carrier_context_fit_summary
sample_gene_variant_evidence_summary
gene_variant_evidence_summary
```

#### `variant`

One row per variant.

| Column | Meaning |
|---|---|
| `variant_id` | Variant key |
| `chrom`, `pos`, `ref`, `alt` | Parsed from `variant_id` |
| `gene_symbols` | Genes associated with the variant |

#### `variant_carrier`

One row per exact variant carrier sample.

| Column | Meaning |
|---|---|
| `sample_id` | Carrier sample |
| `variant_id` | Exact variant |
| `gene_symbol` | Gene |
| `genotype` | Genotype |
| `has_sample_metadata` | Whether sample metadata exists |
| `has_sample_hpo` | Whether sample HPO profile exists |
| `affected_flag` | Joined from sample metadata |
| `cohort_id` | Joined from sample metadata |

#### `gene_carrier`

One row per sample-gene carrier.

| Column | Meaning |
|---|---|
| `sample_id` | Carrier sample |
| `gene_symbol` | Gene |
| `has_sample_metadata` | Whether sample metadata exists |
| `has_sample_hpo` | Whether sample HPO profile exists |
| `affected_flag` | Joined from sample metadata |
| `cohort_id` | Joined from sample metadata |

Gene-level carrier tables must deduplicate by `sample_id`. If a sample carries multiple variants in the same gene, the sample should appear once in a gene-level carrier list, with a variant count if needed.

#### `same_variant_recurrence`

One row per exact variant and gene.

| Column | Meaning |
|---|---|
| `variant_id`, `gene_symbol` | Recurrence key |
| `carrier_count` | Number of exact variant carriers |
| `carrier_with_metadata_count` | Carriers with sample metadata |
| `carrier_with_hpo_count` | Carriers with HPO profile |
| `affected_carrier_count` | Affected carriers |
| `cohort_count` | Number of cohorts/investigators represented |
| `carrier_samples` | Example carrier sample IDs |

#### `same_gene_recurrence`

One row per gene.

| Column | Meaning |
|---|---|
| `gene_symbol` | Gene |
| `carrier_count` | Number of same-gene carriers |
| `carrier_with_metadata_count` | Carriers with sample metadata |
| `carrier_with_hpo_count` | Carriers with HPO profile |
| `affected_carrier_count` | Affected carriers |
| `cohort_count` | Number of cohorts/investigators represented |
| `carrier_samples` | Example carrier sample IDs |

---

## 6. Derived Portal Summary Tables

### 6.1 `cohort_phenotype_signature`

Input:

```text
sample_hpo + sample_cohort
```

Meaning:

For each cohort/investigator group, count how often each HPO term appears.

Columns:

| Column | Meaning |
|---|---|
| `cohort_id` | Cohort/investigator group |
| `hpo_id` | HPO term |
| `sample_count` | Samples in the cohort with this HPO |
| `cohort_n` | Total samples in the cohort |
| `hpo_frequency` | `sample_count / cohort_n` |
| `hpo_name` | HPO term name |

Used for:

- sample group affinity
- investigator-level evidence
- cohort phenotype signature display

### 6.2 `sample_to_cohort_phenotype_score`

Input:

```text
sample_hpo + cohort_phenotype_signature
```

Meaning:

Compare each sample's HPO profile with each cohort/investigator phenotype signature.

Columns:

| Column | Meaning |
|---|---|
| `sample_id` | Sample |
| `cohort_id` | Compared cohort |
| `shared_hpo_count` | Number of shared HPO terms |
| `cohort_weighted_overlap` | Sum of cohort frequencies for shared terms |
| `home_cohort_id` | Sample's original cohort |
| `is_home_cohort` | Whether compared cohort is the home cohort |
| `cohort_affinity_rank` | Rank of cohort match per sample |

Used for:

- sample page group affinity
- investigator-level evidence sections
- checking whether a sample resembles its original investigator group or another phenotype group

### 6.3 `sample_disease_profile_match_summary`

Input:

```text
sample_hpo or sample_hpo_propagated
disease_hpo_weight
disease
sample_hpo_count
```

Meaning:

Compare each sample HPO profile with external disease-HPO profiles.

Columns:

| Column | Meaning |
|---|---|
| `sample_id` | Sample |
| `disease_id` | Disease profile |
| `matched_hpo_count` | Shared HPO terms |
| `weighted_match_score` | Sum of disease HPO weights for matched terms |
| `matched_hpo_ids` | Matched HPO IDs |
| `disease_hpo_count` | Total HPO terms in disease profile |
| `disease_hpo_weight_sum` | Total disease HPO weight |
| `sample_hpo_count` | Total sample HPO terms |
| `disease_name` | Disease name |
| `disease_source` | Source |
| `disease_overlap_fraction` | `matched_hpo_count / disease_hpo_count` |
| `sample_overlap_fraction` | `matched_hpo_count / sample_hpo_count` |
| `disease_match_rank` | Rank within sample |

Used for:

- sample disease profile matches
- phenotype disease candidate overlays
- disease reference cards

### 6.4 `sample_page_summary`

Input:

```text
sample
sample_hpo_count
top disease profile match
top cohort affinity match
home cohort score
```

Meaning:

One row per sample for fast sample page rendering.

Columns include:

```text
sample_id
stable_sample_id
gender
role
affected_flag
diagnosed_flag
age_band
cohort_id
sample_hpo_count
top_disease_id
top_disease_name
top_disease_weighted_match_score
top_disease_matched_hpo_count
top_affinity_cohort_id
top_affinity_score
top_affinity_shared_hpo_count
top_affinity_is_home_cohort
home_cohort_score
home_cohort_shared_hpo_count
home_cohort_rank
```

Used for:

- sample header
- sample overview
- top disease profile reference
- group affinity summary

### 6.5 `carrier_context_fit_summary`

Input:

```text
sample_variant
gene_carrier
sample_hpo
```

Meaning:

For a sample-gene pair, check whether other carriers in the same gene share HPO terms with the searched sample.

Columns:

| Column | Meaning |
|---|---|
| `sample_id` | Searched sample |
| `gene_symbol` | Gene |
| `carrier_count_with_shared_hpo` | Same-gene carriers with HPO overlap |
| `shared_hpo_count` | Number of shared HPO terms |
| `carrier_samples` | Example carriers |
| `shared_hpo_ids` | Shared HPO IDs |

Used for:

- sample gene/variant evidence
- carrier phenotype overlap evidence

### 6.6 `sample_gene_variant_evidence_summary`

Input:

```text
sample_variant
same_variant_recurrence
same_gene_recurrence
carrier_context_fit_summary
gene_annotation_summary
```

Meaning:

One row per sample-gene pair, combining:

- variants observed in the searched sample
- same-variant recurrence
- same-gene recurrence
- carrier phenotype overlap
- external rare disease reference
- secondary PanelApp/pathway annotation

Important columns:

| Column | Meaning |
|---|---|
| `sample_id`, `gene_symbol` | Sample-gene key |
| `variant_count` | Number of variants in this gene for this sample |
| `best_variant_id` | Highest-priority variant |
| `best_revel`, `best_alphamissense` | Variant severity scores |
| `clinvar_terms` | ClinVar terms |
| `max_variant_carrier_count` | Maximum exact variant recurrence |
| `recurrent_variant_count` | Number of recurrent variants |
| `gene_carrier_count` | Same-gene carrier count |
| `affected_gene_carrier_count` | Affected same-gene carrier count |
| `carrier_count_with_shared_hpo` | Same-gene carriers with phenotype overlap |
| `shared_hpo_count`, `shared_hpo_ids` | Shared phenotype evidence |
| `orpha_disease_ids`, `hpo_terms`, `hpo_gene_disease_ids` | Core reference support |
| `has_core_rare_disease_reference` | Core reference flag |
| `has_panelapp_green_support` | PanelApp flag |
| `pathway_count`, `pathway_names` | Pathway annotation |
| `has_same_variant_recurrence` | Exact recurrence flag |
| `has_same_gene_recurrence` | Same-gene recurrence flag |
| `has_carrier_phenotype_overlap` | Carrier phenotype overlap flag |
| `candidate_label` | Candidate evidence class |

Candidate labels:

| `candidate_label` | Meaning |
|---|---|
| `external_and_crdc_supported` | Has core reference support and CRDC recurrence |
| `reference_supported_candidate` | Has reference support but no recurrence |
| `uncurated_recurrent_candidate` | Has CRDC recurrence and phenotype overlap without core reference support |
| `singleton_or_low_support` | Low support |
| `crdc_recurrent_without_phenotype_overlap` | Recurrence without phenotype overlap |

`uncurated_recurrent_candidate` is important discovery evidence and should be preserved.

---

## 7. How the DB Supports the Four Portal Pages

## 7.1 `krFront.html`

Purpose:

Search entry point and context management.

DB usage:

The front page does not need to load the full DB. It mainly routes users to result pages.

Expected inputs:

| Search mode | User input | Target page |
|---|---|---|
| Sample search | `sample_id` | `krSample.html?sample_id=...` |
| Variant/gene search | `variant_id` or `gene_symbol` | `krVariant.html?query=...` |
| Phenotype search | HPO term list | `krPhenotype.html?query=...` |

Reference DB role:

- Context source options can use HPO, Orphanet, OMIM, MONDO, DECIPHER-style sources if available.
- Active context is an HPO profile. It should be stored as HPO terms, not as a genotype similarity object.

## 7.2 `krSample.html`

Purpose:

Explain one searched sample and connect it to similar patients, disease profile references, and recurrent gene/variant evidence.

Main DB sources:

| UI section | DB tables |
|---|---|
| Sample header | `sample_page_summary`, `sample` |
| Sample overview | `sample_page_summary`, `sample_hpo_count` |
| Phenotype profile | `sample_hpo`, `hpo_term`, `hpo_edge`, `hpo_ancestor` |
| GenDx / diagnosed status | `sample.diagnosed_flag`, future GenDx-specific table if available |
| Similar samples | `sample_hpo` overlap or future PheRS result table |
| Similar by genotype | `same_variant_recurrence`, `same_gene_recurrence`, `variant_carrier`, `gene_carrier` |
| Disease profile matches | `sample_disease_profile_match_summary` |
| Gene / variant evidence | `sample_gene_variant_evidence_summary`, `sample_variant` |

Important display rules:

- `Disease profile matches` should be described as external reference evidence, not diagnosis.
- `Similarity to searched sample` and `match to active context` should be separate.
- Same-gene recurrence and same-variant recurrence should be separate evidence rows.
- PanelApp/pathway should appear as badges or annotation, not as priority filters.

## 7.3 `krPhenotype.html`

Purpose:

Use a searched HPO profile to find matching CRDC samples, recurring phenotypes, disease profile references, and candidate genes/variants.

Main DB sources:

| UI section | DB tables |
|---|---|
| Query phenotype profile | user HPO terms + `hpo_term` |
| Matched samples | `sample_hpo`, `sample`, `sample_page_summary`, or future PheRS result table |
| Co-observed phenotypes | matched sample set + `sample_hpo` |
| Disease profile candidates | `disease_hpo_weight`, `disease`, possibly aggregated through matched samples |
| Gene candidates | `hpo_gene_annotation`, `disease_gene_weight`, matched sample `sample_variant` |
| Candidate variant overlay | matched sample `sample_variant`, `same_variant_recurrence`, `same_gene_recurrence` |

Current mock/test behavior:

- The current fixture uses exact HPO overlap for matched samples.
- Runtime PheRS/profile scoring is not implemented in the frontend.
- If a production PheRS table is added, it should become the primary matched sample source.

Recommended future PheRS output table:

```text
phenotype_query_id
sample_id
query_hpo_count
matched_exact_hpo_count
matched_related_hpo_count
weighted_profile_score
expected_score_for_hpo_burden
burden_corrected_residual
residual_percentile
matched_hpo_ids
related_hpo_ids
```

## 7.4 `krVariant.html`

Purpose:

Explain a queried variant or gene through carrier recurrence, carrier phenotype profile, disease/gene annotation, and active HPO context overlap.

Main DB sources:

| UI section | DB tables |
|---|---|
| Variant/gene header | `sample_variant`, `variant` |
| Exact carrier count | `variant_carrier`, `same_variant_recurrence` |
| Gene-level carrier count | `gene_carrier`, `same_gene_recurrence` |
| Carrier demographic summary | carrier sample IDs + `sample` |
| Carrier sample list | `variant_carrier` or `gene_carrier` + `sample` |
| Carrier phenotype profile | carrier sample IDs + `sample_hpo`, `hpo_term`, `hpo_edge`, `hpo_ancestor` |
| Disease/gene support | `gene_annotation_summary`, `disease_gene_weight`, `hpo_gene_annotation` |
| Context match | active HPO context vs carrier HPO profiles |

Important distinction:

| Mode | Meaning |
|---|---|
| Variant level | Samples carrying the exact queried variant |
| Gene level | Samples carrying any qualifying variant in the same gene |
| Nearby region | Variants near the queried locus, if implemented |

Active context rule:

The active context is HPO-based. For variants or genes, compare:

```text
active HPO context
  vs
carrier sample HPO profiles / carrier group HPO profile
```

Do not imply:

```text
active HPO context
  vs
variant directly
```

---

## 8. Mockup Fixture Export

The Vue mockup cannot read RDS files directly. To render DB-based values, export selected DB summaries to JS or JSON fixtures.

Current pattern:

```text
portal DB RDS
  -> R export script
  -> generated JS fixture
  -> mockData.js imports fixture
  -> createKr*State() overlays generated data on fallback mock state
  -> Template.vue renders page
```

Example generated fixture pattern:

```js
export function applyPortalSampleData(state) {
    return {
        ...state,
        ...portalSampleState,
        sample: {
            ...state.sample,
            ...portalSampleState.sample,
        },
    };
}
```

Important:

- Keep the existing large `mockData.js` fallback fixture when possible.
- Use generated data to override only DB-derived fields.
- If a field is missing from the generated fixture, fallback mock values may remain visible. This must be checked during UI validation.

---

## 9. Local Test DB Note

A local test DB can be generated from `data/reference_db/` plus local CRDC sample files. This output should be treated as a local build artifact, not as the shared reference DB.

One rendering-check test DB had the following row counts:

| Table | Rows |
|---|---:|
| `sample` | 350 |
| `sample_hpo` | 14,578 |
| `sample_page_summary` | 350 |
| `sample_variant` | 5,059 |
| `same_variant_recurrence` | 410 |
| `same_gene_recurrence` | 305 |
| `carrier_context_fit_summary` | 3,939 |
| `sample_gene_variant_evidence_summary` | 4,110 |

Current `candidate_label` distribution:

| candidate_label | Count |
|---|---:|
| `uncurated_recurrent_candidate` | 2,341 |
| `external_and_crdc_supported` | 1,598 |
| `singleton_or_low_support` | 103 |
| `reference_supported_candidate` | 68 |

This test DB is for mock rendering only. It is not the production backend and does not represent final PheRS/GRS calculations.

---

## 10. Practical Build Recipe for a New User

### Step 1. Use the shared reference DB

Use:

```text
data/reference_db/crdc_reference_db_tables.rds
```

Do not rebuild reference tables unless the reference sources changed.

### Step 2. Prepare CRDC sample files

Prepare:

```text
sample_info.tsv
sample_hpo.tsv
sample_variant.tsv
```

### Step 3. Convert VCF to `sample_variant.tsv`

The VCF-derived table must include at least:

```text
sample_id
variant_id
gene_symbol
```

Recommended:

```text
genotype
depth
gnomad_exome_af
clinvar_clnsig
lof_class
revel_score
alphamissense_score
Consequence
IMPACT
MANE
APPRIS
PICK
```

### Step 4. Build portal DB

Use the shared reference DB and attach CRDC files:

```text
reference DB
  + sample_info.tsv
  + sample_hpo.tsv
  + sample_variant.tsv
  -> portal DB tables
```

The build should output:

```text
sample
sample_hpo
sample_page_summary
sample_variant
same_variant_recurrence
same_gene_recurrence
carrier_context_fit_summary
sample_gene_variant_evidence_summary
```

### Step 5. Export mockup fixture

For Vue mockup review:

```text
portal DB RDS
  -> portalSampleData.generated.js
  -> portalPhenotypeData.generated.js
  -> portalVariantData.generated.js
```

Then check:

```text
http://localhost:8090/krFront.html
http://localhost:8090/krSample.html
http://localhost:8090/krPhenotype.html
http://localhost:8090/krVariant.html
```

---

## 11. Summary

The portal DB should be understood as:

```text
Shared reference DB
  = sample-free rare disease and annotation knowledge base

CRDC portal DB
  = shared reference DB
    + CRDC sample metadata
    + CRDC sample HPO profiles
    + VCF-derived sample variants
    + recurrence and phenotype-overlap summaries

Vue mockup fixture
  = exported page-shaped subset of the portal DB
```

The shared reference DB path for this repository is:

```text
data/reference_db/crdc_reference_db_tables.rds
```

That is the correct starting point for other users who want to build their own CRDC portal DB from sample information and VCF-derived variants.
