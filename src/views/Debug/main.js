import Vue from "vue";
import BootstrapVue from "bootstrap-vue";
import Template from "./Template.vue";
import store from "./store.js";

import Documentation from "@/components/Documentation.vue";
import TooltipDocumentation from "@/components/TooltipDocumentation.vue";
import CriterionFunctionGroup from "@/components/criterion/group/CriterionFunctionGroup.vue";
import CriterionListGroup from "@/components/criterion/group/CriterionListGroup.vue";
import FilterPValue from "@/components/criterion/FilterPValue.vue";
import FilterEnumeration from "@/components/criterion/FilterEnumeration.vue";
import FilterGreaterThan from "@/components/criterion/FilterGreaterThan.vue";
import FilterBasic from "@/components/criterion/FilterBasic";
import Formatters from "@/utils/formatters";
import keyParams from "@/utils/keyParams";
import { match } from "@/utils/bioIndexUtils";
import { pageMixin } from "@/mixins/pageMixin";
import { isEqual, startCase } from "lodash";
import { query } from "@/utils/bioIndexUtils";

Vue.use(BootstrapVue);
Vue.config.productionTip = false;

new Vue({
    store,
    mixins: [pageMixin],
    components: {
        Documentation,
        CriterionFunctionGroup,
        CriterionListGroup,
        FilterPValue,
        FilterEnumeration,
        FilterGreaterThan,
        FilterBasic,
        TooltipDocumentation
    },
    render(createElement, context) {
        return createElement(Template);
    },
    data() {
        return {
            matchingGenes: [],
            phenotypes: [{ "name": "T2D", "description": "Type 2 Diabetes" }],
            hugecalSearchCriterion: keyParams.gene
                ? [{
                    field: "gene",
                    threshold: keyParams.gene
                }] : []
        };
    },
    created() {
        this.$store.dispatch("bioPortal/getDiseaseGroups");
        this.$store.dispatch("bioPortal/getPhenotypes");
        this.$store.dispatch("bioPortal/getDatasets");
        this.$store.dispatch("ldServer/getPhenotypes");
    },
    computed: {
        selectedGene() {
            return this.hugecalSearchCriterion
                .filter(v => {
                    return v.field === "gene";
                })
                .map(v => v.threshold);
        },
        selectedPhenotype() {
            return this.hugecalSearchCriterion
                .filter(v => {
                    return v.field === "phenotype";
                })
                .map(v => v.threshold);
        },
        criterion() {
            return {
                gene: this.selectedGene,
                phenotype: this.selectedPhenotype
            }
        },
        isGWASSignificantAssociation() {
            if (!!this.$store.state.associationsData.length > 0) {
                let data = this.$store.state.associationsData;
                for (let i = 0; i < data.length; i++) {
                    if (data[i].pValue <= 5e-8) {
                        return true;
                    }
                }
                return false;
            }
        },
        eglData() {
            let geneSymbol = this.selectedGene[0];
            if (!!this.$store.state.kp4cd.eglData.data) {
                let effectordata = this.$store.state.kp4cd.eglData.data;
                let effectorGeneData = {}

                for (var i = 0; i < effectordata.length; ++i) {
                    if (effectordata[i].gene.toLowerCase() === geneSymbol.toLowerCase()) {
                        effectorGeneData = effectordata[i];

                        if (effectorGeneData.category == "(T2D_related)") {
                            effectorGeneData.category = "No Evidence"
                        }
                        break;
                    }
                    //if the gene is in GWAS but not in mccarthy data
                    else {
                        effectorGeneData["category"] = "in GWAS"
                    }
                }
                return effectorGeneData;
            }
        },
    },
    methods: {
        async lookupGenes(input) {
            if (!!input) {
                let matches = await match("gene", input, { limit: 10 });
                this.matchingGenes = matches;
            }
        },

        updateAssociations(gene, phenotype) {
            //this call goes to store to get associations data
            // this.$store.dispatch("getAssociations", { phenotype: this.selectedPhenotype, gene: this.selectedGene })

            if (phenotype.length > 0) {
                query(`associations`, `${phenotype},${gene}`).then(bioIndexData => {
                    this.$store.commit("setAssociationsData", bioIndexData)
                });
                this.$store.dispatch("getEGLData", phenotype[0]);
            }
        },
    },

    watch: {
        diseaseGroup(group) {
            this.$store.dispatch("kp4cd/getFrontContents", group.name);
        },
        criterion(newCriterion, oldCriterion) {
            console.log("Search crietria" + newCriterion, oldCriterion)
            this.updateAssociations(this.selectedGene, this.selectedPhenotype);
        }

    }
}).$mount("#app");
