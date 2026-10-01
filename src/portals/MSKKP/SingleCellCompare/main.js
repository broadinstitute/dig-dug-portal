import Vue from "vue";
import Template from "./Template.vue";
import store from "./store.js";
import { pageMixin } from "@/mixins/pageMixin";
import { renderUmap, renderViolinPlot, renderScatterPlot } from "./canvasPlots.js";
import Formatters from "@/utils/formatters";
// Side-effect imports: both Vue.component(...) calls register these globally, the
// same convention ResearchSingleCellBrowser.vue (chart downloads) and EnrichmentTable.vue
// / GeneFinderTable.vue (table downloads) use elsewhere in the app, so <download-chart>
// and <data-download> are available in Template.vue without any local registration.
import "@/components/researchPortal/singleCellBrowser/DownloadChart.vue";
import "@/components/DataDownload";

// Used when a cell type has no row at all for one side of the Gene Comparison card
// (that dataset simply has no cells of this type for the selected gene). Null fields
// render as "-" via formatInteger/formatNumber/formatPercent rather than a fabricated
// 0, which would misrepresent "no data" as "zero expression".
const EMPTY_SUMMARY = { n: null, avg_expression: null, pct_expressing: null, median: null };

new Vue({
    store,
    mixins: [pageMixin],
    data() {
        return {
            geneInput: store.state.selectedGene,
            genePlotNote: "",
            cellTypePlotNote: "",
            resizeFrame: null,
        };
    },
    computed: {
        tpl() {
            return this.$children[0];
        },
        datasets() {
            return this.$store.state.datasets;
        },
        // "Select Tissue(s) to Compare" pickers. The full tissue list comes from the
        // store (derived live from the metadata); leftDatasets/rightDatasets are the
        // dataset options after that side's tissue filter is applied, so the "Select
        // datasets" pickers below only offer datasets matching the chosen tissue.
        tissues() {
            return this.$store.state.tissues;
        },
        leftTissue: {
            get() {
                return this.$store.state.leftTissue;
            },
            set(value) {
                this.$store.dispatch("setLeftTissue", value);
            },
        },
        rightTissue: {
            get() {
                return this.$store.state.rightTissue;
            },
            set(value) {
                this.$store.dispatch("setRightTissue", value);
            },
        },
        leftDatasets() {
            return this.$store.getters.leftDatasets;
        },
        rightDatasets() {
            return this.$store.getters.rightDatasets;
        },
        leftId: {
            get() {
                return this.$store.state.leftId;
            },
            set(value) {
                this.$store.dispatch("setLeftDataset", value);
            },
        },
        rightId: {
            get() {
                return this.$store.state.rightId;
            },
            set(value) {
                this.$store.dispatch("setRightDataset", value);
            },
        },
        leftDataset() {
            return this.$store.getters.datasetById(this.leftId);
        },
        rightDataset() {
            return this.$store.getters.datasetById(this.rightId);
        },
        leftLabel() {
            return (this.leftDataset && this.leftDataset.label) || "Left dataset";
        },
        rightLabel() {
            return (this.rightDataset && this.rightDataset.label) || "Right dataset";
        },
        leftOverview() {
            return this.$store.state.overview[this.leftId];
        },
        rightOverview() {
            return this.$store.state.overview[this.rightId];
        },
        leftCountLabel() {
            if (this.leftOverview) return `${this.formatInteger(this.leftOverview.nCellsTotal)} cells`;
            return this.$store.state.overviewStatus[this.leftId] || "Loading";
        },
        rightCountLabel() {
            if (this.rightOverview) return `${this.formatInteger(this.rightOverview.nCellsTotal)} cells`;
            return this.$store.state.overviewStatus[this.rightId] || "Loading";
        },
        cellTypes() {
            return this.$store.state.cellTypes;
        },
        cellTypeColors() {
            return this.$store.state.cellTypeColors;
        },
        geneOptions() {
            return this.$store.state.genePanel;
        },
        genePanelCount() {
            return this.$store.state.genePanel.length;
        },
        cellTypeModel: {
            get() {
                return this.$store.state.selectedCellType;
            },
            set(value) {
                this.$store.dispatch("setCellType", value);
            },
        },
        geneStatusDisplay() {
            return this.$store.state.geneStatus || this.genePlotNote;
        },
        cellTypeStatusDisplay() {
            return this.$store.state.cellTypeStatus || this.cellTypePlotNote;
        },
        geneCategories() {
            const gc = this.$store.state.geneComparison;
            if (!gc) return [];
            const leftRows = new Map((gc.datasets[this.leftId] || []).map((row) => [row.cell_type, row]));
            const rightRows = new Map((gc.datasets[this.rightId] || []).map((row) => [row.cell_type, row]));
            const order = this.cellTypes.filter((ct) => leftRows.has(ct) || rightRows.has(ct));
            return order.map((ct) => ({
                label: this.formatLabel(ct),
                leftValues: (leftRows.get(ct) && leftRows.get(ct).values) || [],
                rightValues: (rightRows.get(ct) && rightRows.get(ct).values) || [],
                leftSummary: (leftRows.get(ct) && leftRows.get(ct).summary) || EMPTY_SUMMARY,
                rightSummary: (rightRows.get(ct) && rightRows.get(ct).summary) || EMPTY_SUMMARY,
            }));
        },
        leftGeneTableRows() {
            return this.geneCategories.map((row) => ({ label: row.label, summary: row.leftSummary }));
        },
        rightGeneTableRows() {
            return this.geneCategories.map((row) => ({ label: row.label, summary: row.rightSummary }));
        },
        cellTypeComparisonPoints() {
            const ctc = this.$store.state.cellTypeComparison;
            return (ctc && ctc.points) || [];
        },
        cellTypeScatterPoints() {
            // Points missing either side's data have a null x or y (see
            // loadCellTypeComparison in store.js) rather than a fabricated 0, so they
            // are excluded from the scatter entirely instead of plotting a false
            // coordinate. They still appear in the summary tables below.
            return this.cellTypeComparisonPoints
                .filter((point) => point.hasBothSummaries)
                .map((point) => ({ label: point.gene, x: point.x, y: point.y }));
        },
        cellTypeTableRows() {
            // Unlike the scatter, the tables show every gene with data on at least
            // one side - including genes missing from one dataset's marker file -
            // since each table only reports its own dataset's summary.
            return [...this.cellTypeComparisonPoints]
                .sort((a, b) => Math.max(b.x || 0, b.y || 0) - Math.max(a.x || 0, a.y || 0))
                .slice(0, 35);
        },
        leftCellTypeTableRows() {
            return this.cellTypeTableRows.map((row) => ({ label: row.gene, summary: row.leftSummary }));
        },
        rightCellTypeTableRows() {
            return this.cellTypeTableRows.map((row) => ({ label: row.gene, summary: row.rightSummary }));
        },
        // Flat row shapes for <data-download> (uiUtils.convertJson2Csv/Tsv expect plain,
        // non-nested objects - the display rows above nest their numbers under
        // `row.summary`, so these mirror them one level flat instead of re-deriving).
        leftGeneTableCsvRows() {
            return this.leftGeneTableRows.map((row) => ({
                cell_type: row.label,
                avg_expression: row.summary.avg_expression,
                pct_expressing: row.summary.pct_expressing,
                n: row.summary.n,
            }));
        },
        rightGeneTableCsvRows() {
            return this.rightGeneTableRows.map((row) => ({
                cell_type: row.label,
                avg_expression: row.summary.avg_expression,
                pct_expressing: row.summary.pct_expressing,
                n: row.summary.n,
            }));
        },
        leftCellTypeTableCsvRows() {
            return this.leftCellTypeTableRows.map((row) => ({
                gene: row.label,
                p_value_adj: row.summary.p_value_adj,
                log_fold_change: row.summary.log_fold_change,
                pct_expressing: row.summary.pct_expressing,
                mean_expression_scaled: row.summary.mean_expression_scaled,
            }));
        },
        rightCellTypeTableCsvRows() {
            return this.rightCellTypeTableRows.map((row) => ({
                gene: row.label,
                p_value_adj: row.summary.p_value_adj,
                log_fold_change: row.summary.log_fold_change,
                pct_expressing: row.summary.pct_expressing,
                mean_expression_scaled: row.summary.mean_expression_scaled,
            }));
        },
    },
    watch: {
        leftOverview() {
            this.$nextTick(this.redrawOverview);
        },
        rightOverview() {
            this.$nextTick(this.redrawOverview);
        },
        geneCategories() {
            this.$nextTick(this.redrawGenePlot);
        },
        cellTypeScatterPoints() {
            this.$nextTick(this.redrawCellTypePlot);
        },
        "$store.state.selectedGene"(gene) {
            this.geneInput = gene;
        },
    },
    created() {
        this.$store.dispatch("bioPortal/getDiseaseGroups");
        this.$store.dispatch("kp4cd/getNewsFeed", "msk");
        this.$store.dispatch("kp4cd/getFrontContents", "msk");
        this.$store.dispatch("init");
    },
    mounted() {
        window.addEventListener("resize", this.scheduleResize);
    },
    beforeDestroy() {
        window.removeEventListener("resize", this.scheduleResize);
        if (this.resizeFrame) window.cancelAnimationFrame(this.resizeFrame);
    },
    methods: {
        formatLabel(value) {
            return String(value || "").replace(/_/g, " ");
        },
        // Turns a dataset/gene/cell-type label into a safe download filename segment.
        slug(value) {
            return String(value || "")
                .toLowerCase()
                .replace(/[^a-z0-9]+/g, "_")
                .replace(/^_+|_+$/g, "") || "dataset";
        },
        // Text shown inside each "Select dataset" <option> - plain <option> elements
        // can't render HTML, so this builds a newline-separated, labeled block
        // (Name / PMID or DOI / Summary) instead of a single inline string. Most
        // browsers preserve the line breaks in rendered <option> text. The same
        // string is also used as the option's title attribute so it's available
        // on hover regardless of how the browser lays out the option itself.
        formatDatasetOption(d) {
            if (!d) return "";
            const lines = [`${d.datasetName || d.label}`];
            if (d.pmid || d.doi) {
                const idParts = [];
                if (d.pmid) idParts.push(`PMID: ${d.pmid}`);
                if (d.doi) idParts.push(`DOI: ${d.doi}`);
                lines.push(idParts.join(" / "));
            }
            //lines.push(`Summary: ${d.summary || "N/A"}`);
            return lines.join("\n");
        },
        formatInteger(value) {
            if (value === null || value === undefined || value === "") return "-";
            const num = Number(value);
            return Number.isFinite(num) ? new Intl.NumberFormat("en-US").format(num) : "-";
        },
        formatNumber(value) {
            if (value === null || value === undefined || value === "") return "-";
            const num = Number(value);
            return Number.isFinite(num) ? num.toFixed(3) : "-";
        },
        formatPercent(value) {
            if (value === null || value === undefined || value === "") return "-";
            const num = Number(value);
            return Number.isFinite(num) ? `${Math.round(num * 100)}%` : "-";
        },
        formatPValue: Formatters.pValueFormatter,
        formatSigned(value) {
            if (value === null || value === undefined || value === "") return "-";
            const num = Number(value);
            if (!Number.isFinite(num)) return "-";
            return `${num > 0 ? "+" : ""}${num.toFixed(3)}`;
        },
        applyGene() {
            const gene = (this.geneInput || "").trim();
            if (!gene) return;
            this.$store.dispatch("setGene", gene);
        },
        redrawOverview() {
            const tpl = this.tpl;
            if (!tpl || !tpl.$refs) return;
            if (tpl.$refs.leftUmap) {
                renderUmap(tpl.$refs.leftUmap, (this.leftOverview && this.leftOverview.cells) || [], this.cellTypeColors);
            }
            if (tpl.$refs.rightUmap) {
                renderUmap(tpl.$refs.rightUmap, (this.rightOverview && this.rightOverview.cells) || [], this.cellTypeColors);
            }
        },
        redrawGenePlot() {
            const tpl = this.tpl;
            if (!tpl || !tpl.$refs || !tpl.$refs.genePlot) return;
            this.genePlotNote = renderViolinPlot(tpl.$refs.genePlot, this.geneCategories, "Expression");
        },
        redrawCellTypePlot() {
            const tpl = this.tpl;
            if (!tpl || !tpl.$refs || !tpl.$refs.cellTypePlot) return;
            this.cellTypePlotNote = renderScatterPlot(tpl.$refs.cellTypePlot, this.cellTypeScatterPoints, this.leftLabel, this.rightLabel);
        },
        scheduleResize() {
            if (this.resizeFrame) window.cancelAnimationFrame(this.resizeFrame);
            this.resizeFrame = window.requestAnimationFrame(() => {
                this.redrawOverview();
                this.redrawGenePlot();
                this.redrawCellTypePlot();
            });
        },
    },
    render: (h) => h(Template),
}).$mount("#app");
