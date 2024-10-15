import Vue from "vue";
import Template from "./Template.vue";
import store from "./store.js";

import AncestrySelectPicker from "@/components/AncestrySelectPicker.vue";
import AssociationsTable from "@/components/AssociationsTable.vue";
import GeneFinderTable from "@/components/GeneFinderTable.vue";
import EnrichmentTable from "@/components/EnrichmentTable.vue";
import DatasetsTable from "@/components/DatasetsTable.vue";
import CorrelationTable from "@/components/CorrelationTable.vue";
import PathwayTable from "@/components/PathwayTable.vue";
import C2ctTable from "@/components/C2ctTable.vue";
import ResearchMPlot from "@/components/researchPortal/ResearchMPlot.vue";
import PhenotypeHugeScores from "@/components/PhenotypeHugeScores.vue";
import EffectorGenesSection from "@/components/EffectorGenesSection.vue";
import RawImage from "@/components/RawImage.vue";
import MetaAnalysisBarGraph from "@/components/MetaAnalysisBarGraph.vue";

import uiUtils from "@/utils/uiUtils";
import plotUtils from "@/utils/plotUtils";
import sortUtils from "@/utils/sortUtils";
import alertUtils from "@/utils/alertUtils";
import Formatters from "@/utils/formatters";
import dataConvert from "@/utils/dataConvert";
import keyParams from "@/utils/keyParams";
import sessionUtils from "@/utils/sessionUtils";
import regionUtils from "@/utils/regionUtils";

