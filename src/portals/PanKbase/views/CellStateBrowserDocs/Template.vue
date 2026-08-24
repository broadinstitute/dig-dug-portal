<template>
    <div class="pkb-wrapper f-col fill-height align-h-center">
        <pkb-header></pkb-header>

        <div class="pkb-body">
            <section class="cs-methods-doc" aria-label="Cell state and program explorer methods">
                <header class="method-card">
                    <h2>
                        Cell State &amp; Program Explorer methods
                    </h2>
                    <p class="lede">
                        The Cell State &amp; Program Explorer lets users investigate the expression of a gene within fine-grained structure inside tissue cell types: manually curated cell states and data-driven gene programs. All gene expression values and learned programs come from our <a href="/single-cell.html">integrated single-cell maps</a>.
                    </p>
                    <div class="callout warning" role="note">
                        <strong>Note:</strong> AI assistance was used for this documentation writeup, followed by manual review and editing.
                    </div>
                </header>
                <section class="method-card" id="cell-state-curation">
                    <h3>
                        Cell state curation
                    </h3>
                    <div class="callout" role="note">
                        <strong>Curated cell states reflect published biology</strong> They are initially AI curated and subsequently reviewed/approved by disease/tissue experts. The status of this review process is indicated on the card corresponding to the cell state.
                    </div>
                    <p>
                        We used AI assistance to curate known cell states for each tissue and parent cell type. Candidate cell states were identified through a conservative literature review of tissue-specific single-cell atlases, disease-focused studies, review articles, and accepted marker resources. We retained states only when they represented a well-established cell identity or subtype, a recognized functional program, or a broadly accepted biological process such as interferon response, ER stress, proliferation, inflammatory activation, matrix remodeling, or dedifferentiation-like identity loss.
                    </p>
                    <p>
                        Marker genes for each state were selected from the supporting literature and marker resources, prioritizing genes that were repeatedly used as positive markers, were reasonably specific to the state within the parent cell type, and were suitable for scoring in scRNA-seq data. We generally used compact marker panels of high-confidence genes, avoided broad housekeeping genes where possible, separated biological states from technical and QC signatures, and recorded provenance at the state and/or marker level.
                    </p>
                    <p>
                        Definitions, interpretation notes, marker genes, and citations for each state are available by clicking a cell state on the page. Curated cell states are progressively reviewed by disease and tissue experts; whether manual review has been completed is shown in the <em>Manual review</em> field on the cell state card.
                    </p>
                </section>
                <section class="method-card" id="liger-programs">
                    <h3>
                        Gene programs determined by LIGER
                    </h3>
                    <div class="callout" role="note">
                        <strong>Data-driven programs should be viewed as a discovery layer</strong> To aid their interpretation, they are compared to curated state markers, QC signatures, and genetic anchors.
                    </div>
                    <p>
                        We inferred gene programs for each tissue and cell type using LIGER. LIGER is an R package developed and maintained by the Macosko and Welch labs (Joshua D. Welch et al., <em>Single-Cell Multi-omic Integration Compares and Contrasts Features of Brain Cell Identity</em>, Cell, 177:1873-1887.e17, 2019, <a href="https://doi.org/10.1016/j.cell.2019.05.006">doi:10.1016/j.cell.2019.05.006</a>). We used version 2.2.1 of the <code>rliger</code> package to perform non-negative matrix factorization (NMF) across datasets within each integrated single-cell map.
                    </p>
                    <div class="method-grid">
                        <div class="mini-card">
                            <strong>Input per tissue cell type</strong> Raw RNA counts, dataset labels, and cell type metadata were translated into an h5ad file.
                        </div>
                        <div class="mini-card">
                            <strong>Cell sampling</strong> Up to 50,000 cells were randomly sampled for each tissue/cell-type factorization.
                        </div>
                        <div class="mini-card">
                            <strong>Program count</strong> The number of programs was chosen by maximizing correlation across ten random runs, bounded between 10 and 24 programs.
                        </div>
                    </div>
                    <p>
                        Cells expressing fewer than 200 genes, cells with total counts below 500, and cells with mitochondrial gene expression percentage above 5% were removed before LIGER model fitting. Genes were selected by variance, followed by normalization and scaling. The outputs include cell loadings, gene loadings, and top genes for each selected program.
                    </p>
                    <div class="callout warning" role="note">
                        <strong>Interpretation caveat.</strong> Cell and gene loading values are optimization quantities that minimize reconstruction loss of the RNA count matrix. They are useful for defining programs, but inferred expression values and downstream enrichment summaries are more interpretable for biology.
                    </div>
                    <div class="callout warning" role="note">
                        <strong>Gene program inferences are under development.</strong> We are continuously working on improving gene program inference. As new iterations are produced, old program definitions will be versioned and archived.
                    </div>
                </section>
                <section class="method-card" id="expression-calculation">
                    <h3>
                        Gene expression calculation for cell states and programs
                    </h3>
                    <p>
                        For each cell state or gene program, we calculated the degree to which each cell expressed the signature using AUCell rank-based scoring. AUCell measures whether the marker genes for a state or program are concentrated near the top of each cell's genome-wide expression ranking, so the score captures signature activity without forcing a cell into exactly one state or program.
                    </p>
                    <p>
                        Most score distributions were continuous, precluding hard cell assignment. We therefore used continuous, non-exclusive activity weights within each tissue and cell-type calibration group. Each AUCell score was converted to a within-signature percentile rank <code>r</code>, and two weights were computed:
                    </p>
                    <div class="equation">
                        gradient weight: w<sub>gradient,is</sub> = r<sub>is</sub><sup>2</sup>
                    </div>
                    <div class="equation">
                        high-tail weight: w<sub>tail,is</sub> = clip((r<sub>is</sub> - 0.90) / 0.10, 0, 1)
                    </div>
                    <p>
                        These weights are not normalized across states or programs, so a cell can contribute to multiple overlapping biological signals. For gene <code>g</code> and state or program <code>s</code>, weighted expression was computed as:
                    </p>
                    <div class="equation">
                        mean<sub>gs</sub> = sum<sub>i</sub> w<sub>is</sub> x<sub>ig</sub> / sum<sub>i</sub> w<sub>is</sub>
                    </div>
                    <p>
                        Absolute expression is reported in log-normalized CP10K units. When raw counts are available, cell-level expression is represented as counts per 10,000 transcripts, summarized with the state or program weights, and log transformed for display. Specificity is a stabilized log2 fold change against the corresponding parent cell-type or tissue background:
                    </p>
                    <div class="equation">
                        specificity<sub>gs</sub> = log2((mean<sub>gs</sub> + pseudocount) / (background<sub>g</sub> + pseudocount))
                    </div>
                    <p>
                        Positive specificity values indicate enrichment in the state or program relative to the background; negative values indicate depletion.
                    </p>
                    <div class="callout warning" role="note">
                        <strong>Interpretation caveat.</strong> This is an unpublished and under-development method for scoring gene expression in cell states and programs. Values should be considered hypothesis generating
                    </div>
                </section>
                <section class="method-card" id="state-program-matching">
                    <h3>
                        Cell state and gene program matching
                    </h3>
                    <p>
                        To determine overlap between curated states and data-driven programs, we computed two complementary metrics.
                    </p>
                    <div class="method-grid">
                        <div class="mini-card">
                            <strong>Cell-level coactivity</strong> Spearman correlation compares cell-level program activity with curated-state activity weights. This asks whether a program tends to be active in the same cells as a curated state.
                        </div>
                        <div class="mini-card">
                            <strong>Gene-level marker enrichment</strong> A preranked running-sum enrichment test asks whether curated state markers are concentrated among the top-loading genes of a program. Mann-Whitney/AUROC and top-gene overlap summaries are reported as supporting statistics.
                        </div>
                    </div>
                    <p>
                        Gene-level enrichment produces p-values and FDR-corrected q-values for marker overlap, whereas cell-level correlation measures coactivity across cells. A strong biological match is most convincing when both lines of evidence agree.
                    </p>
                    <div class="callout warning" role="note">
                        <strong>Interpretation caveat.</strong> The two definitions of overlap can differ, in some cases significantly, based on the degree to which the marker genes vs. cells overlap.
                    </div>
                </section>
                <section class="method-card" id="program-qc">
                    <h3>
                        QC of gene programs
                    </h3>
                    <div class="callout" role="note">
                        <strong>QC signatures are not biological states.</strong> They are used to flag programs that may reflect artifact, contamination, cell stress, or incompatible identity signal.
                    </div>
                    <p>
                        To determine whether inferred gene programs reflected known artifacts rather than coordinated biology, we curated 36 additional QC signatures spanning technical artifacts, dying-cell and processing stress, blood/platelet contamination, unexpected lineage identity, off-target cell-type identity, and tissue-specific ambient RNA.
                    </p>
                    <p>
                        These signatures include marker genes for mitochondrial transcripts, ribosomal/translation signal, apoptosis, hemoglobin/RBCs, platelets, heat-shock/dissociation response, immediate-early response, motile cilia, germline/meiotic genes, off-target immune/endothelial/epithelial/stromal/neural/adipocyte/hepatobiliary/pancreatic/muscle/kidney/tendon identities, and tissue ambient high-expression signals. Each QC signature includes a category, tier, source, gene count, and <code>exclude_when</code> interpretation rule in the GMT metadata.
                    </p>
                    <p>
                        We calculated enrichment of each inferred program against each QC signature using the same gene-set enrichment framework used to compare programs with curated biological states. Programs with QC enrichment passing <code>q &lt; 0.05</code> were considered likely QC/artifact-dominated and flagged as failing QC; programs with nominal <code>p &lt; 0.05</code> but not q-significant were treated with caution and reviewed alongside parent cell type, top loaded genes, and biological state matches.
                    </p>
                    <div class="callout warning" role="note">
                        <strong>Interpretation caveat.</strong> QC states are only used at present for post-hoc interpretation. We are actively developing procedures to use them to improve gene program inference.
                    </div>
                </section>
                <section class="method-card" id="human-genetics">
                    <h3>
                        Enrichment of states and programs for human genetic associations
                    </h3>
                    <p>
                        We used PIGEAN to calculate state/program to trait associations. We used precomputed PIGEAN results for all portal traits and fit a model to jointly predict gene-level PIGEAN scores for each trait from all states or programs within a cell type.
                    </p>
                    <div class="method-grid">
                        <div class="mini-card">
                            <strong>Joint beta</strong> Measures the predictive power of a state or program after controlling for other states or programs in the same cell type.
                        </div>
                        <div class="mini-card">
                            <strong>Beta uncorrected</strong> Measures the predictive power of each state or program in isolation.
                        </div>
                    </div>
                    <div class="callout" role="note">
                        <strong>Scale of effect sizes.</strong> Beta and beta uncorrected are in units of change in log Bayes Factor of the PIGEAN score. Values near 0.01 are treated as significant, values near 0.1 as strong, and values near 1 as very strong.
                    </div>
                    <div class="callout" role="note">
                        <strong>Joint vs. uncorrected</strong> Joint values capture the unique features of the state/program, but may not show expected enrichments due to correction for the effects of other states/programs. The marginal effects are measures of absolute enrichment.
                    </div>
                </section>
                <section class="method-card" id="pathway-enrichment">
                    <h3>
                        Enrichment of programs for curated gene sets and pathways
                    </h3>
                    <p>
                        We also used PIGEAN to calculate enrichment of programs for MSigDB curated gene sets. First, each program was converted to a probability-like gene membership score. For each gene program, gene loadings were transformed with <code>log1p (log(1+x))</code> and fit with a two-component mixture model representing low-loading background genes and high-loading gene program-member genes.
                    </p>
                    <div class="equation">
                        P<sub>member</sub>(g,k) = P(gene g belongs to the high-loading component for gene program k | loading<sub>gk</sub>)
                    </div>
                    <p>
                        The posterior probability of membership in the high-loading component was constrained to increase monotonically with the loading. If the mixture fit was unstable, a rank-calibrated fallback was used. Genes outside the LIGER factorization universe were treated as missing rather than as zero-loading genes.
                    </p>
                    <p>
                        We then fit a model to predict gene program membership probabilities jointly from all gene sets in the MSigDB c2 resource. Beta values measure joint coefficients and prioritize non-redundant enriched gene sets; beta uncorrected values measure marginal effects. Effect sizes are interpreted on the same scale as the trait associations.
                    </p>
                    <div class="callout warning" role="note">
                        <strong>Interpretation caveat.</strong> This is an unpublished and under-development method for assigning gene program membership probabilities. Therefore, enrichments should be viewed as hypothesis generating.
                    </div>
                </section>
            </section>
        </div>

        <pkb-footer></pkb-footer>
    </div>
