import Vue from "vue";
import Template from "./Template.vue";
import store from "./store.js";

import "../../assets/matkp-styles.css";

import { matkpMixin } from "../../mixins/matkpMixin.js";
import { getParams } from "@/portals/MATKP/utils/bioIndexTools.js";
import { getVolcanoConfig, PLOT_MARGIN } from "@/portals/MATKP/utils/visualizations.js";
import Scatterplot from "../../../../components/Scatterplot.vue";
import BulkHeatmap from "../../components/BulkHeatmap.vue";
import BulkVolcanoPlot from "../../components/BulkVolcanoPlot.vue";
import BulkTable from "../../components/BulkTable.vue";
import BulkViolinPlot from "../../components/BulkViolinPlot.vue";
import GeneSelectPicker from "../../../../components/GeneSelectPicker.vue";
import MouseGeneSelect from "../../../../components/MouseGeneSelect.vue";
import Formatters from "@/utils/formatters";
import uiUtils from "@/utils/uiUtils";
import CriterionFunctionGroup from "@/components/criterion/group/CriterionFunctionGroup.vue"
import FilterGreaterThan from "@/components/criterion/FilterGreaterThan.vue";
import ResearchSingleCellBrowser from "@/components/researchPortal/singleCellBrowser/ResearchSingleCellBrowser.vue"
import ResearchSingleCellInfo from "@/components/researchPortal/singleCellBrowser/ResearchSingleCellInfo.vue";
import * as scUtils from "@/components/researchPortal/singleCellBrowser/singleCellUtils.js"
import * as d3 from 'd3';
import keyParams from "@/utils/keyParams";
import { isNull } from "lodash";

//import { BIO_INDEX_HOST } from "@/utils/bioIndexUtils";
const BIO_INDEX_HOST = "https://matkp.hugeampkpnbi.org";

