from pathlib import Path
import unittest


ROOT = Path(__file__).resolve().parents[1]
TEMPLATE = (ROOT / "src/views/PbGene/Template.vue").read_text()
MODEL = (ROOT / "src/views/PbGene/pageModel.js").read_text()
ADAPTER = (ROOT / "src/views/PbGene/pbGeneBioIndexAdapter.js").read_text()
STYLE = (ROOT / "src/views/PbGene/style.css").read_text()
VUE_CONFIG = (ROOT / "vue.config.js").read_text()


class PbGeneContextUiTest(unittest.TestCase):
    def test_context_controls_and_accumulating_result_table_exist(self):
        for text in ("HPO context", "Go", "Advanced", "Beta (Effect Size)", "P-value"):
            self.assertIn(text, TEMPLATE)
        self.assertIn("@submit.prevent=\"runContextAnalysis\"", TEMPLATE)
        self.assertIn("contextRuns.push", MODEL)

    def test_advanced_contains_statistical_filter_controls(self):
        for text in ("P-value", "FDR", "Threshold", "Minimum carriers"):
            self.assertIn(text, TEMPLATE)
        for field in ("contextSignificanceMetric", "contextSignificanceThreshold", "contextMinCarriers"):
            self.assertIn(field, MODEL)
        for field in ("significance_metric", "significance_threshold", "min_carriers"):
            self.assertIn(field, MODEL)

    def test_advanced_has_an_explicit_apply_and_run_submit(self):
        self.assertIn('class="pbg-context-advanced-apply"', TEMPLATE)
        self.assertIn('type="submit"', TEMPLATE)
        self.assertIn("Apply &amp; run", TEMPLATE)

    def test_default_threshold_does_not_block_form_submission(self):
        self.assertIn('v-model.number="contextSignificanceThreshold"', TEMPLATE)
        self.assertIn('step="any"', TEMPLATE)

    def test_score_labels_and_no_context_state_are_unambiguous(self):
        self.assertIn("Pathogenic Score", TEMPLATE)
        self.assertIn("Match Score (Context-based)", TEMPLATE)
        self.assertIn("no context", TEMPLATE)
        self.assertNotIn("Variant score <em>", TEMPLATE)
        self.assertNotIn("Match score <em>", TEMPLATE)

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
        ):
            self.assertIn(f"burden.{field}", MODEL)
        self.assertIn("Status / score coverage", TEMPLATE)
        self.assertIn("run.statusLabel", TEMPLATE)
        self.assertIn("run.coverageLabel", TEMPLATE)
        self.assertNotIn('return "Pending API"', MODEL)

    def test_local_context_fixture_is_explicit_and_dev_only(self):
        self.assertIn("PB_GENE_CONTEXT_FIXTURE_PATH", VUE_CONFIG)
        self.assertIn('app.get("/__pb_gene_context_fixture__"', VUE_CONFIG)
        self.assertIn("VUE_APP_PB_GENE_CONTEXT_FIXTURE", MODEL)
        self.assertIn('fetch("/__pb_gene_context_fixture__")', MODEL)
        self.assertIn("Local validation fixture", MODEL)
        self.assertIn("Local fixture supports only", MODEL)
        self.assertIn("run.sourceLabel", TEMPLATE)

    def test_local_context_fixture_does_not_call_live_bioindex(self):
        start = MODEL.index("async loadLiveGeneData")
        block = MODEL[start:MODEL.index("// ── gene-level tab", start)]
        self.assertIn("if (LOCAL_CONTEXT_FIXTURE_ENABLED)", block)
        self.assertIn("window.location.assign", block)

    def test_panelapp_is_explained_as_diagnostic_evidence(self):
        self.assertIn(">PanelApp</td>", TEMPLATE)
        self.assertNotIn("Diagnostic panels", TEMPLATE)
        self.assertIn("Diagnostic-grade panels", TEMPLATE)
        self.assertIn("Genomics England PanelApp", TEMPLATE)
        self.assertIn("No diagnostic-grade panel association found", TEMPLATE)
        self.assertNotIn("green panels", TEMPLATE)

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