</template>

<style scoped>
  .cs-methods-doc {
    color: #172033;
    font: 15px/1.6 system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
    max-width: 980px;
    margin: 0 auto;
  }
  .cs-methods-doc * { box-sizing: border-box; }
  .cs-methods-doc a { color: #2557d6; text-decoration-thickness: 0.08em; text-underline-offset: 0.18em; }
  .cs-methods-doc h2 {
    font-size: 1.75rem;
    line-height: 1.15;
    margin: 0 0 0.65rem;
    letter-spacing: -0.02em;
  }
  .cs-methods-doc h3 {
    border-top: 1px solid #e5e7ef;
    font-size: 1.1rem;
    margin: 1.8rem 0 0.65rem;
    padding-top: 1.15rem;
  }
  .cs-methods-doc p { margin: 0.65rem 0; }
  .cs-methods-doc .lede { color: #465160; font-size: 1.03rem; margin-bottom: 0.9rem; }
  .cs-methods-doc .method-card {
    background: #fff;
    border: 1px solid #e5e7ef;
    border-radius: 12px;
    margin: 1rem 0;
    padding: 1rem 1.15rem;
  }
  .cs-methods-doc .callout {
    border-left: 4px solid #2f5bea;
    background: #f5f7ff;
    margin: 1rem 0;
    padding: 0.85rem 1rem;
  }
  .cs-methods-doc .callout strong { color: #1f3f99; }
  .cs-methods-doc .callout.warning {
    background: #fff8ed;
    border-left-color: #c97916;
  }
  .cs-methods-doc .callout.warning strong { color: #8a4b0f; }
  .cs-methods-doc .method-grid {
    display: grid;
    gap: 0.75rem;
    grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
    margin: 0.9rem 0;
  }
  .cs-methods-doc .mini-card {
    background: #fbfcff;
    border: 1px solid #e8ebf3;
    border-radius: 10px;
    padding: 0.8rem 0.9rem;
  }
  .cs-methods-doc .mini-card strong { display: block; margin-bottom: 0.25rem; }
  .cs-methods-doc .equation {
    background: #f8fafc;
    border: 1px solid #e1e7ef;
    border-radius: 10px;
    color: #243044;
    font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", monospace;
    font-size: 0.92rem;
    margin: 0.85rem 0;
    overflow-x: auto;
    padding: 0.75rem 0.9rem;
    white-space: nowrap;
  }
  .cs-methods-doc .tag-row { display: flex; flex-wrap: wrap; gap: 0.45rem; margin: 0.75rem 0; }
  .cs-methods-doc .tag {
    background: #eef2ff;
    border: 1px solid #dbe4ff;
    border-radius: 999px;
    color: #2848a8;
    font-size: 0.82rem;
    font-weight: 650;
    padding: 0.25rem 0.55rem;
  }
</style>
