import Vue from "vue";
import Template from "./Template.vue";
import store from "./store.js";
import { pageMixin } from "@/mixins/pageMixin";
import { renderUmap, renderViolinPlot, renderScatterPlot } from "./canvasPlots.js";

const EMPTY_SUMMARY = { n: 0, avg_expression: 0, pct_expressing: 0, median: 0 };

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
            return this.cellTypeComparisonPoints.map((point) => ({ label: point.gene, x: point.x, y: point.y }));
        },
        cellTypeTableRows() {
            return [...this.cellTypeComparisonPoints]
                .filter((row) => row.leftSummary.n || row.rightSummary.n)
                .sort((a, b) => Math.max(b.x, b.y) - Math.max(a.x, a.y))
                .slice(0, 35);
        },
        leftCellTypeTableRows() {
            return this.cellTypeTableRows.map((row) => ({ label: row.gene, summary: row.leftSummary }));
        },
        rightCellTypeTableRows() {
            return this.cellTypeTableRows.map((row) => ({ label: row.gene, summary: row.rightSummary }));
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
        formatInteger(value) {
            return new Intl.NumberFormat("en-US").format(Number(value) || 0);
        },
        formatNumber(value) {
            return Number(value || 0).toFixed(3);
        },
        formatPercent(value) {
            return `${Math.round(Number(value || 0) * 100)}%`;
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
