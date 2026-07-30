# pb_Gene Production Review Checklist

Status: reference UI and calculation implementation are ready; production
data wiring and owner sign-off remain.

The production reviewer should first compare the page with:

<http://127.0.0.1:8095/pb_Gene.html?query=DMD>

## Decisions Already Encoded

- [x] Extended and Burden Pathogenic Scores are separate.
- [x] REVEL never contributes to gene burden X.
- [x] Per-sample burden sums distinct carried variants without dosage weighting.
- [x] Match Score is the mean residual PheRS across unique carriers.
- [x] Huber RLM includes age, age-missingness, sex, and PC1-PC10.
- [x] Minimum positive-burden carrier count is 10.
- [x] Only ages 0-99 are valid; all other ages are Unknown and median-imputed.
- [x] Only Female/Male are retained; every other sex value is Unknown.
- [x] Unknown age/sex alone does not exclude a sample.
- [x] Portal v1 recommendation is MASS `summary.rlm(method="XtX")`-style SE
  with a clearly labeled two-sided normal-approximation P-value.

## Inputs the Team Must Provide

- [ ] Frozen analysis roster and canonical `sample_id`.
- [ ] Approved sample-by-HPO matrix and ontology/ancestor-expansion version.
- [ ] Complete carrier-variant evidence with all BioIndex continuations.
- [ ] Age and sex fields from approved metadata.
- [ ] Versioned cohort PCA algorithm/script and materialized PC1-PC10 output.
- [ ] Production private BioIndex and authenticated Context API configuration.

## Statistical and Data Sign-Off

- [ ] Phenotype owner confirms R/Python residual PheRS parity on frozen data.
- [ ] Statistical owner accepts the MASS-style approximate inference for v1,
  or supplies an exact alternative estimator and parity reference.
- [ ] Data owner confirms the production variant universe and upstream
  carrier/genotype QC, including hemizygous, multiallelic, no-call, and
  low-quality records.
- [ ] Team confirms that 10 means `count(X_i > 0)` for the gene burden test.
- [ ] Privacy owner decides whether variant Match Scores also require at least
  10 carriers. Current code does not suppress smaller variant means.
- [ ] Analysis owner defines the FDR family. A single-gene request has one test,
  so its BH-adjusted value equals its P-value.

## End-to-End Acceptance

- [ ] DMD count and sorting behavior match the running mockup.
- [ ] A small single-page gene and DMD both use complete carrier/variant sets.
- [ ] A frozen request reproduces selected variant means and gene beta/SE/P.
- [ ] Age 100, negative/non-numeric age, and non-Male/Female sex remain in the
  roster with documented Unknown encoding.
- [ ] The API rejects `min_carriers < 10`.
- [ ] Missing/non-finite PC values fail validation rather than dropping samples.
- [ ] Browser payloads and service logs contain no patient-level residuals,
  genotype rows, HPO profiles, or covariate matrices.
- [ ] Python tests and `npm run build` pass.

## Ownership Boundary

The frontend engineer owns routing, rendering, interaction, and response
mapping. The backend owner owns authentication, complete data joins, caching,
aggregate-only responses, and logs. Phenotype, statistical, data, and privacy
owners approve the corresponding unchecked items above; the frontend engineer
must not guess those policies.
