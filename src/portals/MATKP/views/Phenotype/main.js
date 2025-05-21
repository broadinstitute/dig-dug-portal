import Vue from "vue";
import Template from "./Template.vue";
import store from "./store.js";
import _ from "lodash";

import "../../assets/matkp-styles.css";

import { matkpMixin } from "../../mixins/matkpMixin.js";
import { getTextContent } from "@/portals/MATKP/utils/content";

import UniprotReferencesTable from "@/components/UniprotReferencesTable.vue";
import GeneAssociationsTable from "@/components/GeneAssociationsTable";
import GeneAssociationsMasks from "@/components/GeneAssociationsMasks";
import UnauthorizedMessage from "@/components/UnauthorizedMessage";
import Documentation from "@/components/Documentation.vue";
import TooltipDocumentation from "@/components/TooltipDocumentation.vue";
import Autocomplete from "@/components/Autocomplete.vue";
import GeneSelectPicker from "@/components/GeneSelectPicker.vue";
import AncestrySelectPicker from "@/components/AncestrySelectPicker";
import TranscriptSelectPicker from "@/components/TranscriptSelectPicker";
import VariantSearch from "@/components/VariantSearch.vue";
import LocusZoom from "@/components/lz/LocusZoom";
import LocusZoomPhewasPanel from "@/components/lz/panels/LocusZoomPhewasPanel";
import ResearchPheWAS from "@/components/researchPortal/ResearchPheWAS.vue";
import HugeScoresTable from "@/components/HugeScoresTable.vue";
import ResearchExpressionDisplay from "@/components/researchPortal/ResearchExpressionDisplay.vue";
import ResearchDataTable from "@/components/researchPortal/ResearchDataTable.vue";
import EffectorGenesSectionOnGene from "@/components/EffectorGenesSectionOnGene.vue";
import MouseSummaryTable from "@/components/MouseSummaryTable.vue";
import ColocusTable from "@/components/ColocusTable.vue";
import CriterionFunctionGroup from "@/components/criterion/group/CriterionFunctionGroup.vue";
import FilterPValue from "@/components/criterion/FilterPValue.vue";
import FilterEnumeration from "@/components/criterion/FilterEnumeration.vue";
import FilterGreaterThan from "@/components/criterion/FilterGreaterThan.vue";
import ColorBarPlot from "@/components/ColorBarPlot.vue";
import SearchHeaderWrapper from "@/components/SearchHeaderWrapper.vue";
import ResearchSingleSearch from "@/components/researchPortal/ResearchSingleSearch.vue";
import GenePageCombinedEvidenceTable from "@/components/GenePageCombinedEvidenceTable.vue";

import ResearchBarPlot from "@/components/researchPortal/ResearchBarPlot"
import ResearchBoxPlot from "@/components/researchPortal/ResearchBoxPlot"

import NCATSPredicateTable from "@/components/NCATS/old/PredicateTable.vue";
import ResultsDashboard from "@/components/NCATS/ResultsDashboard.vue";

import sessionUtils from "@/utils/sessionUtils";
import HugeCalScoreSection from "@/components/HugeCalScoreSection.vue";

import ResearchSingleCellBrowser from "@/components/researchPortal/singleCellBrowser/ResearchSingleCellBrowser.vue"

import Counter from "@/utils/idCounter";
import regionUtils from "@/utils/regionUtils";

import uiUtils from "@/utils/uiUtils";
import plotUtils from "@/utils/plotUtils";
import sortUtils from "@/utils/sortUtils";
import alertUtils from "@/utils/alertUtils";
import Formatters from "@/utils/formatters";
import dataConvert from "@/utils/dataConvert";
import keyParams from "@/utils/keyParams";
import filterUtils from "@/utils/filterUtils";
import { pageMixin } from "@/mixins/pageMixin.js";

Vue.config.productionTip = false;

