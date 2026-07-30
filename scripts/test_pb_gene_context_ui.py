from pathlib import Path
import unittest


ROOT = Path(__file__).resolve().parents[1]
TEMPLATE = (ROOT / "src/views/PbGene/Template.vue").read_text()
GENE_IDENTITY = (ROOT / "src/views/PbGene/GeneIdentityPanel.vue").read_text()
HPO_CONTEXT = (ROOT / "src/views/PbGene/HpoContextPanel.vue").read_text()
MODEL = (ROOT / "src/views/PbGene/pageModel.js").read_text()
ADAPTER = (ROOT / "src/views/PbGene/pbGeneBioIndexAdapter.js").read_text()
STYLE = (ROOT / "src/views/PbGene/style.css").read_text()
VUE_CONFIG = (ROOT / "vue.config.js").read_text()
GENE_IDS = (ROOT / "src/views/PbGene/geneIdReference.generated.js").read_text()


class PbGeneContextUiTest(unittest.TestCase):
    def test_context_controls_and_accumulating_result_table_exist(self):
        for text in ("HPO context", "Go", "Advanced", "Beta (Effect Size)", "P-value"):
            self.assertIn(text, HPO_CONTEXT)
        self.assertIn("@submit.prevent=\"$emit('run')\"", HPO_CONTEXT)
        self.assertIn('@run="runContextAnalysis"', TEMPLATE)
        self.assertIn("contextRuns.push", MODEL)

    def test_context_links_valid_hpo_terms_to_the_temporary_phenotype_page(self):
        self.assertIn("http://100.80.30.199/phenotypeResult.html", MODEL)
        self.assertIn("externalPhenotypeResultUrl", HPO_CONTEXT)
        self.assertIn('target="_blank"', HPO_CONTEXT)
        self.assertIn('rel="noopener noreferrer"', HPO_CONTEXT)
        self.assertIn("encodeURIComponent(terms.join(\",\"))", MODEL)

    def test_advanced_contains_statistical_filter_controls(self):
        for text in ("P-value", "FDR", "Threshold", "Minimum carriers"):
            self.assertIn(text, HPO_CONTEXT)
        for field in ("contextSignificanceMetric", "contextSignificanceThreshold", "contextMinCarriers"):
            self.assertIn(field, MODEL)
        for field in ("significance_metric", "significance_threshold", "min_carriers"):
            self.assertIn(field, MODEL)
        self.assertIn("contextMinCarriers: 10", MODEL)
        self.assertIn('min="10"', HPO_CONTEXT)
        self.assertIn("at least 10", MODEL)

    def test_advanced_has_an_explicit_apply_and_run_submit(self):
        self.assertIn('class="pbg-context-advanced-apply"', HPO_CONTEXT)
        self.assertIn('type="submit"', HPO_CONTEXT)
        self.assertIn("Apply &amp; run", HPO_CONTEXT)

    def test_context_results_show_fdr_and_sort_lowest_first(self):
        self.assertIn("FDR ↑", HPO_CONTEXT)
        self.assertIn("{{ run.fdr }}", HPO_CONTEXT)
        self.assertIn("fdrSortValue", MODEL)
        self.assertIn("this.contextRuns.sort((a, b) => a.fdrSortValue - b.fdrSortValue)", MODEL)
        self.assertIn('if (value == null || value === "") return "—";', MODEL)

    def test_default_threshold_does_not_block_form_submission(self):
        self.assertIn('v-model.number="thresholdModel"', HPO_CONTEXT)
        self.assertIn('step="any"', HPO_CONTEXT)

    def test_score_labels_and_no_context_state_are_unambiguous(self):
        self.assertIn("Extended Pathogenic Score", TEMPLATE)
        self.assertIn("Match Score (Context-based)", TEMPLATE)
        self.assertIn("no context", TEMPLATE)
        self.assertNotIn("Variant score <em>", TEMPLATE)
        self.assertNotIn("Match score <em>", TEMPLATE)

    def test_gene_summary_counts_variants_with_pathogenicity_evidence(self):
        self.assertIn("Pathogenic variants in this gene", TEMPLATE)
        self.assertIn("pathogenicEvidenceVariantCount", TEMPLATE)
        self.assertIn('const labels = ["LOFTEE", "AlphaMissense", "REVEL"]', MODEL)
        self.assertNotIn("<em>Variants in this gene</em>", TEMPLATE)

    def test_table_score_excludes_revel_but_marks_revel_only_rows(self):
        self.assertIn("const score = this.extendedVariantScoreValue(row)", MODEL)
        self.assertIn("Burden Pathogenic Score", TEMPLATE)
        self.assertIn('class="pbg-revel-only-star"', TEMPLATE)
        self.assertIn("if (aRank !== bRank) return aRank - bRank", MODEL)
        self.assertIn("REVEL available; excluded from this score.", TEMPLATE)

    def test_variant_match_score_consumes_aggregate_api_result(self):
        self.assertIn("result.variant_match_scores", MODEL)
        self.assertIn("context.match_score", MODEL)
        self.assertIn("row.phenotypeMatchStatus", MODEL)
        self.assertNotIn("result.samples || result.top_matches", MODEL)
        self.assertNotIn("row.phenotype_match_score_resid", MODEL)

    def test_burden_diagnostics_are_retained_and_rendered(self):
        for field in (
            "status",
            "n_positive_burden",
            "min_carriers",
            "n_variants_scored",
            "n_variants_total",
            "interpretation_scope",
            "model_version",
            "formula",
            "burden_pathogenic_score_version",
        ):
            self.assertIn(f"burden.{field}", MODEL)
        self.assertIn("Status / score coverage", HPO_CONTEXT)
        self.assertIn("run.statusLabel", HPO_CONTEXT)
        self.assertIn("run.coverageLabel", HPO_CONTEXT)
        self.assertIn("run.modelLabel", HPO_CONTEXT)
        self.assertIn("<span>Note</span>", HPO_CONTEXT)
        self.assertIn("run.note", HPO_CONTEXT)
        self.assertIn("contextBurdenNote(burden)", MODEL)
        self.assertIn("Do not interpret or rely on this result.", MODEL)
        self.assertIn(".pbg-context-result-note--warning", STYLE)
        self.assertNotIn('return "Pending API"', MODEL)

    def test_local_context_fixture_is_explicit_and_dev_only(self):
        self.assertIn("PB_GENE_CONTEXT_FIXTURE_PATH", VUE_CONFIG)
        self.assertIn('app.get("/__pb_gene_context_fixture__"', VUE_CONFIG)
        self.assertIn("VUE_APP_PB_GENE_CONTEXT_FIXTURE", MODEL)
        self.assertIn('fetch("/__pb_gene_context_fixture__")', MODEL)
        self.assertIn("Local validation fixture", MODEL)
        self.assertIn("Local fixture supports only", MODEL)
        self.assertIn("run.sourceLabel", HPO_CONTEXT)

    def test_dev_context_route_defaults_to_the_local_reference_service(self):
        self.assertIn("phenotypeAnalyzerHostPrivate", VUE_CONFIG)
        self.assertIn('"http://127.0.0.1:8092"', VUE_CONFIG)
        self.assertIn('"/phenotype-analyzer-api"', VUE_CONFIG)

    def test_local_context_fixture_does_not_call_live_bioindex(self):
        start = MODEL.index("async loadLiveGeneData")
        block = MODEL[start:MODEL.index("// ── gene-level tab", start)]
        self.assertIn("if (LOCAL_CONTEXT_FIXTURE_ENABLED)", block)
        self.assertIn("window.location.assign", block)

    def test_panelapp_is_explained_as_diagnostic_evidence(self):
        self.assertIn(">PanelApp</td>", GENE_IDENTITY)
        self.assertNotIn("Diagnostic panels", GENE_IDENTITY)
        self.assertIn("Diagnostic-grade panels", GENE_IDENTITY)
        self.assertIn("Genomics England PanelApp", GENE_IDENTITY)
        self.assertIn("No diagnostic-grade panel association found", GENE_IDENTITY)
        self.assertNotIn("green panels", GENE_IDENTITY)

    def test_clinvar_uses_only_clinical_significance_fields(self):
        self.assertIn('["Clinical_sig", "clinical_sig", "ClinVar_CLNSIG", "clinvar_clnsig", "CLNSIG"]', ADAPTER)
        self.assertNotIn('["ClinVar_CLNSIG", "clinvar_clnsig", "clinvar", "classification"]', ADAPTER)
        self.assertIn('value: this.variantEvidenceValue(row, "ClinVar", "Unavailable")', MODEL)
        self.assertIn('href: this.variantEvidenceHref(row, "ClinVar")', MODEL)

    def test_crdc_frequency_is_labeled_as_carrier_frequency(self):
        self.assertIn("CRDC carrier frequency", TEMPLATE)
        self.assertIn('label: "CRDC carrier frequency"', MODEL)
        self.assertNotIn("CRDC AF", TEMPLATE)
        self.assertNotIn('label: "CRDC AF"', MODEL)

    def test_cohort_and_carrier_denominators_are_visible(self):
        self.assertIn("CRDC cohort", TEMPLATE)
        self.assertIn("Gene carriers", TEMPLATE)
        self.assertIn("crdcCohortCount", MODEL)
        self.assertIn("cohortRatio", TEMPLATE)
        self.assertIn("crdc_cohort_count", ADAPTER)

    def test_cohort_summary_is_subtle_right_aligned_text(self):
        start = STYLE.index(".pbg-cohort-strip {")
        end = STYLE.index("}", start)
        block = STYLE[start:end]
        self.assertIn("justify-content: flex-end", block)
        self.assertNotIn("background:", block)
        self.assertNotIn("border:", block)

    def test_selected_evidence_links_wrap_inside_their_column(self):
        self.assertIn(".pbg-selected-kv-row .pbg-ext-link", STYLE)
        self.assertIn("overflow-wrap: anywhere", STYLE)

    def test_optional_variant_scores_distinguish_missing_field_from_null_value(self):
        self.assertIn("function optionalAnnotationValue", ADAPTER)
        self.assertIn("Object.prototype.hasOwnProperty.call", ADAPTER)
        self.assertIn('optionalAnnotationValue(primary, ["REVEL", "revel", "revel_score"])', ADAPTER)
        self.assertIn('optionalAnnotationValue(primary, ["alphamissense", "AlphaMissense", "alphamissense_score", "am_pathogenicity"])', ADAPTER)
        self.assertIn('optionalAnnotationValue(primary, ["LoF", "lof", "lof_class", "LOFTEE"])', ADAPTER)

    def test_live_loading_reports_progress_and_indexes_carriers_once(self):
        self.assertIn("searchGeneProgress", MODEL)
        self.assertIn('aria-live="polite"', TEMPLATE)
        self.assertIn('class="pbg-loading-spinner"', TEMPLATE)
        self.assertIn('class="pbg-loading-text"', TEMPLATE)
        self.assertIn('class="pbg-loading-dots"', TEMPLATE)
        self.assertIn("@keyframes pbg-loading-spin", STYLE)
        self.assertIn("@keyframes pbg-loading-text-sweep", STYLE)
        self.assertIn("@keyframes pbg-loading-dot", STYLE)
        self.assertIn("prefers-reduced-motion: reduce", STYLE)
        progress_start = STYLE.index(".pbg-gene-search-progress {")
        progress_end = STYLE.index("}", progress_start)
        self.assertIn("font-size: 0.9rem", STYLE[progress_start:progress_end])
        breadcrumb_start = STYLE.index(".pbg-breadcrumb-link {")
        breadcrumb_end = STYLE.index("}", breadcrumb_start)
        self.assertIn("font-size: 1.08rem", STYLE[breadcrumb_start:breadcrumb_end])
        self.assertIn("sampleRowById", ADAPTER)
        self.assertNotIn("entry.sampleRows.find", ADAPTER)
        self.assertIn("onProgress", ADAPTER)
        self.assertIn("onPartial", ADAPTER)

    def test_live_gene_state_reuses_completed_and_pending_requests(self):
        self.assertIn("GENE_STATE_CACHE", ADAPTER)
        self.assertIn("GENE_STATE_PENDING", ADAPTER)
        self.assertIn("MAX_CACHED_GENES = 5", ADAPTER)
        self.assertIn("structuredClone", ADAPTER)

    def test_gene_level_omim_and_ensembl_ids_use_hgnc_reference(self):
        self.assertIn("PB_GENE_ID_REFERENCE", ADAPTER)
        self.assertIn('"DMD": ["ENSG00000198947","300377"]', GENE_IDS)
        self.assertIn("geneHgncLink", GENE_IDENTITY)
        self.assertIn("https://www.genenames.org/data/gene-symbol-report/#!/symbol/", GENE_IDENTITY)
        self.assertIn('class="pbg-gene-fullname-link"', GENE_IDENTITY)
        self.assertIn("geneOmimLinks", GENE_IDENTITY)
        self.assertIn("geneEnsemblLink", GENE_IDENTITY)
        self.assertIn("https://omim.org/entry/", GENE_IDENTITY)
        self.assertIn("https://www.ensembl.org/Homo_sapiens/Gene/Summary", GENE_IDENTITY)
        self.assertIn('rel="noopener noreferrer"', GENE_IDENTITY)
        self.assertIn(".pbg-meta-pill--link:focus-visible", STYLE)

    def test_a2fkp_and_subtle_variant_evidence_states_are_visible_without_extra_requests(self):
        self.assertIn(">A2FKP</a>", TEMPLATE)
        self.assertNotIn(">Public view</a>", TEMPLATE)
        self.assertIn('href="https://a2f.hugeamp.org/"', TEMPLATE)
        self.assertIn(".pbg-nav-link--a2fkp", STYLE)
        self.assertIn("pbg-selected-clinvar", TEMPLATE)
        self.assertIn(".pbg-selected-clinvar.pbg-badge--pathogenic", STYLE)
        self.assertIn(".pbg-selected-clinvar.pbg-badge--likely-path", STYLE)
        self.assertIn("hasRevelOnlyScore(row)", TEMPLATE)
        self.assertIn("pbg-revel-only-note", TEMPLATE)
        self.assertIn('.replace(/_/g, " ")', MODEL)
        self.assertIn(".split(/[&,;|/]+/)", MODEL)
        self.assertIn("Unavailable — the live BioIndex gene index does not provide an NCBI summary.", ADAPTER)

    def test_match_score_help_and_desktop_variant_table_are_lightweight(self):
        self.assertIn('class="pbg-score-help"', TEMPLATE)
        self.assertIn("Mean residual PheRS across the unique carriers", TEMPLATE)
        self.assertIn("--pbg-ve-min-width: 64rem", STYLE)
        self.assertIn("overflow-x: auto", STYLE)
        self.assertIn("GeneIdentityPanel", TEMPLATE)
        self.assertIn("HpoContextPanel", TEMPLATE)

    def test_density_columns_have_unique_vue_keys(self):
        self.assertIn("(col, colIndex) in locusDensityColumns", TEMPLATE)
        self.assertIn("'density-col-' + colIndex", TEMPLATE)

    def test_carrier_table_omits_hpo_and_adds_proband(self):
        self.assertNotIn("<span>HPO</span>", TEMPLATE)
        self.assertNotIn("{{ s.hpo }}", TEMPLATE)
        affected = TEMPLATE.index("<span>Affected</span>")
        proband = TEMPLATE.index("<span>Proband</span>")
        self.assertLess(affected, proband)

    def test_co_genes_collapses_after_three_names(self):
        self.assertIn("coGenePreview(s.genes)", TEMPLATE)
        self.assertIn("coGeneRemaining(s.genes)", TEMPLATE)
        self.assertIn("more</summary>", TEMPLATE)

    def test_removed_summary_metrics_do_not_return(self):
        self.assertNotIn("<em>Carriers</em>", TEMPLATE)
        self.assertNotIn("GenDx diagnosed", TEMPLATE)
        self.assertNotIn("Mean carrier burden", TEMPLATE)
        self.assertIn("Largest contributing clinical area", TEMPLATE)
        self.assertIn("metricRatio", TEMPLATE)


if __name__ == "__main__":
    unittest.main()
