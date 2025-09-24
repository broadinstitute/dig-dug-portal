import Vue from "vue";
import Template from "./Template.vue";
import store from "./store.js";
import "../../assets/layout.css";
import "../../assets/pkb-styles.css";
import { pankbaseMixin } from "@/portals/PanKbase/mixins/pankbaseMixin.js";
import ResearchSingleSearch from "@/components/researchPortal/ResearchSingleSearch.vue";
import TooltipDocumentation from "@/components/TooltipDocumentation.vue";
import NCATSPredicateTable from "@/components/NCATS/old/PredicateTable.vue";
import FilterPValue from "@/components/criterion/FilterPValue.vue";
import UnauthorizedMessage from "@/components/UnauthorizedMessage";
import GeneAssociationsMasks from "@/components/GeneAssociationsMasks";
import ResearchPheWAS from "@/components/researchPortal/ResearchPheWAS.vue";
import uiUtils from "@/utils/uiUtils";
import plotUtils from "@/utils/plotUtils";
import sortUtils from "@/utils/sortUtils";
import alertUtils from "@/utils/alertUtils";
import Formatters from "@/utils/formatters";
import dataConvert from "@/utils/dataConvert";
import keyParams from "@/utils/keyParams";
import regionUtils from "@/utils/regionUtils";

new Vue({
    // Based on HuGeAMP Gene page.
    store,
    components: {
        ResearchSingleSearch,
        TooltipDocumentation,
        NCATSPredicateTable,
        FilterPValue,
        UnauthorizedMessage,
        GeneAssociationsMasks,
        ResearchPheWAS
    },
    mixins: [pankbaseMixin],
    data() {
        return {
            jsonResults: null,
            searchConfig: {
            "search instruction": "Search for a gene",
            "search examples": [
                {
                    parameter: "gene",
                    value: "CFTR",
                }
            ],
            "search parameters": [
                {
                    parameter: "gene",
                    values: "kp genes",
                    "target page": {
                        label: "Search Gene",
                        url: "/gene.html?",
                    },
                }
            ],
            },
            queryText: null,
            phenotypeFilterList: [],
        };
    },
    watch: {
        region(region) {
            if (region) {
                //uiUtils.hideElement("pageSearchHeaderContent");
                this.$store.dispatch("queryGeneRegion", region);
            }
        },
        symbolName(symbol) {
            this.$store.dispatch("queryUniprot", symbol);
            this.$store.dispatch("queryAssociations");
            this.$store.dispatch("getHugeScoresData");
            this.$store.dispatch("getMouseData");
        },
    },
    async created() {
        keyParams.set({ gene: this.geneName });
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
                regionUtils: regionUtils,
            };
            return utils;
        },
        geneName(){
            return this.$store.state.geneName;
        },
        symbolName() {
            return this.$store.getters.canonicalSymbol;
        },
        region() {
            return this.$store.getters.region;
        },
        docDetails() {
            let symbol = this.geneSymbol;
            let r = this.region;

            if (!!symbol && !!r) {
                return {
                    gene: symbol,
                    region: `${r.chromosome}:${Formatters.intFormatter(
                        r.start
                    )}-${Formatters.intFormatter(r.end)}`,
                };
            }
            return {};
        },
        geneassociations() {
            let data = this.$store.state.geneassociations.data;

            if (!!this.diseaseInSession && this.diseaseInSession != "") {
                data = sessionUtils.getInSession(
                    data,
                    this.phenotypesInSession,
                    "phenotype"
                );
            }

            let assocMap = {};

            for (let i in data) {
                const assoc = data[i];

                // skip associations not part of the disease group
                if (!this.phenotypeMap[assoc.phenotype]) {
                    continue;
                }

                const curAssoc = assocMap[assoc.phenotype];
                if (!curAssoc || assoc.pValue < curAssoc.pValue) {
                    assocMap[assoc.phenotype] = assoc;
                }
            }

            // convert to an array, sorted by p-value
            let x = Object.values(assocMap).sort((a, b) => a.pValue - b.pValue);
            return x;
        },
        hugeScores() {
            let data = sortUtils.sortArrOfObjects(
                this.$store.state.hugeScores.data,
                "huge",
                "number",
                "desc"
            );

            if (!!this.diseaseInSession && this.diseaseInSession != "") {
                data = sessionUtils.getInSession(
                    data,
                    this.phenotypesInSession,
                    "phenotype"
                );
            }

            let hugeMap = {};

            for (let i in data) {
                const score = data[i];
                let phenotypeEntity =
                    this.$store.state.bioPortal.phenotypeMap[score.phenotype];
                score["group"] = phenotypeEntity
                    ? phenotypeEntity.group
                    : "No group info";
                score["renderScore"] = Math.log(data[i].huge);

                // skip associations not part of the disease group
                if (!this.phenotypeMap[score.phenotype]) {
                    continue;
                }

                hugeMap[score.phenotype] = score;
            }

            // convert to an array, sorted by p-value
            let x = Object.values(hugeMap);
            return x;
        },
        filteredAssociations() {
            return (
                this.geneassociations.filter((row) => {
                    return this.phenotypeMap[row.phenotype];
                }) || []
            );
        },
        phenotypeMap() {
            return this.$store.state.bioPortal.phenotypeMap;
        },
        transcriptOr52k() {
            let endpoint = !this.$store.state.selectedTranscript
                ? this.$store.state.associations52k
                : this.$store.state.transcriptAssoc;
            this.$store.state.restricted = endpoint.restricted;

            if (!!this.diseaseInSession && this.diseaseInSession != "") {
                endpoint.data = sessionUtils.getInSession(
                    endpoint.data,
                    this.phenotypesInSession,
                    "phenotype"
                );
            }

            let assocMap = {};

            for (let i in endpoint.data) {
                const assoc = endpoint.data[i];

                // skip associations not part of the disease group
                if (!this.phenotypeMap[assoc.phenotype]) {
                    continue;
                }

                const curAssoc = assocMap[assoc.phenotype];
                if (!curAssoc || assoc.pValue < curAssoc.pValue) {
                    assocMap[assoc.phenotype] = assoc;
                }
            }

            endpoint.data.sort(
                (a, b) =>
                    this.pValueFormatter(a.pValue) -
                    this.pValueFormatter(b.pValue)
            );

            return endpoint.data;
        },
    },
    methods: {
        tissueFormatter: Formatters.tissueFormatter,
        ancestryFormatter: Formatters.ancestryFormatter,
        filterPhenotype(newFilters) {
            this.phenotypeFilterList = newFilters;
        },
        renderPhewas(REF) {
            this.activeTab = REF;
            let refComponent = this.$children[0].$refs[REF];
            setTimeout(function () {
                refComponent.renderPheWas();
            }, 500);
        },
    },
    render(createElement, context) {
        return createElement(Template);
    },
}).$mount("#app");
