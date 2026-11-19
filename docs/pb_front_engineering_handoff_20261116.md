# Front — implementation contract

Updated: 2026-11-16. Entries: `/pb_front.html`, `/pb_Front.html`, `/pb_front2.html`.

The current local start command is `npm run start:pb`. Use Front2 to verify gene routing to Gene2 and multi-HPO routing to Phenotype. [Local setup](pb_local_browser_setup.md).

**Reproduce the user's current prototype design and interactions exactly.** Follow the [five-page design fidelity requirement](pb_front_gene_variant_merge_handoff.md#required-design-fidelity--all-five-pages). Carry each Front template's own CSS, layout, typography, colors, spacing, input/dropdown states, icons, responsive behavior and Guide assets; preserve the existing differences between Front and Front2.

## Current search behavior

- Show phenotype suggestions only after the shared `/__pb_phenotype_profile__/hpo-counts` check confirms at least one CRDC sample. Filter before ranking/limiting. Zero/absent terms do not appear or become selectable. Service failure is not zero; offer retry.
- Validate selected and pasted terms at submission. Resolve names/aliases/labels to deduplicated HPO IDs. Keep invalid input visible with its error; do not silently drop a term or navigate.
- Valid multi-HPO queries open `/pb_phenotype.html?query=<encoded IDs>&match=all` (All/AND). An available set with an empty intersection remains a valid zero-result search.
- Preserve existing Gene/Variant routes and Front2's exclusion of Sample search.

## Carry and verify

Carry both `src/views/PbFront/Template.vue` and `PbFront2/Template.vue`, `PbFront/searchModel.js`, new `PbFront/phenotypeSearch.js`, their ontology/search imports, shared `src/utils/crdcHpoAvailability.js`, styles and Guide dependencies. Connect the count route through the private server adapter; private paths/ports are not frontend assets.

These search changes follow baseline `54cfec6e2` and are included in the commit containing this document. Include new `scripts/test_pb_front_phenotype_availability.js` and the updated Front search test. Front/Front2 routing and availability tests passed. Chrome verified unavailable input stays on Front; Seizure + Hypotonia opens All (AND), with 553 samples in the checked source. No target-server deployment is claimed.

Acceptance: compare each Front variant with the prototype at the same viewport/zoom; verify suggestion appearance, counts, keyboard selection, invalid paste, retry, and a valid multi-HPO AND search. Preserve all five pages' [source/API boundaries](pb_front_gene_variant_merge_handoff.md).
