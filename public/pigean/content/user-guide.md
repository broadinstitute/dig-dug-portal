# Explore PIGEAN results

## Choose a model and phenotype

Open the [Explorer](#explorer), choose **CFDE v2**, **Small**, or **Large**, then search for a phenotype by its name, BioIndex key, portal identifier, or ontology term (for example, `MONDO:0005148`). Choose a suggestion or enter an exact phenotype key, such as `T2D`. Select **Explore** to load the published gene and gene-set scores.

The trait suggestions come from a versioned discovery catalog; absence from suggestions does not establish that a trait is absent from the source. Small and large queries use sigma 2. Each displayed result identifies its model and phenotype.

HPO traits are excluded from phenotype selection and cross-trait results. HPO ontology links attached to other phenotypes remain available.

## Phenotype names and ontology mappings

The Explorer uses the versioned **DIG portal phenotype data model** to show readable names, portal IDs, trait groups, and linked ontology terms. Each result has ontology badges and an expandable **Phenotype details** section. The same metadata appears for both results in Compare and in gene/gene-set sheets. Cross-trait plots and tables show phenotype names alongside the original query keys; their filter also accepts portal IDs and ontology terms.

Open **Phenotype details** to inspect each mapping’s label, relation, source confidence, justification, and provenance. Exact matches, broader matches, and cross-references are displayed separately. For example, the T2D mapping to an EFO glycemic-measurement parent is marked as a broader match, not an exact synonym. The data-model version and downloadable metadata record identify the snapshot being used.

BioIndex queries keep their original identifiers. The metadata lookup accepts recorded PIGEAN aliases, unique embedded Orphanet IDs, and unique GWAS Catalog identifiers differing only in hyphens. When an alias is used, the details section shows the metadata identifier and how it matched. An ambiguous or unresolved identifier keeps its original key; the portal does not guess a disease name from a fuzzy match.

## Read the decomposition

The scatter shows indirect support (`prior`) on the horizontal axis and direct support (`log_bf`) on the vertical axis. Each point is a gene. Move over a point for its identifier and scores, or select it to open its details. Use the searchable gene table for keyboard access to the same details.

The gene table sits below the scatter, with gene sets on the right. On narrow screens, the panels stack. Gene search filters the table while keeping the other genes visible in the scatter for context. The Explorer starts with **minimum direct support ≥ 0** and **minimum combined support ≥ 1**, with no minimum on indirect support. These defaults reduce the genes rendered in the scatter and table. Adjust the controls or clear a field to remove that threshold; **Reset filters** restores the defaults. Threshold changes use the cached source records and do not change the underlying PIGEAN model. Combined support (`combined`) is also available in the table. Source scores are not posterior probabilities.

## Inspect genes and gene sets

Select a point, gene, or gene set to open its **details sheet** on the right. It shows scores, source metadata, related genes or gene sets in the current phenotype, and the same identifier **across traits**. Select a related identifier to continue exploring in the sheet. A gene-set source/library and a factor label describe different things and are displayed separately.

Scatter colors show **combined support** on the same Viridis scale as the original PIGEAN portal: purple for lower values, through blue and green, to yellow for higher values. The legend shows the range among plotted genes; it updates when score filters change. Genes with unavailable combined support appear gray.

Selecting a gene set enlarges and outlines its returned genes in the scatter, retaining their support colors while other points fade. Its genes are marked in purple in the gene table. Select **Only genes in selected set** to narrow the table. Selecting an individual gene adds an orange outline and label in the scatter and marks its table row in orange, while retaining the selected set as context. Close the sheet with the close button, Escape, or the backdrop to inspect the highlights. Select the gene or set name above the plot to reopen its details, or **Clear selection** to remove all highlights.

Highlights use BioIndex’s gene-set records for the selected **model and phenotype**. The status line reports how many genes were returned and how many have both scores within the current plot filters. These records may be a subset of a gene set’s full membership; they do not provide annotation weights. An empty response means no genes were returned for that query. A failed request displays an error and retry action. The portal never substitutes relationships from another model.

## Compare two results

Switch to **Compare**, choose a model and phenotype for A and B, and select **Compare results**. Gene and gene-set tables show scores, score differences and ranks within the retrieved results. You can filter to common rows or rows available on one side.

Agreement statistics use common identifiers with finite scores. Pearson measures linear score agreement and Spearman measures rank agreement, with average ranks for ties. A value is unavailable when there are too few observations or no score variation. These ranks describe the retrieved source records; they are not claimed to be ranks over an unfiltered original run.

Changing models also changes the annotation collection and potentially the result population. “A only” or “B only” means absent from the other returned dataset, not a zero score or proof of no relationship.

## Share a selection

Use **Copy link** to share the current model, phenotype, view and selected gene and gene set, including whether the details sheet is open. A saved URL restores that selection without a separate gene or gene-set page. Browser back and forward restore previous selections.

## If data cannot be loaded

Check the model and exact phenotype key, then retry. Network or source failures are reported separately from empty results. Partial or restricted responses are not silently treated as complete data.

The **Saved T2D example** uses the supplied CFDE capture from September 15, 2026. It is explicitly labeled as a snapshot and is useful when the live service is unavailable. It contains the captured T2D genes and gene sets; cross-trait and membership browsing require the live source.

## Run PIGEAN yourself

This portal explores published results; it does not run statistical inference. See the versioned [PIGEAN command-line guide](https://github.com/flannick/pigean/blob/c1d98bd5fe38b49dde324d5186ecf97c2584216f/docs/PIGEAN_CLI_REFERENCE.md) for the software project, or use your local PIGEAN installation and its `docs/PIGEAN_CLI_REFERENCE.md` manual.
