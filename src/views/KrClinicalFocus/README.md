# Clinical Context Mock Contract

Clinical Context is a global comparison context, not a search mode and not a separate page.

The current mock stores context state in `sessionStorage` under `krClinicalFocus.v1` so it persists while navigating between `krFront.html`, `sample.html`, `krPhenotype.html`, and `krVariant_V3.html`.


## Two-input interpretation model

The UI should be read as:

```text
result = compare(search subject, clinical context)
```

- The search subject determines which page opens and which primary data are shown.
- The clinical context is optional and changes the interpretation layer, not the existence of the result.
- With a context set, the page should explicitly show `Clinical context × Search subject` before the context-aware interpretation.
- Without a context, the same page stays in discovery mode and suggests contexts worth checking.
- This mock does not yet re-rank backend data by context; it only shows how the context-aware interpretation layer should appear.

## Current UI behavior

- No context set: the portal keeps normal search behavior and shows suggested contexts worth checking.
- Context set: each result page adds a compact card comparing the current search result against the active context.
- Phenotype search can become the active context through `Use this phenotype search as context`.

## Mock context sources

- Orphanet
- OMIM
- BCH sample ID
- Investigator
- Manual HPO
- Current phenotype query

All mock context sources resolve to an editable HPO-term list before comparison.

## Future API needs

- HPO support API backed by `hp.json` for autocomplete, labels, synonyms, alternative IDs, obsolete term handling, ancestor/descendant traversal, and broad phenotype grouping.
- Disease-to-HPO profile resolver backed by HPO disease annotation data such as `phenotype.hpoa`.
- Orphanet disease profile resolver.
- OMIM disease metadata and gene mapping using files such as `mimTitles.txt`, `mim2gene.txt`, `genemap2.txt`, and `morbidmap.txt`.
- OMIM disease-to-HPO profiles should not be derived from OMIM metadata files alone.
- BCH sample-to-HPO profile resolver.
- Investigator cohort phenotype-signature resolver.
- Context comparison API for sample, phenotype query, variant carrier profile, and gene carrier profile.
- Context suggestion API for exploratory mode.

## Score language

Suggestions must not be presented as diagnoses. Use cautious language such as:

- worth checking
- possible context
- may help interpret this result
- matches several features of
