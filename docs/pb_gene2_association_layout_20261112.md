> Historical layout/data notes. For the final current screen, follow
> [Gene2 engineering handoff](pb_gene2_engineering_handoff_20261112.md).
> Later user changes supersede the early examples below.

첨부 이미지는 최종 레이아웃 참고입니다. 실제 구현에서는 이미지의 숫자·q의 em dash·페이지 수를 하드코딩하지 말고 실제 API 응답을 표시하세요. 설명문은 표 아래에 상시 노출하지 않고 관련 info icon에 연결하세요.

## Layout and live values

Reference images: the user's November 12 `02_01_10.png` and `02_01_03.png`
mockups. `Single-phenotype associations` uses a search field, P < 0.05 / gene-q
filter, left pin column, sortable effect/CI/P/q/carrier columns and five results
per page. Pins remain visible independently of search and pagination. The full
server response is retained; there is no top-15 truncation. The custom profile
form uses removable HPO chips, Apply, Advanced options and an applied result row.
Its GRS-positive sample count is the actual analysis response's n_positive value.

Variant information and phenotype-based evidence have separate header bands.
Consequence appears below the variant ID. The user explicitly chose three
separate carrier columns:

| Column | Definition |
|---|---|
| Total carriers | Distinct observed CRDC carriers of the variant |
| Carriers with HPO | Observed variant carriers with every applied profile term recorded; multiple terms use AND |
| Scored carriers | Analysis-roster carriers with a supplied individual rPheRS Z-score |

The HPO metadata count is independent of the All/Affected scoring roster and is
labelled partial when metadata coverage is incomplete. It is never inferred from
Z-score sign, nonzero GRS, mean Z, or the scored-carrier count. Missing HPO coverage
is Unavailable. Mean Z retains the existing complete-coverage requirement within
the analysis roster. A variant with two observed carriers and one analysis-eligible,
scored carrier can therefore have a mean; an analysis roster of two with only one
score cannot. The image's example counts are not copied.

The local support route `POST /__gene_variant_hpo_counts__` accepts
`{gene, variant_ids, hpo_terms}` and returns per-variant count, metadataCount,
carrierTotal and complete. It uses the same authorized private metadata cache and
bounded sample lookup pool as the existing summary endpoint. Only visible/pinned
variants are requested. The client keys requests by the applied profile and
rejects stale responses after a profile/gene/page change. The deployed BioIndex
and the earlier backend ZIP have not been modified by this local route addition.

## Units and info icons

Definitions are centralized in `src/views/PbGene2/evidenceHelp.js`:

- Precomputed β: approximate score-test HPO log-odds change per 0.1 Sum GRS.
- Precomputed 95% CI: approximate interval in those same log-odds units.
- q within gene: BH across the full PASS HPO family before delivery/UI filters.
- Custom Gene β: rPheRS SD change per 0.1 gene GRS.
- Settings: per-person/gene Max or Sum of ALT dosage × pathogenicity score.
- Variant β: carrier versus non-carrier rPheRS SD effect; heterozygous and
  homozygous ALT both count as carrier = 1.
- Mean carrier rPheRS Z: mean among analysis-eligible carriers, using the full
  scoring cohort's mean and sample SD for that HPO profile.

Buttons expose hover and keyboard focus tooltips; Escape dismisses them. Methods
and analysis warnings are available through the corresponding icon instead of
permanent explanatory paragraphs under the table.

## New source release

Source directory:
`/lab-share/RC-Data-Science-e2/Groups/gnomad/kyuryung/share/dig-dug-portal/single_gene_burden_with_HPO/gene_hpo_release_20261112/`

Runtime file: `browser_gene_hpo.jsonl.gz` (360,812,435 bytes).
SHA-256: `e2e032fe388e2d9b2d99e1fb539bb576a046f20df723e1cd91336e8b1a3f5bff`.
The transferred local file matches this checksum. It remains outside the repository
at `/private/tmp/pb-gene-hpo-p005-20261112/browser_gene_hpo.jsonl.gz`.
The development server is configured with that file and
`PB_GENE_HPO_RELEASE_ID=gene_hpo_release_20261112`.

