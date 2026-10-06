# PB Variant HPO Context and Co-gene Engineering Handoff

Updated: 2026-10-05
Branch: `kyuryung/bch-prototype`
Status: implemented and verified in the local prototype; deployment to the BCH test server remains separate.

This document covers the October 2026 PB Variant changes after the earlier PB Gene Context delivery. For the shared input and deployment setup, also read `docs/pb_gene_context_association_engineering_handoff.md` and `docs/pb_variant_engineering_integration_handoff.md`. Where the older document says `affected_only` applies only to the gene association, the current **PB Variant Context API request** supersedes that statement: it also selects samples for the exact-variant carrier mean, individual carrier scores, and binary-variant OLS.

## Local page and behavior

Open `http://127.0.0.1:8097/pb_variant.html?query=chr11%3A5227002%3AT%3AA&gene=HBB`. Without a query, the page starts with this example variant. `pb_variant.html` is the BCH prototype page, not the original project demo. The local Context API runs on `127.0.0.1:8092` behind the Vue same-origin `/phenotype-analyzer-api` proxy.

The HPO Context section opens by default. It reuses PB Gene's `HpoTermInput` and `resolveHpoTerms`: users can type a phenotype name or alias, choose an autocomplete suggestion, or enter `HP:nnnnnnn` directly. The selected HPOs and GRS `Max`/`Sum` and Samples `All`/`Affected only` are submitted together with **Go**. Defaults are `Max` and `All`. Changing the controls alone does not recalculate prior results.

If the Context API reports HPO terms absent from the approved cohort matrix, the Variant page retries with the remaining terms. It displays the omitted names and IDs and labels the result with the HPOs actually used. If no entered term is available, it shows an error and does not calculate.

The HPO result table shows the exact variant's Match Score (mean carrier residual PheRS), carrier coverage, binary-variant effect β, and p-value. The sample table shows each included carrier's individual `rPheRS`; excluded or unmatched samples show `Unavailable`. Variant pathogenic score is highlighted once in Variant identity: LoFTEE HC gives 1, otherwise AlphaMissense when available. It is not repeated in the sample table.

Carrier statistics uses the current selected target-variant carriers for phenotype, sample, and co-occurrence counts. Phenotypes use the parent–child HPO hierarchy and 11 items per numbered page; carrier samples and each co-occurrence table use 5 items per numbered page. Table headers sort the visible data. Filter selection updates immediately. These display filters do not refit the HPO Context regression.

Different-gene co-carriers has one shaded, fixed target-gene row followed by 5 paginated co-gene rows. Its columns are Gene, Carriers (`shared / selected target carriers (percent)`), β, p-value, and FDR. Other same-gene variants combines count and percentage in its Carriers cell and shows Variant Score and ClinVar. Section explanations are in `?` hover text; row-count copy was removed.

## Calculation contract

Residual PheRS is generated from the complete approved HPO matrix, then aligned to the analysis roster (`overlap_status=both`). Keep that full-cohort residualization even when the subsequent association selects affected samples. For a single exact variant, fit `residual PheRS ~ binary carrier (0/1) + age + age_missing + sex + PC1..PC10` across all selected analysis samples, including noncarriers. `Affected only` selects `affected=Y` before fitting and before calculating the carrier mean. The current Context API uses OLS without a GRM; the separate dense variant LMM script remains an offline reference.

GRS `Max`/`Sum` chooses `gene_score_max` or `gene_score_sum` for gene-score LM. For one binary variant this control does not change its 0/1 predictor. Gene LM includes age, age missingness, sex, platform, and PC1..PC10 as implemented in `scripts/gene_score_association.R`. The target gene and every co-gene use the **same** HPO outcome, GRS setting, and analysis sample setting. The server scans the approved gene-score source once per HPO/options combination and fits the full gene catalog, then selects the requested genes; it must not run a separate 10-million-row scan per co-gene.

Co-genes are the unique other genes in the **unfiltered** exact-variant carriers' private `samples-info` gene lists. The Benjamini–Hochberg function already in `scripts/context_api_fast.py` adjusts valid p-values across this fixed family: target gene plus all unfiltered co-genes. Rows without a valid association are excluded from `n_tests` and have unavailable FDR. Carrier table filters and pagination change overlap counts and which rows are visible, never the FDR family. This is a private exploratory analysis; the current prototype applies no minimum positive-score sample count to co-gene LM rows.

## Private API requests

```http
POST /phenotype-analyzer-api/analyze
Content-Type: application/json

{
  "gene": "HBB",
  "terms": "HP:0001250",
  "variant_id": "chr11:5227002:T:A",
  "score_type": "max",
  "affected_only": false,
  "advanced": {"significance_metric": "p_value", "significance_threshold": 0.05, "min_carriers": 10}
}
```

The private response supplies `variant_match_scores[variant_id]`, `variant_associations[variant_id]`, `gene_association`, and only this exact variant's carrier residuals in `variant_carrier_residuals`. Do not return the full residual PheRS vector, HPO matrix, covariate rows, or sample-level values on the public route.

```http
POST /phenotype-analyzer-api/co-gene-associations
Content-Type: application/json

{
  "gene": "HBB",
  "terms": "HP:0001250",
  "co_genes": ["HBA1", "HBA2"],
  "score_type": "max",
  "affected_only": false
}
```

The co-gene response includes `target_gene`, `query_hpo`, `model`, `score_type`, `affected_only`, `fdr_method: "BH"`, `n_requested`, `n_tests`, and `gene_associations` keyed by symbol. Each valid row has β, p-value, FDR, `n_samples`, and `n_positive`. The browser requires complete carrier gene lists before defining this family. The route accepts up to 25,000 co-gene symbols and a 512 KiB request body; keep it behind authenticated private access and the same-origin proxy. The current frontend retrieves `samples-info` per exact-variant carrier, so a production aggregate or batched source may be appropriate if per-sample latency is high; preserve the same complete gene-family definition.

## Verification and deployment boundary

Local HBB / `HP:0001250` with `Max · All` used 15,761 analysis samples and 118 modeled carriers (122 BioIndex carriers); the carrier mean displayed `-0.044`, variant β `-0.046`, and p-value `0.434`. With `Sum · Affected only`, it used 6,913 analysis samples and 55 modeled carriers; the carrier mean displayed `-0.024`, variant β `-0.109`, and p-value `0.381`. The co-gene endpoint returned HBB plus the full unfiltered family and adjusted 16,651 valid gene p-values in the All run and 16,577 in the Affected-only run. These are local verification values, not a release baseline.

`node scripts/test_pb_variant_carrier_statistics.js`, `node scripts/test_gene_hpo_context_search.js`, the Python Context/variant tests, the local HTTP API tests, a Vue development build, and browser checks passed. The build still emits the existing `locuszoom`/`tabix-reader` warning unrelated to these changes.

Production integration still requires the approved HPO matrix, analysis roster, covariates with `affected`, complete callable variant evidence, gene-score file, private BioIndex access, and an authenticated same-origin Context API route. A missing carrier row can represent genotype 0 only when upstream callability is established. The data files and sample-level residuals are not Git deliverables. No engineer message or BCH deployment was performed.