new Vue({
    store,
    components: {
        Scatterplot,
        BulkHeatmap,
        BulkVolcanoPlot,
        BulkTable,
        BulkViolinPlot,
        GeneSelectPicker,
        MouseGeneSelect,
        CriterionFunctionGroup,
        FilterGreaterThan,
        ResearchSingleCellBrowser,
        ResearchSingleCellInfo,
        uiUtils
    },
    mixins: [matkpMixin],
    props: [],
    data() {
        return {
            loading: true,
            dataReady: false,
            allMetadata: null,
            bulkMetadata: null,
            plotId: "bulk_heatmap",
            plotHeight: 300,
            chart: null,
            chartWidth: 0,
            datasets: [],
            endpoint: "single-cell-bulk-z-norm",
            documentation: null,
            utils: {
                uiUtils: uiUtils
            },
            colors: [
                "#007bff",
                "#048845",
                "#8490C8",
                "#BF61A5",
                "#EE3124",
                "#FCD700",
                "#5555FF",
                "#7aaa1c",
                "#9F78AC",
                "#F88084",
                "#F5A4C7",
                "#CEE6C1",
                "#cccc00",
                "#6FC7B6",
                "#D5A768",
                "#d4d4d4",
            ],
            margin: PLOT_MARGIN,
            svg: null,
            tableConfig: {
                fields: [
                    { key: "gene", label: "Gene", sortable: true },
                    {
                        key: "logFoldChange",
                        label: "log2 Fold Change",
                        sortable: true,
                        formatter: Formatters.tpmFormatter,
                    },
                    {
                        key: "-log10P",
                        label: "-log10(FDR adj. p)",
                        sortable: true,
                        formatter: Formatters.tpmFormatter,
                    },
                    { key: "expand", label: "Gene query" },
                ],
                queryParam: "gene",
                subtableEndpoint: "single-cell-bulk-melted",
                subtableFields: [
                    { key: "gene_set", label: "Gene set", sortable: true },
                    { key: "beta", label: "Effect (joint)", sortable: true },
                ],
            },
            volcanoYCondition: 1.3,
            volcanoXConditionGreater: 1.5,
            volcanoXConditionLower: -1.5,
        };
    },
    computed: {
        selectedDataset() {
            return this.$store.state.selectedDataset;
        },
        selectedComparison() {
            return this.$store.state.selectedComparison;
        },
        selectedGene() {
            return this.$store.state.selectedGene;
        },
        zNormData() {
            let outputData = structuredClone(this.$store.state.singleBulkZNormData);
            outputData.forEach(item => item["-log10P"] = item.log10FDR);
            return outputData;
        },
        bulkData19K() {
            return this.$store.state.bulkData19K.filter(
                item => item.gene !== undefined
                    && item.comparison_id === this.$store.state.selectedComparison);
        },
        volcanoConfig() {
            return getVolcanoConfig(
                this.volcanoXConditionGreater,
                this.volcanoXConditionLower,
                this.volcanoYCondition,
                this.plotHeight
            );
        },
        comparisons() {
            let items = Object.keys(this.$store.state.currentComparisons);
            return items;
        },
        kpDataset() {
            return keyParams.dataset;
        },
        kpComparison() {
            return keyParams.comparison;
        },
        kpGene() {
            return keyParams.gene;
        },
        isMouse() {
            return this.bulkMetadata?.species === 'Mus musculus';
        },
        regulationConditions(){
            return {
                xGreater: this.volcanoXConditionGreater,
                xLower: this.volcanoXConditionLower,
                yGreater: this.volcanoYCondition
            }
        }
    },
    async mounted() {
        this.init();
        this.getDocumentation();
    },
    created() {
    },
    methods: {
        async init() {
            if (!keyParams.dataset) {
                keyParams.set({ dataset: this.$store.state.selectedDataset });
            }
            if (!keyParams.gene) {
                keyParams.set({ gene: this.$store.state.selectedGene });
            }
            this.datasets = await getParams(this.endpoint);
            await this.getBulkMetadata();
            if (!keyParams.comparison) {
                this.$store.dispatch("resetComparison");
                keyParams.set({ comparison: this.$store.state.selectedComparison });
            }
            await this.$store.dispatch("queryBulkFile");
            await this.$store.dispatch("queryBulk");
            this.dataReady = true;

        },
        async getBulkMetadata() {
            if (!this.allMetadata) {
                let metadataUrl = `${BIO_INDEX_HOST}/api/raw/file/single_cell_all_metadata/dataset_metadata.json.gz`;
                let myMetadata = await scUtils.fetchMetadata(metadataUrl);
                this.allMetadata = myMetadata;
            }

            this.bulkMetadata = this.allMetadata.find(x => x.datasetId === this.selectedDataset);
            console.log(this.bulkMetadata.species);
        },
        async getDocumentation() {
            const CONTENT_URL = "https://hugeampkpncms.org/rest/byor_content?id=matkp_differentialgeneexpressionbrowser";

            let jsonContent = await fetch(CONTENT_URL).then(
                resp => resp.json());
            if (jsonContent.length === 0) {
                this.documentation = null;
            }

            this.documentation = jsonContent[0];

            console.log("this.pageContent", this.documentation);
        },
        getTop20(data) {
            let processedData = data.sort((a, b) => b.log10FDR - a.log10FDR).slice(0, 20);
            return processedData;
        },
        highlight(highlightedGene) {
            this.$store.state.selectedGene = highlightedGene;
        }

    },
    watch: {
        async selectedDataset(newData, oldData) {
            if (newData !== oldData) {
                keyParams.set({ dataset: newData });
                await this.$store.dispatch("queryBulkFile");
                await this.$store.dispatch("queryBulk");
                if (newData !== "") {
                    this.getBulkMetadata();
                }
            }
        },
        selectedComparison(newData, oldData) {
            if (newData !== oldData) {
                keyParams.set({ comparison: newData });
                this.$store.dispatch("queryBulk");
            }
        },
        selectedGene(newData, oldData) {
            if (newData !== oldData) {
                keyParams.set({ gene: newData });
            }
        },
        comparisons(newData) {
            if (!newData.includes(this.selectedComparison)) {
                this.$store.dispatch("resetComparison");
            }
        },
        kpDataset(newData, oldData) {
            if (newData !== oldData) {
                this.$store.state.selectedDataset = newData;
            }
        },
        kpComparison(newData, oldData) {
            if (newData !== oldData) {
                this.$store.state.selectedComparison = newData;
            }
        },
        kpGene(newData, oldData) {
            if (newData !== oldData) {
                this.$store.state.selectedGene = newData;
            }
        }
    },

    render(createElement, context) {
        return createElement(Template);
    },
}).$mount("#app");
