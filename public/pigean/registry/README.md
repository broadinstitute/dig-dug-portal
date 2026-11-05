# PIGEAN static registry

- `catalog.json` (schema 2): original BioIndex keys, readable phenotype names, portal IDs, ontology search terms, and explicit metadata matches. Model hints describe factor-key discovery, not complete result coverage.
- `phenotypes.json` (schema 1): the full DIG portal phenotype data model, lookup aliases, mapping assertions, and source provenance. Names and ontology links are independent of the selected PIGEAN result model.
- `cfde-t2d.json`: the explicitly labeled captured CFDE v2 T2D example. Scores are not synthesized from phenotype metadata.

The metadata source is `dig-portal-data-models/versions/phenotype/v0.0.1/portal_phenotypes_flat.tsv`, revision `dcdb13b9ed8e39007678d8b488dc3a7197f2096b`, SHA-256 `94808d5d4d8bae457c824ce87a7016270a5100f2a9cdf676f1f450fb7ffd002b`. All 8,402 phenotype records and 24,050 ontology mappings are retained, including the source relation, confidence, justification, and provenance.

Exact legacy and recorded PIGEAN identifiers take precedence. For the CFDE key format, the builder also resolves unique embedded Orphanet IDs (supported by an exact Orphanet mapping) and unique GWAS Catalog keys differing only in hyphens. Every non-identity match is recorded and exposed in the UI. Ambiguous aliases stay unresolved. Current coverage is 3,775 / 3,778 advertised CFDE factor keys. Unresolved keys are `Orphanet_331184`, `Orphanet_688571`, and `Orphanet_91024`.

Rebuild from local source files (from the repository root):

```bash
python3 scripts/build-pigean-registry.py \
  --cfde-source /Users/cyakaboski/src/research/reveal-mechanisms/data/cfde \
  --phenotypes /Users/cyakaboski/src/research/portal-data-models/versions/phenotype/v0.0.1/portal_phenotypes_flat.tsv \
  --phenotype-revision dcdb13b9ed8e39007678d8b488dc3a7197f2096b
python3 -m unittest discover -s scripts -p 'test_pigean_registry.py'
node --test scripts/test-pigean-portal.cjs
npm run build
```

Use the revision corresponding to the input file when updating the snapshot. Rebuilding does not refresh the upstream BioIndex captures. Serve the generated JSON files alongside the static HTML; no metadata server is required.

HPO traits are excluded from phenotype search and cross-trait results. Production cross-trait requests skip the `hpo` group; mixed responses also filter HPO keys. HPO ontology mappings belonging to other phenotypes remain in the metadata.