Gene projection: qValue ← q_by_gene, qSignificant ← q_significant_by_gene,
nQSignificant ← n_q_significant_by_gene; nTestedHpos ← n_tested_hpos.
Phenotype projection retains q_by_hpo and its HPO-specific significance flag.
Legacy q_significant is never used as the Gene flag. A missing Gene q stays
missing rather than falling back to the HPO q. Server caches include source path,
size, modification time, release ID and mapping version. The frontend's tab cache
requires refreshing already-open tabs to load the new release.

Live GJB2 verification: 119 delivered P < 0.05 rows, 2,774 PASS HPO tests in the
pre-filter BH family, nine q_by_gene-significant rows and 24 display pages at five
rows per page. Every returned q and significance flag matched the source record.
The browser showed the first Gene q as 3.22e-4, rather than the old HPO q 3.47e-4.

## Validation

- Vue template/behavior tests and pagination across 119 rows passed.
- Gene-versus-HPO q projections, missing Gene q, negative effects and more than
  15 delivered results passed endpoint tests.
- Recorded HPO intersection, deduplicated metadata fetches, partial coverage,
  session isolation and input validation passed.
- Applied-profile request isolation, abort, stale response rejection and reset
  passed frontend tests.
- Existing individual Z-score and selected-demographics tests passed.
- The development build compiled; the existing locuszoom/tabix-reader warning
  remains unrelated to this layout change.

Browser verification captured the actual new q and 24-page pagination, the applied
Hearing abnormality profile, and distinct total/HPO/scored carrier counts. Console
inspection found no application rendering exception; the development sockjs client
reported an unload permissions-policy warning. Final visual QA remains documented
separately in design-qa.md because native browser control/screenshot capture became
unstable during the last capture. Do not treat build/test success as a completed
final visual review.

## Follow-up: simpler headings and margin information rail

The P/q selector is removed; all delivered P < 0.05 records remain searchable,
sortable and paginated. The q heading no longer repeats “within gene”; the full
Gene-wise definition remains in its information panel. Carriers with term shows
only its count (and partial indicator where needed); the shared coverage denominator
is available in that heading's information definition. The variant column and its
sort option are labelled In Silico Predictors; the underlying calculation is unchanged.

All Gene2 help buttons now use the same information icon. Section method information
is placed next to the title. `InfoRail.vue` replaces body-mounted Bootstrap tooltips
with one contextual panel in the page margin, aligned with the selected icon in the
shell's coordinate space. Hover/focus opens it, click keeps it open, and another click,
Escape, outside click or its close button closes it. If a desktop has insufficient
margin, the page reserves room for the rail; small screens reserve a flow gap after
the relevant card rather than covering another table.

The existing html zoom 0.8 remains: browser zoom 100% currently renders the page at
80% internally. There is no further automatic font shrinking. Coordinate tests cover
that CSS zoom, lower-page icons without upward relocation, left/right placement and
narrow-screen fallbacks. Tests also cover pin/unpin, Escape and outside-click closing.
Native browser AX confirmed the removed selector/subtitle/denominator and changed
predictor label. Final panel screenshot verification remains blocked by native
capture failure, recorded below in design-qa.md.
# Reference tooltip update — 2026-11-12

The user's clarification scopes this update to reference provenance, not the
statistical calculation definitions. The supplied Obsidian document's sections
9–10 contain the confirmed annotation source wording; section 11 retains the
association delivery/calculation record. Gene2 now uses those reference strings
and official source links for VEP, Consequence, ClinVar, AlphaMissense, REVEL,
LOFTEE and gnomAD, plus the current gene reference bundle. VEP 115.1/cache 115 is
kept distinct from plugin dataset versions. ClinVar 2025-08-24 is labelled a VCF
date, not a download date. No unsupported plugin release/download dates are added.
The existing statistical definitions remain unchanged. Chrome AX verified the
ClinVar provenance text and official link in the info panel. Gene2 templates,
carrier pagination and info-rail checks passed.