new Vue({
    store,
    modules: {},
    components: {
        UniprotReferencesTable,
        GeneAssociationsTable,
        GeneAssociationsMasks,
        Documentation,
        TooltipDocumentation,
        Autocomplete,
        GeneSelectPicker,
        AncestrySelectPicker,
        TranscriptSelectPicker,
        UnauthorizedMessage,
        CriterionFunctionGroup,
        FilterPValue,
        FilterEnumeration,
        FilterGreaterThan,
        LocusZoom,
        LocusZoomPhewasPanel,
        ResearchPheWAS,
        ResearchExpressionDisplay,
        ResearchDataTable,
        SearchHeaderWrapper,
        ResultsDashboard,
        NCATSPredicateTable,
        VariantSearch,
        ColorBarPlot,
        GenePageCombinedEvidenceTable,
        HugeCalScoreSection,
        HugeScoresTable,
        EffectorGenesSectionOnGene,
        ResearchSingleSearch,
        MouseSummaryTable,
        ColocusTable,
        ResearchBarPlot,
        ResearchBoxPlot,
        ResearchSingleCellBrowser
    },
    mixins: [pageMixin, matkpMixin],

    data() {
        return {
            byor_phenotype_page: "matkp_phenotypes",
            matkpPhenotypes: null
        };
    },

    computed: {
        utilsBox() {
            let utils = {
                Formatters: Formatters,
                uiUtils: uiUtils,
                alertUtils: alertUtils,
                keyParams: keyParams,
                dataConvert: dataConvert,
                sortUtils: sortUtils,
                plotUtils: plotUtils,
                regionUtils: regionUtils
            };
            return utils;
        },
        /// for disease systems
        diseaseInSession() {
            if (this.$store.state.diseaseInSession == null) {
                return "";
            } else {
                return this.$store.state.diseaseInSession;
            }
        },
        phenotypesInSession() {
            if (this.$store.state.phenotypesInSession == null) {
                return this.$store.state.bioPortal.phenotypes;
            } else {
                return this.$store.state.phenotypesInSession;
            }
        },
        rawPhenotypes() {
            return this.$store.state.bioPortal.phenotypes;
        },
        ///
        phenotypeOptions() {
            return this.phenotypesInSession
                .filter((x) => x.name != this.$store.state.phenotype)
                .map((phenotype) => phenotype.name);
        },
    },

    watch: {
    },

    async created() {
        this.matkpPhenotypes = await getTextContent(this.byor_phenotype_page);
        console.log(this.matkpPhenotypes);
    },

    methods: {
        ...uiUtils,
        ...sessionUtils,
        ...filterUtils,
        ancestryFormatter: Formatters.ancestryFormatter,
        pValueFormatter: Formatters.pValueFormatter,

        async checkGeneName(KEY) {
            let gene = await regionUtils.geneSymbol(KEY);

            if (!!gene && gene != KEY) {
                document.getElementById("invalidGeneMessage").innerHTML =
                    "Your search term is an alias name for gene symbol " +
                    gene +
                    ". Please enter a new search term above, or go to the " +
                    gene +
                    " Gene page";

                document
                    .getElementById("invalidGeneRedirect")
                    .setAttribute("href", "/gene.html?gene=" + gene);
                uiUtils.showElement("invalidGeneWarning");
                //uiUtils.showElement("pageSearchHeaderContent");
            }
        },

        hideGeneWarning() {
            uiUtils.hideElement("invalidGeneWarning");
        },

        pushCriterionPhenotype(phenotypeName) {
            this.genePageSearchCriterion.push({
                field: "phenotype",
                threshold: phenotypeName,
            });
        },
        biolinkQueryGraph(subjectCurie, { subject, predicate, object }) {
            const uuid = Counter.getUniqueId;
            const sid = uuid("s");
            const oid = uuid("o");
            const eid = uuid("e");
            return {
                query_graph: {
                    nodes: {
                        [sid]: {
                            id: subjectCurie,
                            category: subject,
                        },
                        [oid]: {
                            category: object,
                        },
                    },
                    edges: {
                        [eid]: {
                            subject: sid,
                            object: oid,
                            predicate: predicate,
                        },
                    },
                },
            };
        },

        // go to region page
        exploreRegion(expanded = 0) {
            let r = this.region;

            if (r) {
                window.location.href = `./region.html?chr=${
                    r.chromosome
                }&start=${r.start - expanded}&end=${r.end + expanded}`;
            }
        },

        topPhenotype(topAssocData) {
            return topAssocData[0];
        },
        renderPhewas(REF) {
            this.activeTab = REF;
            let refComponent = this.$children[0].$refs[REF];
            setTimeout(function () {
                refComponent.renderPheWas();
            }, 500);
        },
        filterPhenotype(newFilters) {
            this.phenotypeFilterList = newFilters;
        },
        clearCriterion(criterion) {
            if (criterion === "transcript") {
                this.$store.state.selectedTranscript = "";
                return;
            }
            if (criterion === "ancestry") {
                this.$store.state.selectedAncestry = "";
                return;
            }
        },

        async getGeneSigs(){
            const dataUrl = "https://matkp.hugeampkpnbi.org/api/bio/query/single-cell-gene?q="+this.$store.state.geneName;
            let contentJson = await fetch(dataUrl).then((resp) => resp.json());
            if (contentJson.error == null) {
                this.geneSigsData = contentJson.data;
                console.log('geneSigsData', this.geneSigsData);
            }
        },

        buildGeneSigUrl(item){
            let url = item.datasetType === 'bulk_rna' ? "/bulkbrowser.html?dataset=" : "/cellbrowser.html?datasetId=";
            url += `${item.datasetId}&gene=${item.gene}`
            return url;
        },

        async getGTExdata(){
            const dataUrl = "https://cfde.hugeampkpnbi.org/api/bio/query/gtex-tstat?q="+this.$store.state.geneName;
            let contentJson = await fetch(dataUrl).then((resp) => resp.json());
            if (contentJson.error == null) {
                this.GTExData = contentJson.data;
                console.log("GTExData", this.GTExData)
            }
        },
        async getGTExdata2(){
            const dataUrl = "https://bioindex-dev.hugeamp.org/api/bio/query/gene-expression?q="+this.$store.state.geneName;
            let contentJson = await fetch(dataUrl).then((resp) => resp.json());
            if (contentJson.error == null) {
                const filtered = this.checkPreFilters(contentJson.data);
                this.GTExData2 = filtered;
                console.log("GTExData2", this.GTExData2)
            }
        },
        renderGTEx(REF) {
            this.activeTab = REF;
            let refComponent = this.$children[0].$refs[REF];
            console.log(this.activeTab, refComponent)
            setTimeout(function () {
                refComponent.renderBoxPlot();
            }, 500);
        },

        filterGTEx(newFilters) {
            //this.phenotypeFilterList = newFilters;
            console.log('newFilters'. newFilters);
        },
        checkPreFilters(DATA) {
			//Apply pre filters as data gets loaded;
			let returnData = DATA;
            let filters = [
                {
                    "field": "collection",
                    "value": "GTEx",
                    "type": "search"
                }
            ];
            let filterValues = {}
            /*
            filters.map(filter => {
                filterValues[filter.parameter] = this.utils.keyParams[filter.parameter];
            })
            */
            returnData = filterUtils.applyFilters(filters, DATA, filterValues);

			return returnData;
		},

        getTooltip(tooltipId){
            if (!this.tooltips.find(t => t["ID"] === tooltipId)){
                return "Tooltip Not Found";
            }
            let tooltipItem = this.tooltips.find(t => t["ID"] === tooltipId);
            return tooltipItem["Content"];
        }
    },

    render(createElement, context) {
        return createElement(Template);
    },
}).$mount("#app");