import FilterPValue from "@/components/criterion/FilterPValue.vue";
import FilterEnumeration from "@/components/criterion/FilterEnumeration.vue";
import FilterGreaterThan from "@/components/criterion/FilterGreaterThan.vue";
import FilterLessThan from "@/components/criterion/FilterLessThan.vue";
import CriterionFunctionGroup from "@/components/criterion/group/CriterionFunctionGroup.vue";
import CriterionListGroup from "@/components/criterion/group/CriterionFunctionGroup.vue";
import FilterEffectDirection from "@/components/criterion/FilterEffectDirection.vue";
import SearchHeaderWrapper from "@/components/SearchHeaderWrapper.vue";
import ResearchSingleSearch from "@/components/researchPortal/ResearchSingleSearch.vue";
import { pageMixin } from "@/mixins/pageMixin.js";
new Vue({
    store,
    components: {
        AncestrySelectPicker,
        GeneFinderTable,
        AssociationsTable,
        EnrichmentTable,
        DatasetsTable,
        CorrelationTable,
        PathwayTable,
        RawImage,
        EffectorGenesSection,
        CriterionFunctionGroup,
        CriterionListGroup,
        FilterPValue,
        FilterGreaterThan,
        FilterLessThan,
        FilterEnumeration,
        FilterEffectDirection,
        SearchHeaderWrapper,
        ResearchMPlot,
        PhenotypeHugeScores,
        C2ctTable,
        ResearchSingleSearch,
        MetaAnalysisBarGraph,
    },
    mixins: [pageMixin],
    data() {
        return {
            phenotypeSearchKey: null,
            newPhenotypeSearchKey: null,
            hidePValueFilter: true,
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
                regionUtils: regionUtils,
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
        ancestryDatasets() {
            if (!this.$store.state.ancestry) {
                return this.$store.state.bioPortal.datasets;
            }
            return this.$store.state.bioPortal.datasets.filter(
                (dataset) => dataset.ancestry == this.$store.state.ancestry
            );
        },
        ancestryAnnotations() {
            let data = this.$store.state.annotations.data;
            if (this.$store.state.ancestry) {
                data = data.filter(
                    (annotation) =>
                        annotation.ancestry == this.$store.state.ancestry
                );
            }
            let filteredData = data.filter((d) => d.pValue < 1e-5);
            if (filteredData.length < 20) {
                filteredData = data
                    .sort((a, b) => a.pValue - b.pValue)
                    .slice(0, 20);
            }
            return filteredData;
        },
        frontContents() {
            let contents = this.$store.state.kp4cd.frontContents;

            if (contents.length === 0) {
                return {};
            }

            return contents[0];
        },
        diseaseGroup() {
            return this.$store.getters["bioPortal/diseaseGroup"];
        },
        manhattanPlot() {
            let phenotype = this.$store.state.phenotype;
            let ancestry = this.$store.state.ancestry;

            if (phenotype) {
                if (!ancestry) {
                    return `/api/raw/plot/phenotype/${phenotype.name}/manhattan.png`;
                } else {
                    return `api/raw/plot/phenotype/${phenotype.name}/${ancestry}/manhattan.png`;
                }
            }
        },
        qqPlot() {
            let phenotype = this.$store.state.phenotype;
            let ancestry = this.$store.state.ancestry;

            if (phenotype) {
                if (!ancestry) {
                    return `/api/raw/plot/phenotype/${phenotype.name}/qq.png`;
                } else {
                    return `/api/raw/plot/phenotype/${phenotype.name}/${ancestry}/qq.png`;
                }
            }
        },
        geneticCorrelationData() {
            let data = this.$store.state.geneticCorrelation.data;
            let focusedData;

            if (!!this.diseaseInSession && this.diseaseInSession != "") {
                focusedData = sessionUtils.getInSession(
                    data,
                    this.phenotypesInSession,
                    "other_phenotype"
                );
            } else {
                focusedData = data;
            }

            return focusedData;
        },
        c2ctData() {
            let data = this.$store.state.c2ct.data;
            data.forEach((d) => {
                // Makes biosamples show up alphabetically in the dropdown menu.
                d.originalBiosample = d.biosample;
                d.biosample = Formatters.tissueFormatter(d.biosample);
            });
            return data;
        },
    },

    watch: {
        "$store.state.bioPortal.phenotypeMap": function (phenotypeMap) {
            let name = keyParams.phenotype;
            let phenotype = phenotypeMap[name];

            if (phenotype) {
                this.$store.state.selectedPhenotype = phenotype;
                keyParams.set({ phenotype: phenotype.name });
            }
            //Initial query. Should only happen once.
            this.$store.dispatch("queryPhenotype");
        },

        "$store.state.phenotype": function (phenotype) {
            keyParams.set({ phenotype: phenotype.name });
            uiUtils.hideElement("phenotypeSearchHolder");
        },
        "$store.state.ancestry": function (ancestry) {
            keyParams.set({ ancestry: ancestry });
            uiUtils.hideElement("phenotypeSearchHolder");
        },
        diseaseGroup(group) {
            this.$store.dispatch("kp4cd/getFrontContents", group.name);
        },
        hidePValueFilter(hide) {
            let pValuePills = document.querySelectorAll(
                ".geneLevelAssoc .filter-pill-pValue"
            );
            let genePills = document.querySelectorAll(
                ".geneLevelAssoc .filter-pill-gene"
            );
            let allFilterPills = document.querySelectorAll(
                ".geneLevelAssoc .filter-pill-collection"
            );
            if (hide) {
                if (pValuePills.length > 0 && genePills.length > 0) {
                    pValuePills.forEach((e) => (e.hidden = true));
                } else if (pValuePills.length > 0 && genePills.length === 0) {
                    allFilterPills.forEach((e) => (e.hidden = true));
                }
            } else {
                allFilterPills.forEach((e) => (e.hidden = false));
                pValuePills.forEach((e) => (e.hidden = false));
            }
        },
    },

    created() {
        this.$store.dispatch("bioPortal/getDiseaseSystems");
        this.$store.dispatch("bioPortal/getDiseaseGroups");
        this.$store.dispatch("bioPortal/getPhenotypes");
        this.$store.dispatch("bioPortal/getDatasets");
        this.$store.dispatch("bioPortal/getDocumentations");
    },
    methods: {
        ...uiUtils,
        ...sessionUtils,
        intFormatter: Formatters.intFormatter,
        ancestryFormatter: Formatters.ancestryFormatter,
        maFormatter(value) {
            return value
                .split(";")
                .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
                .join(" + ");
        },
        setSelectedPhenotype(PHENOTYPE) {
            this.newPhenotypeSearchKey = PHENOTYPE.description;
            this.phenotypeSearchKey = null;
            this.$store.dispatch("selectedPhenotype", PHENOTYPE);
        },
        ifPhenotypeInSearch(DESCRIPTION) {
            let searchKeys = this.phenotypeSearchKey.split(" ");
            let isInPhenotype = 0;

            searchKeys.map((w) => {
                if (DESCRIPTION.toLowerCase().includes(w.toLowerCase())) {
                    isInPhenotype++;
                }
            });

            return isInPhenotype == searchKeys.length ? true : null;
        },
        clickedTab(tabLabel) {
            this.hidePValueFilter = tabLabel === "hugescore";
        },
    },

    render(createElement, context) {
        return createElement(Template);
    },
}).$mount("#app");
