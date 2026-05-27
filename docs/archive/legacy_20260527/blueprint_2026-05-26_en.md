# CRDC Rare Disease Portal Blueprint

Date: 2026-05-26  
Repository root: this `dig-dug-portal` repository

This blueprint describes the intended information architecture of the current four-page portal. It is not an API contract and not a status log. Its purpose is to define what each page is supposed to explain and how evidence should be organized.

---

## 1. Portal Goal

The CRDC rare disease portal is designed to help users explore rare disease cohort evidence from three entry points:

```text
sample ID
variant or gene
HPO phenotype profile
```

The portal should help users answer:

```text
What was searched?
What is the strongest CRDC internal evidence?
What phenotype group or carrier group is implicated?
What core rare disease reference supports it, if any?
What is only secondary annotation?
What should be inspected next?
```

---

## 2. Evidence Hierarchy

### 2.1 Primary CRDC Internal Evidence

This is the main evidence layer.

Examples:

```text
sample HPO profile
same-variant recurrence
same-gene recurrence
carrier HPO profile
phenotype overlap among matched samples
co-observed HPO terms
investigator/cohort phenotype affinity
active context overlap with HPO profiles
```

### 2.2 Core Rare Disease Reference

This layer helps interpret the CRDC signal.

Examples:

```text
HPO
Orphanet / Orphapacket
OMIM / HPOA
MONDO mapping
DDG2P
```

### 2.3 Secondary Annotation

This layer should not hide CRDC discovery evidence.

Examples:

```text
PanelApp
Reactome
WikiPathways
```

Display these as badges or secondary notes.

---

## 3. Current Main Pages

| Page | URL | Main purpose |
|---|---|---|
| Front | `/krFront.html` | Search entry point and HPO context setup |
| Sample | `/krSample.html` | Explain one searched sample and related cohort evidence |
| Phenotype | `/krPhenotype.html` | Explain a searched phenotype profile across CRDC samples and references |
| Variant | `/krVariant.html` | Explain exact variant or same-gene carrier evidence |

The pages are Vue CLI multipage entries in `vue.config.js`.

---

## 4. Shared Context Model

The active clinical context is an HPO phenotype profile.

Context can come from:

```text
manual HPO terms
Orphanet disease HPO profile
OMIM/HPOA disease profile
MONDO-mapped disease profile
DECIPHER/DDG2P-style reference
sample HPO profile
carrier HPO profile
selected carrier/sample phenotype terms
```

Context should be displayed globally, not duplicated inside page-specific headers.

Important rule:

```text
active context vs sample HPO profile       allowed
active context vs carrier HPO profile      allowed
active context vs disease HPO profile      allowed
active context vs variant itself           not allowed
```

---

## 5. Front Page Blueprint

Purpose:

Let users start the same cohort exploration workflow from different search subjects.

Required content:

```text
Search by sample
Search by variant/gene
Search by phenotype profile
Optional HPO context setup
Workflow explanation
Evidence layer explanation
```

The front page should communicate:

```text
CRDC internal evidence first
core rare disease references second
secondary annotations as badges
```

It should not look like three unrelated tools.

---

## 6. Sample Page Blueprint

Purpose:

Explain the searched sample and identify related patients, phenotype groups, disease profile references, genes, and variants.

Core question without context:

```text
What are this sample's phenotype and genotype characteristics, and where does it lie within the CRDC cohort?
```

Core question with active context:

```text
How well does this sample match the active HPO context, and which patients, groups, diseases, genes, or variants support that context?
```

Recommended sections:

1. Sample header
   - Sample ID
   - sex
   - age band
   - proband / affected status
   - GenDx status

2. Sample phenotype profile
   - total HPO count
   - root category composition
   - full HPO term list
   - active context overlap if context exists

3. Sample genotype / GenDx profile
   - rare coding genes
   - candidate variants
   - GenDx status
   - diagnostic gene/variant if available

4. Similar patients / groups
   - similar samples by phenotype
   - 0-1 normalized phenotype profile similarity
   - phenotype-defined groups
   - investigator/cohort affinity

5. Disease profile matches
   - sample HPO vs external disease-HPO profile
   - reference evidence only, not diagnosis

6. Gene / variant evidence
   - same variant recurrence
   - same gene recurrence
   - carrier phenotype overlap
   - core rare disease reference
   - secondary annotation badges

Column distinction:

```text
Similarity to searched sample
  = another sample vs searched sample

Match to active context
  = another sample or carrier HPO profile vs active HPO context
```

Do not merge these.

---

## 7. Phenotype Page Blueprint

Purpose:

Use a searched HPO profile to find matching CRDC samples, recurring phenotypes, disease profiles, genes, and variants.

Core question without context:

```text
Which patients, groups, diseases, genes, and variants are associated with this searched phenotype profile?
```

Core question with active context:

```text
How does the searched phenotype profile relate to the active HPO context, and which evidence is supported by both?
```

Recommended sections:

1. Query phenotype profile
   - searched HPO terms
   - matched CRDC sample count
   - cohort-level summary
   - age/sex/proband distribution if available

2. Reference-derived candidates
   - disease profile candidates
   - gene candidates
   - CRDC variant overlay
   - external references and CRDC evidence kept separate

3. CRDC cohort evidence
   - matched samples
   - co-observed phenotypes
   - investigator-level evidence
   - annotation-burden check if available

Important:

Co-observed phenotypes belong to CRDC cohort evidence, not external disease references.

---

## 8. Variant Page Blueprint

Purpose:

Explain a queried variant or gene, its carrier set, phenotype profile, recurrence, group pattern, and reference annotation.

Core question without context:

```text
Who carries this variant or gene, and what phenotype, recurrence, disease, and group patterns are observed among carriers?
```

Core question with active context:

```text
Do carriers of this variant or gene match the active HPO context, and which carrier phenotypes or groups support that match?
```

Recommended sections:

1. Variant/gene header
   - queried variant or gene
   - gene symbol
   - consequence
   - allele frequency / rarity
   - ClinVar/pathogenicity if available
   - GenDx support if available

2. Carrier count summary
   - exact variant carriers
   - same-gene carriers
   - affected carriers
   - proband carriers
   - diagnosed carriers
   - age/sex distribution

3. Queried variant window
   - locus track
   - disease/gene track where available
   - per-position carrier count

4. Carrier phenotype profile
   - frequent HPO root categories
   - frequent carrier HPO terms
   - context overlap if active

5. Carrier reference set
   - carrier sample list
   - GenDx status
   - phenotype match
   - context match if active

6. Gene / disease / annotation support
   - Orphanet/HPO/OMIM/DDG2P support
   - PanelApp/pathway badges

---

## 9. Data Backbone

The shared reference DB is:

```text
data/reference_db/crdc_reference_db_tables.rds
```

The portal DB is built by attaching:

```text
sample_info.tsv
sample_hpo.tsv
sample_variant.tsv derived from VCF annotation
```

to the reference DB.

The UI should not depend on private local paths. Any generated test DB should be treated as a local build artifact.

---

## 10. Design Rules

1. Keep the original portal visual style where possible.
2. Use compact tables and row-level evidence.
3. Avoid pill-heavy UI unless the element is a small status tag.
4. Use blue only for clickable values or expand triggers.
5. Avoid certainty language such as `likely causal`, `strong candidate`, or `diagnosis` unless referring to explicit GenDx status.
6. Keep `GenDx` casing exactly.
7. Keep CRDC internal evidence visually primary.
8. Keep PanelApp/pathways secondary.
